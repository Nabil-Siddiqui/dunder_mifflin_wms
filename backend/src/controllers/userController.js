// ============================================================
// User Controller
// ============================================================
// Handles Sales Rep account creation (Manager only), viewing
// employees, deactivating accounts, and assigning/reassigning
// clients to Sales Reps.
//
// Manager and Warehouse accounts are seeded directly and are
// NOT created through this controller.
// ============================================================

const bcrypt = require('bcrypt');
const db = require('../config/db');

const SALT_ROUNDS = 10;

// ------------------------------------------------------------
// POST /api/users
// Manager creates a new Sales Rep and optionally assigns one
// or more currently-unassigned clients to them in the same step.
// ------------------------------------------------------------
async function createSalesRep(req, res) {
    const { name, email, password, clientIds } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'A user with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const newUserResult = await client.query(
            `INSERT INTO users (name, email, password_hash, role, is_active)
             VALUES ($1, $2, $3, 'Sales', TRUE)
             RETURNING id, name, email, role, is_active, created_at`,
            [name, email, passwordHash]
        );

        const newUser = newUserResult.rows[0];

        // If clientIds were provided, assign only those that are
        // currently unassigned (prevents accidentally stealing a
        // client already assigned to another rep).
        let assignedClients = [];
        if (Array.isArray(clientIds) && clientIds.length > 0) {
            const assignResult = await client.query(
                `UPDATE clients
                 SET assigned_sales_rep_id = $1
                 WHERE id = ANY($2::int[]) AND assigned_sales_rep_id IS NULL
                 RETURNING id, company_name`,
                [newUser.id, clientIds]
            );
            assignedClients = assignResult.rows;
        }

        await client.query('COMMIT');

        return res.status(201).json({
            user: newUser,
            assignedClients,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating sales rep:', err);
        return res.status(500).json({ error: 'Failed to create sales representative.' });
    } finally {
        client.release();
    }
}

// ------------------------------------------------------------
// GET /api/users
// Manager views all Sales Reps along with their assigned clients.
// ------------------------------------------------------------
async function getAllSalesReps(req, res) {
    try {
        const usersResult = await db.query(
            `SELECT id, name, email, is_active, created_at
             FROM users
             WHERE role = 'Sales'
             ORDER BY created_at ASC`
        );

        const reps = usersResult.rows;

        // Attach each rep's assigned clients
        for (const rep of reps) {
            const clientsResult = await db.query(
                `SELECT id, company_name FROM clients WHERE assigned_sales_rep_id = $1`,
                [rep.id]
            );
            rep.assignedClients = clientsResult.rows;
        }

        return res.status(200).json(reps);
    } catch (err) {
        console.error('Error fetching sales reps:', err);
        return res.status(500).json({ error: 'Failed to fetch sales representatives.' });
    }
}

// ------------------------------------------------------------
// PATCH /api/users/:id/status
// Manager activates or deactivates a Sales Rep account.
// ------------------------------------------------------------
async function updateUserStatus(req, res) {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be true or false.' });
    }

    try {
        const result = await db.query(
            `UPDATE users SET is_active = $1 WHERE id = $2 AND role = 'Sales' RETURNING id, name, is_active`,
            [isActive, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sales representative not found.' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error updating user status:', err);
        return res.status(500).json({ error: 'Failed to update account status.' });
    }
}

// ------------------------------------------------------------
// PATCH /api/users/:id/clients
// Manager reassigns a client to this Sales Rep (or moves it
// from another rep). Only ever one client at a time, by
// clientId in the body.
// ------------------------------------------------------------
async function assignClientToRep(req, res) {
    const { id } = req.params; // sales rep id
    const { clientId } = req.body;

    if (!clientId) {
        return res.status(400).json({ error: 'clientId is required.' });
    }

    try {
        const repCheck = await db.query(`SELECT id FROM users WHERE id = $1 AND role = 'Sales'`, [id]);
        if (repCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Sales representative not found.' });
        }

        const result = await db.query(
            `UPDATE clients SET assigned_sales_rep_id = $1 WHERE id = $2 RETURNING id, company_name, assigned_sales_rep_id`,
            [id, clientId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found.' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error assigning client:', err);
        return res.status(500).json({ error: 'Failed to assign client.' });
    }
}

module.exports = {
    createSalesRep,
    getAllSalesReps,
    updateUserStatus,
    assignClientToRep,
};