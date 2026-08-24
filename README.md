# Dunder Mifflin Paper Company — Warehouse Management System

A full-stack warehouse management system built for a Software Development Lab course, modeled around a real paper distribution business workflow: order intake, manager approval, automatic vendor procurement on stock shortfall, and warehouse receiving/shipping.

The system is themed around Dunder Mifflin's Scranton branch (of *The Office*) in naming and branding only — the underlying workflow, data model, and access control are built to function like a real industry warehouse/order management system.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) + bcrypt password hashing |
| Dev tooling | concurrently (runs backend + frontend together with one command) |

## Project Structure
dunder-mifflin-wms/
├── package.json # Root script: npm run dev starts backend + frontend together
├── start-project.bat # Optional double-click launcher (Windows)
├── database/
│ ├── schema.sql # All 6 tables, constraints, indexes
│ └── seed.sql # Seeded users, vendors, products, clients
├── backend/
│ ├── scripts/
│ │ └── setSeededPasswords.js # One-time script to set real passwords for seeded accounts
│ ├── src/
│ │ ├── config/db.js # PostgreSQL connection pool
│ │ ├── middleware/ # authMiddleware (JWT check), roleCheck (role restriction)
│ │ ├── controllers/ # Business logic (auth, users, clients, products, sales orders, purchase orders)
│ │ ├── routes/ # Express routers, one per resource
│ │ └── app.js # Express app setup, mounts all routes
│ ├── server.js # Entry point
│ ├── .env.example # Environment variable template
│ └── package.json
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ ├── layout/ # Sidebar, Navbar
│ │ │ ├── common/ # StatusBadge
│ │ │ └── ProtectedRoute.jsx # Route guard (auth + role)
│ │ ├── context/AuthContext.jsx # Login state, shared app-wide
│ │ ├── services/api.js # Axios instance, auto-attaches JWT
│ │ ├── pages/ # Login, Dashboard, Inventory, Clients, SalesOrders, PurchaseOrders, Employees
│ │ ├── App.jsx # All routes + role-based access
│ │ └── main.jsx # React entry point
│ └── package.json
└── README.md

## Roles & Permissions

| Role | Seeded? | Created by | Can do |
|---|---|---|---|
| **Manager** (Michael Scott) | Yes | System seed | View all inventory/clients/orders, approve/reject Sales Orders, create Sales Rep accounts, assign/reassign clients, activate/deactivate accounts |
| **Warehouse Staff** (Daryl Philbin) | Yes | System seed | View inventory/clients/orders, view Purchase Orders, mark Purchase Orders as Received, ship Approved Sales Orders |
| **Sales Representative** | No | Manager, via the Employees page | View inventory, view only their own assigned clients, create Sales Orders on behalf of their clients, view only their own orders |

## Core Business Workflow
1. Sales Rep creates a Sales Order for one of their assigned clients
→ status: Pending
2. Manager reviews the order:
a. Approve, sufficient stock → stock deducted immediately → status: Approved
b. Approve, insufficient stock → status: Awaiting Stock
→ Purchase Order auto-created for the shortfall,
addressed to the product's fixed vendor
c. Reject → status: Rejected
3. Warehouse Staff receives the Purchase Order delivery:
→ stock topped up
→ linked Sales Order (if any) flips back: Awaiting Stock → Approved
4. Warehouse Staff ships any Approved Sales Order
→ status: Shipped

## Database Schema (6 tables)

- **users** — Manager, Warehouse, and Sales accounts (role-based)
- **clients** — fixed seeded client list; `assigned_sales_rep_id` starts NULL, assigned via the app
- **vendors** — fixed, one per paper category (Copy Paper, Cardstock, Photo/Glossy, Specialty/Recycled)
- **products** — paper catalog, each tied to one vendor, tracks `quantity_in_stock` and `reorder_threshold`
- **sales_orders** — client + rep + product + quantity + status
- **purchase_orders** — auto or manually generated restock orders, optionally linked to a triggering sales order

See `database/schema.sql` for full column definitions and constraints.

## Setup Instructions

### Prerequisites
- Node.js (LTS) and npm
- PostgreSQL 16+ with pgAdmin 4

### 1. Database
1. In pgAdmin, create a database named `dunder_mifflin_wms`
2. Open the Query Tool against that database and run, in order:
   - `database/schema.sql`
   - `database/seed.sql`

### 2. Backend environment
```bash
cd backend
cp .env.example .env    # then fill in your real DB password and a JWT secret
```

### 3. Install everything and set seeded passwords
From the **project root**:
```bash
npm install              # installs the root "concurrently" tool
npm run install:all      # installs backend and frontend dependencies
cd backend
node scripts/setSeededPasswords.js   # sets real passwords for Michael and Daryl
cd ..
```

### 4. Run the whole project
From the **project root**, run:
```bash
npm run dev
```
This starts the backend (`http://localhost:5000`) and frontend (`http://localhost:5173`) together in one terminal, color-coded by service. Alternatively, just double-click `start-project.bat` (Windows) to do the same without typing anything.

To stop everything, press `Ctrl + C` in that terminal (or close it).

Confirm the backend is up by visiting `http://localhost:5000/api/health`. The frontend proxies all `/api/*` requests to the backend automatically (see `frontend/vite.config.js`).

### 5. Log in
Visit `http://localhost:5173`. Use the credentials set in `setSeededPasswords.js` for Michael (Manager) or Daryl (Warehouse). Sales Rep accounts are created afterward by the Manager through the Employees page.

## Security Notes
- Passwords are hashed with bcrypt — never stored or transmitted in plain text
- Authentication uses JWTs; all protected routes verify the token via `authMiddleware`
- Role restrictions are enforced server-side via `roleCheck` middleware, not just hidden in the UI
- SQL queries use parameterized placeholders throughout to prevent SQL injection
- Sales Reps are restricted at the database-query level to only their own assigned clients and orders

## Status
Core backend (19 files) and frontend (21 files) are complete, covering the full order lifecycle across all three roles. Diagrams (Use Case, ERD, Activity, Sequence) and formal documentation (SRS) are in progress.