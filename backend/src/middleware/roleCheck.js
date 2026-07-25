// ============================================================
// Role Check Middleware
// ============================================================
// Restricts a route to specific roles. Must be used AFTER
// authMiddleware, since it relies on req.user being set.
//
// Usage example (in a routes file):
//   router.post('/users', authMiddleware, roleCheck('Manager'), userController.createSalesRep);
//
// Multiple allowed roles can be passed:
//   roleCheck('Manager', 'Warehouse')
// ============================================================

function roleCheck(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No authenticated user found. Please log in.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
            });
        }

        next();
    };
}

module.exports = roleCheck;