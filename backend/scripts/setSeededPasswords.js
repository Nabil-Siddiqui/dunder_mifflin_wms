// ============================================================
// One-Time Script: Set Seeded User Passwords
// ============================================================
// Michael and Daryl were seeded with PLACEHOLDER_HASH, which
// cannot be used to log in. This script hashes real passwords
// and updates their rows directly.
//
// Run once from the backend/ folder:
//   node scripts/setSeededPasswords.js
//
// Change the passwords below to whatever you want before running.
// This script can be deleted after use, or kept for re-running
// later if you ever need to reset these two accounts.
// ============================================================

const bcrypt = require('bcrypt');
const db = require('../src/config/db');

const SALT_ROUNDS = 10;

const accountsToUpdate = [
    { email: 'michael.scott@dundermifflin.com', password: 'WorldsBestBoss1!' },
    { email: 'daryl.philbin@dundermifflin.com', password: 'WarehouseKing1!' },
];

async function run() {
    try {
        for (const account of accountsToUpdate) {
            const passwordHash = await bcrypt.hash(account.password, SALT_ROUNDS);

            const result = await db.query(
                `UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, name, email`,
                [passwordHash, account.email]
            );

            if (result.rows.length === 0) {
                console.warn(`No user found with email: ${account.email}`);
            } else {
                console.log(`Password updated for ${result.rows[0].name} (${result.rows[0].email})`);
            }
        }

        console.log('Done. You can now log in with the passwords set in this script.');
    } catch (err) {
        console.error('Error setting passwords:', err);
    } finally {
        await db.pool.end();
    }
}

run();