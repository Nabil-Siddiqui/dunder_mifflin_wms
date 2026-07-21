// ============================================================
// Sales Order Controller
// ============================================================
// Core business workflow of the system:
//   1. Sales Rep creates a Sales Order for one of their OWN
//      assigned clients.
//   2. Manager approves or rejects it.
//        - If approved and stock is sufficient: stock is
//          deducted immediately, status -> Approved.
//        - If approved but stock is insufficient: status ->
//          Awaiting Stock, and a Purchase Order is auto-created
//          for the shortfall amount, addressed to the product's
//          fixed vendor.
//   3. Warehouse Staff receives the linked Purchase Order
//      (see purchaseOrderController.js), which tops up stock
//      and flips this order back to Approved.
//   4. Warehouse Staff ships any Approved order.
// ============================================================

const db = require('../config/db');

// ------------------------------------------------------------
// POST /api/sales-orders
// Sales Rep only. Client must be assigned to this rep.
// ------------------------------------------------------------
async function createSalesOrder(req, res) {
    const { clientId, productId, quantityRequested } = req.body;
    const salesRepId = req.user.id;

    if (!clientId || !productId || !quantityRequested) {
        return res.status(400).json({ error: 'clientId, productId, and quantityRequested are required.' });
    }

    if (quantityRequested <= 0) {
        return res.status(400).json({ error: 'quantityRequested must be greater than zero.' });
    }

    try {
        // Enforce ownership: this rep may only order for their own clients
        const clientCheck = await db.query(
            `SELECT id FROM clients WHERE id = $1 AND assigned_sales_rep_id = $2`,
            [clientId, salesRepId]
        );

        if (clientCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You may only create orders for clients assigned to you.' });
        }

        const productCheck = await db.query(`SELECT id FROM products WHERE id = $1`, [productId]);
        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const result = await db.query(
            `INSERT INTO sales_orders (client_id, sales_rep_id, product_id, quantity_requested, status)
             VALUES ($1, $2, $3, $4, 'Pending')
             RETURNING *`,
            [clientId, salesRepId, productId, quantityRequested]
        );

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating sales order:', err);
        return res.status(500).json({ error: 'Failed to create sales order.' });
    }
}

// ------------------------------------------------------------
// GET /api/sales-orders
// Manager/Warehouse see all orders. Sales Reps see only their
// own. Includes joined client/product names for display.
// ------------------------------------------------------------
async function getAllSalesOrders(req, res) {
    try {
        const baseQuery = `
            SELECT so.id, so.quantity_requested, so.status, so.created_at, so.approved_at, so.shipped_at,
                   c.company_name AS client_name,
                   p.name AS product_name, p.sku,
                   u.name AS sales_rep_name
            FROM sales_orders so
            JOIN clients c ON so.client_id = c.id
            JOIN products p ON so.product_id = p.id
            JOIN users u ON so.sales_rep_id = u.id
        `;

        let result;
        if (req.user.role === 'Sales') {
            result = await db.query(
                `${baseQuery} WHERE so.sales_rep_id = $1 ORDER BY so.created_at DESC`,
                [req.user.id]
            );
        } else {
            result = await db.query(`${baseQuery} ORDER BY so.created_at DESC`);
        }

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching sales orders:', err);
        return res.status(500).json({ error: 'Failed to fetch sales orders.' });
    }
}

// ------------------------------------------------------------
// PATCH /api/sales-orders/:id/decision
// Manager only. Body: { decision: 'approve' | 'reject' }
//
// Approve logic:
//   - If quantity_in_stock >= quantity_requested:
//       deduct stock, status -> Approved
//   - Else:
//       status -> Awaiting Stock, auto-create a Purchase Order
//       for the shortfall (quantity_requested - quantity_in_stock)
// ------------------------------------------------------------
async function decideSalesOrder(req, res) {
    const { id } = req.params;
    const { decision } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
        return res.status(400).json({ error: "decision must be 'approve' or 'reject'." });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `SELECT * FROM sales_orders WHERE id = $1 FOR UPDATE`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Sales order not found.' });
        }

        const order = orderResult.rows[0];

        if (order.status !== 'Pending') {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: `This order is already "${order.status}" and cannot be re-decided.` });
        }

        if (decision === 'reject') {
            const rejected = await client.query(
                `UPDATE sales_orders SET status = 'Rejected' WHERE id = $1 RETURNING *`,
                [id]
            );
            await client.query('COMMIT');
            return res.status(200).json(rejected.rows[0]);
        }

        // decision === 'approve' — check current stock
        const productResult = await client.query(
            `SELECT * FROM products WHERE id = $1 FOR UPDATE`,
            [order.product_id]
        );
        const product = productResult.rows[0];

        if (product.quantity_in_stock >= order.quantity_requested) {
            // Sufficient stock: deduct and approve immediately
            await client.query(
                `UPDATE products SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2`,
                [order.quantity_requested, product.id]
            );

            const approved = await client.query(
                `UPDATE sales_orders
                 SET status = 'Approved', approved_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING *`,
                [id]
            );

            await client.query('COMMIT');
            return res.status(200).json({ order: approved.rows[0], purchaseOrderCreated: false });
        }

        // Insufficient stock: approve as "Awaiting Stock" and auto-create a Purchase Order
        const shortfall = order.quantity_requested - product.quantity_in_stock;

        const awaitingStock = await client.query(
            `UPDATE sales_orders
             SET status = 'Awaiting Stock', approved_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        const purchaseOrderResult = await client.query(
            `INSERT INTO purchase_orders
                (triggering_sales_order_id, product_id, vendor_id, quantity_ordered, status)
             VALUES ($1, $2, $3, $4, 'Ordered')
             RETURNING *`,
            [order.id, product.id, product.vendor_id, shortfall]
        );

        await client.query('COMMIT');
        return res.status(200).json({
            order: awaitingStock.rows[0],
            purchaseOrderCreated: true,
            purchaseOrder: purchaseOrderResult.rows[0],
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deciding sales order:', err);
        return res.status(500).json({ error: 'Failed to process order decision.' });
    } finally {
        client.release();
    }
}

// ------------------------------------------------------------
// PATCH /api/sales-orders/:id/ship
// Warehouse only. Only orders currently "Approved" may be shipped.
// ------------------------------------------------------------
async function shipSalesOrder(req, res) {
    const { id } = req.params;

    try {
        const orderResult = await db.query(`SELECT * FROM sales_orders WHERE id = $1`, [id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Sales order not found.' });
        }

        const order = orderResult.rows[0];

        if (order.status !== 'Approved') {
            return res.status(409).json({
                error: `Order must be in "Approved" status to ship. Current status: "${order.status}".`,
            });
        }

        const shipped = await db.query(
            `UPDATE sales_orders
             SET status = 'Shipped', shipped_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        return res.status(200).json(shipped.rows[0]);
    } catch (err) {
        console.error('Error shipping sales order:', err);
        return res.status(500).json({ error: 'Failed to ship sales order.' });
    }
}

module.exports = {
    createSalesOrder,
    getAllSalesOrders,
    decideSalesOrder,
    shipSalesOrder,
};