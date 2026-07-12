-- ============================================================
-- Dunder Mifflin Paper Company — Warehouse Management System
-- Seed Data
-- ============================================================
-- Seeds: Manager, Warehouse Staff, 4 fixed vendors, product
-- catalog, and clients (unassigned — assigned later via the
-- Manager's "Employees" panel once Sales Reps are created).
--
-- NOTE: password_hash values below are placeholders. Once the
-- auth controller is built, these will be replaced with real
-- bcrypt hashes generated at seed time (or via a seed script).
-- ============================================================

-- ------------------------------------------------------------
-- USERS — default Manager and Warehouse Staff
-- ------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role, is_active) VALUES
('Michael Scott', 'michael.scott@dundermifflin.com', 'PLACEHOLDER_HASH', 'Manager', TRUE),
('Daryl Philbin', 'daryl.philbin@dundermifflin.com', 'PLACEHOLDER_HASH', 'Warehouse', TRUE);

-- ------------------------------------------------------------
-- VENDORS — fixed, one per paper category
-- ------------------------------------------------------------
INSERT INTO vendors (vendor_name, paper_category_supplied, contact_email, phone) VALUES
('Meridian Paper Mills', 'Copy Paper', 'orders@meridianpapermills.com', '555-0101'),
('Allegheny Fiber Co.', 'Cardstock', 'sales@alleghenyfiber.com', '555-0102'),
('Clearline Imaging Supply', 'Photo/Glossy Paper', 'accounts@clearlineimaging.com', '555-0103'),
('Evergreen Recycled Paper Co.', 'Specialty/Recycled', 'contact@evergreenrecycled.com', '555-0104');

-- ------------------------------------------------------------
-- PRODUCTS — catalog across all 4 categories
-- vendor_id references match insertion order above:
-- 1 = Meridian, 2 = Allegheny, 3 = Clearline, 4 = Evergreen
-- ------------------------------------------------------------
INSERT INTO products (sku, name, category, size, weight, unit, unit_price, reorder_threshold, quantity_in_stock, vendor_id) VALUES
-- Copy Paper (Meridian Paper Mills)
('CP-LTR-20', 'Standard Copy Paper', 'Copy Paper', 'Letter', '20lb', 'Box (10 reams)', 34.99, 25, 120, 1),
('CP-LGL-20', 'Standard Copy Paper', 'Copy Paper', 'Legal', '20lb', 'Box (10 reams)', 38.99, 20, 80, 1),
('CP-LTR-24', 'Premium Multipurpose Paper', 'Copy Paper', 'Letter', '24lb', 'Box (10 reams)', 42.99, 20, 60, 1),
('CP-A4-20', 'Standard Copy Paper', 'Copy Paper', 'A4', '20lb', 'Box (10 reams)', 36.99, 20, 45, 1),

-- Cardstock (Allegheny Fiber Co.)
('CS-LTR-65', 'Heavy Cardstock', 'Cardstock', 'Letter', '65lb Cover', 'Box (10 reams)', 54.99, 15, 40, 2),
('CS-A4-80', 'Premium Cardstock', 'Cardstock', 'A4', '80lb Cover', 'Box (10 reams)', 62.99, 15, 30, 2),
('CS-LTR-110', 'Extra Heavy Cardstock', 'Cardstock', 'Letter', '110lb Cover', 'Box (10 reams)', 71.99, 10, 18, 2),

-- Photo/Glossy Paper (Clearline Imaging Supply)
('GP-LTR-STD', 'Glossy Photo Paper', 'Photo/Glossy Paper', 'Letter', '28lb', 'Box (10 reams)', 58.99, 15, 25, 3),
('GP-11x17-PRM', 'Premium Glossy Paper', 'Photo/Glossy Paper', '11x17', '32lb', 'Box (10 reams)', 79.99, 10, 12, 3),

-- Specialty/Recycled (Evergreen Recycled Paper Co.)
('RC-LTR-20', 'Recycled Copy Paper', 'Specialty/Recycled', 'Letter', '20lb', 'Box (10 reams)', 39.99, 20, 55, 4),
('RC-LGL-20', 'Recycled Copy Paper', 'Specialty/Recycled', 'Legal', '20lb', 'Box (10 reams)', 43.99, 15, 28, 4),
('CB-LTR-24', 'Premium Cotton Bond', 'Specialty/Recycled', 'Letter', '24lb', 'Box (10 reams)', 68.99, 10, 15, 4);

-- ------------------------------------------------------------
-- CLIENTS — unassigned for now (assigned_sales_rep_id left
-- NULL). Manager will assign these to Sales Reps once created.
-- ------------------------------------------------------------
INSERT INTO clients (company_name, contact_person, email, phone, billing_address, assigned_sales_rep_id) VALUES
('Titan Insurance Group', 'Robert Callahan', 'r.callahan@titaninsurance.com', '555-0201', '1200 Insurance Plaza, Scranton, PA 18503', NULL),
('Northeastern Medical Partners', 'Susan Whitfield', 's.whitfield@nemedpartners.com', '555-0202', '450 Healthcare Drive, Scranton, PA 18505', NULL),
('Lackawanna County Clerk''s Office', 'Thomas Reyes', 't.reyes@lackawannacounty.gov', '555-0203', '200 Adams Ave, Scranton, PA 18503', NULL),
('Scranton School District', 'Patricia Hemsworth', 'p.hemsworth@scrantonsd.edu', '555-0204', '425 N Washington Ave, Scranton, PA 18509', NULL),
('Keystone Realty Group', 'Daniel Marsh', 'd.marsh@keystonerealty.com', '555-0205', '780 Linden Street, Scranton, PA 18503', NULL),
('Commonwealth Legal Associates', 'Elaine Foster', 'e.foster@commonwealthlegal.com', '555-0206', '95 Wyoming Ave, Scranton, PA 18503', NULL);