// ============================================================
// Client Controller
// ============================================================
// Manager and Warehouse staff can view all clients. Sales Reps
// can only view clients assigned to them. Clients themselves
// are seeded (fixed list) — there is no create/delete endpoint
// for now.
// ============================================================

const db = require('../config/db');

// ------------------------------------------------------------
// GET /api/clients
// Returns clients based on the requesting user's role:
//   - Manager / Warehouse: all clients, with assigned rep name
//   - Sales: only clients assigned to this rep
// ------------------------------------------------------------
async function getAllClients(req, res) {
    try {
        if (req.user.role === 'Sales') {
            const result = await db.query(
                `SELECT id, company_name, contact_person, email, phone, billing_address
                 FROM clients
                 WHERE assigned_sales_rep_id = $1
                 ORDER BY company_name ASC`,
                [req.user.id]
            );
            return res.status(200).json(result.rows);
        }

        // Manager and Warehouse see everything, plus which rep (if any) owns each client
        const result = await db.query(
            `SELECT c.id, c.company_name, c.contact_person, c.email, c.phone, c.billing_address,
                    c.assigned_sales_rep_id, u.name AS assigned_sales_rep_name
             FROM clients c
             LEFT JOIN users u ON c.assigned_sales_rep_id = u.id
             ORDER BY c.company_name ASC`
        );
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching clients:', err);
        return res.status(500).json({ error: 'Failed to fetch clients.' });
    }
}

// ------------------------------------------------------------
// GET /api/clients/unassigned
// Manager-only helper endpoint: returns clients with no Sales
// Rep assigned yet. Used when creating a new Sales Rep, so the
// Manager can pick which clients to hand them.
// ------------------------------------------------------------
async function getUnassignedClients(req, res) {
    try {
        const result = await db.query(
            `SELECT id, company_name, contact_person, email
             FROM clients
             WHERE assigned_sales_rep_id IS NULL
             ORDER BY company_name ASC`
        );
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching unassigned clients:', err);
        return res.status(500).json({ error: 'Failed to fetch unassigned clients.' });
    }
}

// ------------------------------------------------------------
// GET /api/clients/:id
// Single client detail. Sales Reps may only view their own
// assigned client; Manager/Warehouse may view any.
// ------------------------------------------------------------
async function getClientById(req, res) {
    const { id } = req.params;

    try {
        const result = await db.query(
            `SELECT c.id, c.company_name, c.contact_person, c.email, c.phone, c.billing_address,
                    c.assigned_sales_rep_id, u.name AS assigned_sales_rep_name
             FROM clients c
             LEFT JOIN users u ON c.assigned_sales_rep_id = u.id
             WHERE c.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found.' });
        }

        const clientRecord = result.rows[0];

        if (req.user.role === 'Sales' && clientRecord.assigned_sales_rep_id !== req.user.id) {
            return res.status(403).json({ error: 'You do not have access to this client.' });
        }

        return res.status(200).json(clientRecord);
    } catch (err) {
        console.error('Error fetching client:', err);
        return res.status(500).json({ error: 'Failed to fetch client.' });
    }
}

module.exports = {
    getAllClients,
    getUnassignedClients,
    getClientById,
};