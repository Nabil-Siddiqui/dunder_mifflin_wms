// ============================================================
// Purchase Order Routes
// ============================================================
// Manager and Warehouse can both view Purchase Orders.
// Only Warehouse can mark one as Received.
// ============================================================

const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const authMiddleware = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

// Every route below requires a valid token
router.use(authMiddleware);

// GET /api/purchase-orders - Manager and Warehouse only
router.get('/', roleCheck('Manager', 'Warehouse'), purchaseOrderController.getAllPurchaseOrders);

// POST /api/purchase-orders/replenish - Manager and Warehouse only
// Declared before /:id/receive is irrelevant here since paths don't collide,
// but kept near the GET / for readability.
router.post('/replenish', roleCheck('Manager', 'Warehouse'), purchaseOrderController.replenishLowStock);

// PATCH /api/purchase-orders/:id/receive - Warehouse only
router.patch('/:id/receive', roleCheck('Warehouse'), purchaseOrderController.receivePurchaseOrder);

module.exports = router;