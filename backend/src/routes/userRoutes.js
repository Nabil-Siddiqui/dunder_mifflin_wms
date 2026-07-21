// ============================================================
// User Routes
// ============================================================
// All routes here are Manager-only: creating Sales Reps,
// viewing employees, activating/deactivating accounts, and
// assigning clients to reps.
// ============================================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

// Every route below requires a valid token AND the Manager role
router.use(authMiddleware, roleCheck('Manager'));

// POST /api/users - create a new Sales Rep (optionally assign clients)
router.post('/', userController.createSalesRep);

// GET /api/users - list all Sales Reps with their assigned clients
router.get('/', userController.getAllSalesReps);

// PATCH /api/users/:id/status - activate or deactivate a Sales Rep
router.patch('/:id/status', userController.updateUserStatus);

// PATCH /api/users/:id/clients - assign/reassign a client to this Sales Rep
router.patch('/:id/clients', userController.assignClientToRep);

module.exports = router;