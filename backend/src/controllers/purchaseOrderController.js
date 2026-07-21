// ============================================================
// Purchase Order Controller
// ============================================================
// Manager and Warehouse Staff can view Purchase Orders.
// Warehouse Staff marks a Purchase Order as "Received," which:
//   - increases the product's quantity_in_stock
//   - if this PO was auto-triggered by a Sales Order that was
//     "Awaiting Stock," flips that Sales Order back to "Approved"
//     so it becomes ready to ship.
// ============================================================

const db = require('../config/db');

// ------------------------------------------------------------
// GET /api/purchase-orders
// Manager and Warehouse only (enforced in routes). Includes
// product, vendor, and linked sales order info for context.
// ------------------------------------------------------------
async function getAllPurchaseOrders(req, res) {
    try {
        const result = await db.query(
            `SELECT po.id, po.quantity_ordered, po.status, po.ordered_at, po.received_at,
                    p.name AS product_name, p.sku,
                    v.vendor_name,
                    po.triggering_sales_order_id,
                    r.name AS received_by_name
             FROM purchase_orders po
             JOIN products p ON po.product_id = p.id
             JOIN vendors v ON po.vendor_id = v.id
             LEFT JOIN users r ON po.received_by = r.id
             ORDER BY po.ordered_at DESC`
        );
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching purchase orders:', err);
        return res.status(500).json({ error: 'Failed to fetch purchase orders.' });
    }
}

// ------------------------------------------------------------
// PATCH /api/purchase-orders/:id/receive
// Warehouse only. Marks the PO as Received, tops up stock, and
// flips a linked Sales Order (if any) from "Awaiting Stock"
// back to "Approved."
// ------------------------------------------------------------
async function receivePurchaseOrder(req, res) {
    const { id } = req.params;
    const receivedBy = req.user.id;

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const poResult = await client.query(
            `SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE`,
            [id]
        );

        if (poResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Purchase order not found.' });
        }

        const purchaseOrder = poResult.rows[0];

        if (purchaseOrder.status !== 'Ordered') {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: `This purchase order is already "${purchaseOrder.status}" and cannot be received again.`,
            });
        }

        // Top up stock
        await client.query(
            `UPDATE products SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2`,
            [purchaseOrder.quantity_ordered, purchaseOrder.product_id]
        );

        // Mark the purchase order as received
        const receivedPO = await client.query(
            `UPDATE purchase_orders
             SET status = 'Received', received_at = CURRENT_TIMESTAMP, received_by = $1
             WHERE id = $2
             RETURNING *`,
            [receivedBy, id]
        );

        // If this PO was triggered by a Sales Order awaiting stock, flip it back to
        // Approved AND deduct the full requested quantity from stock now — this
        // deduction was deliberately skipped back when the order was first approved,
        // since stock wasn't sufficient at that time. This is the moment it's owed.
        let updatedSalesOrder = null;
        if (purchaseOrder.triggering_sales_order_id) {
            const linkedOrderResult = await client.query(
                `SELECT * FROM sales_orders WHERE id = $1 AND status = 'Awaiting Stock' FOR UPDATE`,
                [purchaseOrder.triggering_sales_order_id]
            );

            if (linkedOrderResult.rows.length > 0) {
                const linkedOrder = linkedOrderResult.rows[0];

                await client.query(
                    `UPDATE products SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2`,
                    [linkedOrder.quantity_requested, linkedOrder.product_id]
                );

                const salesOrderResult = await client.query(
                    `UPDATE sales_orders SET status = 'Approved' WHERE id = $1 RETURNING *`,
                    [linkedOrder.id]
                );
                updatedSalesOrder = salesOrderResult.rows[0];
            }
        }

        await client.query('COMMIT');

        return res.status(200).json({
            purchaseOrder: receivedPO.rows[0],
            linkedSalesOrderUpdated: updatedSalesOrder,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error receiving purchase order:', err);
        return res.status(500).json({ error: 'Failed to receive purchase order.' });
    } finally {
        client.release();
    }
}

// ------------------------------------------------------------
// POST /api/purchase-orders/replenish
// Manager and Warehouse only. Scans all products at or below
// their reorder threshold and creates a Purchase Order to bring
// each one up to double its reorder threshold — but only for
// products that don't already have a Purchase Order "Ordered"
// (in transit), to avoid ordering the same product twice.
// ------------------------------------------------------------
async function replenishLowStock(req, res) {
    const orderedBy = req.user.id;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const lowStockResult = await client.query(
            `SELECT * FROM products WHERE quantity_in_stock <= reorder_threshold FOR UPDATE`
        );

        const createdPurchaseOrders = [];
        const skippedProducts = [];

        for (const product of lowStockResult.rows) {
            const existingPending = await client.query(
                `SELECT id FROM purchase_orders WHERE product_id = $1 AND status = 'Ordered'`,
                [product.id]
            );

            if (existingPending.rows.length > 0) {
                skippedProducts.push({ id: product.id, name: product.name, reason: 'Already has a pending purchase order' });
                continue;
            }

            const targetLevel = product.reorder_threshold * 2;
            const quantityToOrder = targetLevel - product.quantity_in_stock;

            if (quantityToOrder <= 0) {
                continue;
            }

            const poResult = await client.query(
                `INSERT INTO purchase_orders
                    (triggering_sales_order_id, product_id, vendor_id, quantity_ordered, status)
                 VALUES (NULL, $1, $2, $3, 'Ordered')
                 RETURNING *`,
                [product.id, product.vendor_id, quantityToOrder]
            );

            createdPurchaseOrders.push({
                ...poResult.rows[0],
                product_name: product.name,
            });
        }

        await client.query('COMMIT');

        return res.status(200).json({
            createdPurchaseOrders,
            skippedProducts,
            message:
                createdPurchaseOrders.length === 0
                    ? 'No products currently need replenishment.'
                    : `Created ${createdPurchaseOrders.length} purchase order(s) to replenish low-stock products.`,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error replenishing stock:', err);
        return res.status(500).json({ error: 'Failed to replenish low-stock products.' });
    } finally {
        client.release();
    }
}

module.exports = {
    getAllPurchaseOrders,
    receivePurchaseOrder,
    replenishLowStock,
};