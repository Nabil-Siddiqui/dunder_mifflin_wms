// ============================================================
// Sales Order Routes
// ============================================================
// Mixed permissions per route:
//   - Create: Sales only
//   - View (list): all roles (filtered inside the controller)
//   - Decide (approve/reject): Manager only
//   - Ship: Warehouse only
// ============================================================

const express = require('express');
const router = express.Router();
const salesOrderController = require('../controllers/salesOrderController');
const authMiddleware = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

// Every route below requires a valid token
router.use(authMiddleware);

// POST /api/sales-orders - Sales Rep creates an order for one of their own clients
router.post('/', roleCheck('Sales'), salesOrderController.createSalesOrder);

// GET /api/sales-orders - all roles; results filtered by role inside the controller
router.get('/', salesOrderController.getAllSalesOrders);

// PATCH /api/sales-orders/:id/decision - Manager approves or rejects
router.patch('/:id/decision', roleCheck('Manager'), salesOrderController.decideSalesOrder);

// PATCH /api/sales-orders/:id/ship - Warehouse marks an approved order as shipped
router.patch('/:id/ship', roleCheck('Warehouse'), salesOrderController.shipSalesOrder);

module.exports = router;