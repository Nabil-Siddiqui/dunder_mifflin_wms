// ============================================================
// Server Entry Point
// ============================================================
// Starts the Express app listening on the configured port.
// Run with: npm run dev (nodemon) or npm start (plain node)
// ============================================================

require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Dunder Mifflin WMS API listening on http://localhost:${PORT}`);
});