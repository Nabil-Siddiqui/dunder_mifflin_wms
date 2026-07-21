// ============================================================
// Product Routes
// ============================================================
// Read-only inventory endpoints, open to all authenticated
// roles (Manager, Warehouse, Sales) — no roleCheck needed.
// ============================================================

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

// Every route below requires a valid token, but any role may access
router.use(authMiddleware);

// GET /api/products - full catalog with lowStock flag
router.get('/', productController.getAllProducts);

// GET /api/products/:id - single product detail
router.get('/:id', productController.getProductById);

module.exports = router;