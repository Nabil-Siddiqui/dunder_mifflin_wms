-- ============================================================
-- Dunder Mifflin Paper Company — Warehouse Management System
-- Database Schema
-- ============================================================
-- Convention: every table's primary key is `id`.
-- Foreign keys are named after the relationship they represent
-- (e.g. sales_rep_id, received_by) rather than just `user_id`,
-- so joins stay readable and each FK's purpose is unambiguous.
-- ============================================================

-- ------------------------------------------------------------
-- 1. USERS
-- Manager (Michael) and Warehouse Staff (Daryl) are seeded by
-- default. Sales Representatives are created by the Manager
-- through the application (not seeded).
-- ------------------------------------------------------------
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('Manager', 'Warehouse', 'Sales')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. CLIENTS
-- assigned_sales_rep_id is nullable: clients start unassigned
-- and are assigned to a Sales Rep by the Manager.
-- ------------------------------------------------------------
CREATE TABLE clients (
    id                      SERIAL PRIMARY KEY,
    company_name            VARCHAR(150) NOT NULL,
    contact_person          VARCHAR(100) NOT NULL,
    email                   VARCHAR(150) NOT NULL,
    phone                   VARCHAR(20),
    billing_address         VARCHAR(255),
    assigned_sales_rep_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. VENDORS
-- Fixed set, one vendor per paper category. Seeded, not
-- created through the app for now.
-- ------------------------------------------------------------
CREATE TABLE vendors (
    id                          SERIAL PRIMARY KEY,
    vendor_name                 VARCHAR(150) NOT NULL,
    paper_category_supplied     VARCHAR(100) NOT NULL,
    contact_email               VARCHAR(150),
    phone                       VARCHAR(20)
);

-- ------------------------------------------------------------
-- 4. PRODUCTS
-- Each product belongs to exactly one vendor (matches its
-- paper category).
-- ------------------------------------------------------------
CREATE TABLE products (
    id                  SERIAL PRIMARY KEY,
    sku                 VARCHAR(30) NOT NULL UNIQUE,
    name                VARCHAR(150) NOT NULL,
    category            VARCHAR(50) NOT NULL,
    size                VARCHAR(20) NOT NULL,
    weight              VARCHAR(20) NOT NULL,
    unit                VARCHAR(30) NOT NULL DEFAULT 'Box (10 reams)',
    unit_price          NUMERIC(10, 2) NOT NULL,
    reorder_threshold   INTEGER NOT NULL DEFAULT 20,
    quantity_in_stock   INTEGER NOT NULL DEFAULT 0,
    vendor_id           INTEGER NOT NULL REFERENCES vendors(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 5. SALES_ORDERS
-- Created by a Sales Rep on behalf of one of their assigned
-- clients. Approved/rejected by the Manager.
-- ------------------------------------------------------------
CREATE TABLE sales_orders (
    id                   SERIAL PRIMARY KEY,
    client_id            INTEGER NOT NULL REFERENCES clients(id),
    sales_rep_id         INTEGER NOT NULL REFERENCES users(id),
    product_id           INTEGER NOT NULL REFERENCES products(id),
    quantity_requested   INTEGER NOT NULL CHECK (quantity_requested > 0),
    status               VARCHAR(20) NOT NULL DEFAULT 'Pending'
                         CHECK (status IN ('Pending', 'Approved', 'Awaiting Stock', 'Shipped', 'Rejected')),
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at          TIMESTAMP,
    shipped_at           TIMESTAMP
);

-- ------------------------------------------------------------
-- 6. PURCHASE_ORDERS
-- Auto-generated when an approved Sales Order exceeds current
-- stock. triggering_sales_order_id is nullable to allow for
-- manual restocks not tied to a specific Sales Order.
-- ------------------------------------------------------------
CREATE TABLE purchase_orders (
    id                          SERIAL PRIMARY KEY,
    triggering_sales_order_id   INTEGER REFERENCES sales_orders(id) ON DELETE SET NULL,
    product_id                  INTEGER NOT NULL REFERENCES products(id),
    vendor_id                   INTEGER NOT NULL REFERENCES vendors(id),
    quantity_ordered            INTEGER NOT NULL CHECK (quantity_ordered > 0),
    status                      VARCHAR(20) NOT NULL DEFAULT 'Ordered'
                               CHECK (status IN ('Ordered', 'Received')),
    ordered_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    received_at                 TIMESTAMP,
    received_by                 INTEGER REFERENCES users(id)
);

-- ------------------------------------------------------------
-- Helpful indexes for common lookups
-- ------------------------------------------------------------
CREATE INDEX idx_clients_sales_rep ON clients(assigned_sales_rep_id);
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_sales_orders_rep ON sales_orders(sales_rep_id);
CREATE INDEX idx_sales_orders_client ON sales_orders(client_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);