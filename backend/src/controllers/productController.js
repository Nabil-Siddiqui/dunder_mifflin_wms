// ============================================================
// Product Controller
// ============================================================
// Read-only inventory access for all roles (Manager, Warehouse,
// Sales). There is no create/update/delete endpoint here —
// quantity_in_stock only changes as a side effect of receiving
// a Purchase Order (see purchaseOrderController.js).
// ============================================================

const db = require('../config/db');

// ------------------------------------------------------------
// GET /api/products
// Returns the full product catalog, including a computed
// "lowStock" flag (quantity_in_stock <= reorder_threshold) so
// the frontend can highlight items needing attention without
// recalculating anything itself.
// ------------------------------------------------------------
async function getAllProducts(req, res) {
    try {
        const result = await db.query(
            `SELECT p.id, p.sku, p.name, p.category, p.size, p.weight, p.unit,
                    p.unit_price, p.reorder_threshold, p.quantity_in_stock,
                    p.vendor_id, v.vendor_name,
                    (p.quantity_in_stock <= p.reorder_threshold) AS "lowStock"
             FROM products p
             JOIN vendors v ON p.vendor_id = v.id
             ORDER BY p.category ASC, p.name ASC`
        );
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        return res.status(500).json({ error: 'Failed to fetch products.' });
    }
}

// ------------------------------------------------------------
// GET /api/products/:id
// Single product detail (used when creating a Sales Order, to
// confirm current stock before submitting a request).
// ------------------------------------------------------------
async function getProductById(req, res) {
    const { id } = req.params;

    try {
        const result = await db.query(
            `SELECT p.id, p.sku, p.name, p.category, p.size, p.weight, p.unit,
                    p.unit_price, p.reorder_threshold, p.quantity_in_stock,
                    p.vendor_id, v.vendor_name,
                    (p.quantity_in_stock <= p.reorder_threshold) AS "lowStock"
             FROM products p
             JOIN vendors v ON p.vendor_id = v.id
             WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching product:', err);
        return res.status(500).json({ error: 'Failed to fetch product.' });
    }
}

module.exports = {
    getAllProducts,
    getProductById,
};