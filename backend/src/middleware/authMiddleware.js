// ============================================================
// Auth Middleware
// ============================================================
// Verifies the JWT sent by the client (in the Authorization
// header) and attaches the decoded user payload to req.user.
// Any route using this middleware requires the user to be
// logged in.
// ============================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // decoded payload will contain: { id, role, name }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
}

module.exports = authMiddleware;