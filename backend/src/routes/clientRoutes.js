// ============================================================
// Client Routes
// ============================================================
// All routes require login. Role-based filtering of WHICH
// clients are visible happens inside the controller, but the
// "/unassigned" helper route is restricted to Manager only,
// since it's specifically for the employee-creation workflow.
// ============================================================

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

// Every route below requires a valid token
router.use(authMiddleware);

// GET /api/clients/unassigned - Manager only (must be declared
// BEFORE /:id, otherwise Express would treat "unassigned" as an :id value)
router.get('/unassigned', roleCheck('Manager'), clientController.getUnassignedClients);

// GET /api/clients - all roles, filtered inside the controller
router.get('/', clientController.getAllClients);

// GET /api/clients/:id - all roles, ownership checked inside the controller
router.get('/:id', clientController.getClientById);

module.exports = router;