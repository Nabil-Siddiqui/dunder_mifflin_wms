// ============================================================
// Express App Setup
// ============================================================
// Configures middleware and mounts all route modules. The
// actual server startup (app.listen) lives in server.js, kept
// separate so this file can be imported by tests later without
// starting a real server.
// ============================================================

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const productRoutes = require('./routes/productRoutes');
const salesOrderRoutes = require('./routes/salesOrderRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');

const app = express();

// --- Core middleware ---
app.use(cors());
app.use(express.json());

// --- Health check (useful for quickly confirming the server is up) ---
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Dunder Mifflin WMS API is running.' });
});

// --- Mount routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);

// --- 404 handler for unmatched routes ---
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// --- Global error handler (catches anything unexpected) ---
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected error occurred.' });
});

module.exports = app;