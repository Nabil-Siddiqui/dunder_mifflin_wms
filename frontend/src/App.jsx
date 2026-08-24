import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Clients from './pages/Clients';
import SalesOrders from './pages/SalesOrders';
import PurchaseOrders from './pages/PurchaseOrders';
import Employees from './pages/Employees';

// ============================================================
// App Root
// ============================================================
// Defines every route in the application and the permission
// level required for each, using ProtectedRoute as a layout
// route (see components/ProtectedRoute.jsx).
//
// Route structure:
//   /login                -> public
//   /dashboard             -> any logged-in role
//   /inventory             -> any logged-in role
//   /clients               -> any logged-in role
//   /sales-orders          -> any logged-in role
//   /purchase-orders       -> Manager, Warehouse only
//   /employees             -> Manager only
// ============================================================

// AppLayout composes the persistent Sidebar + Navbar shell around
// whichever page is currently active (rendered via <Outlet />).
// Kept here rather than its own file since it's pure composition
// of pieces already defined elsewhere, used only in this one place.
function AppLayout() {
    return (
        <div className="flex min-h-screen bg-dm-gray">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Any authenticated user */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/sales-orders" element={<SalesOrders />} />

                    {/* Manager and Warehouse only */}
                    <Route element={<ProtectedRoute allowedRoles={['Manager', 'Warehouse']} />}>
                        <Route path="/purchase-orders" element={<PurchaseOrders />} />
                    </Route>

                    {/* Manager only */}
                    <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
                        <Route path="/employees" element={<Employees />} />
                    </Route>
                </Route>
            </Route>

            {/* Root and any unmatched path redirect to the dashboard,
                which itself redirects to /login if not authenticated */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}