import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
 
// ============================================================
// Protected Route
// ============================================================
// Used as a layout route (wraps <Outlet />) so it can guard a
// whole group of nested routes at once instead of repeating the
// same auth check on every page component.
//
// Usage in App.jsx:
//
//   // Any logged-in user:
//   <Route element={<ProtectedRoute />}>
//     <Route path="/dashboard" element={<Dashboard />} />
//   </Route>
//
//   // Restricted to specific roles ('Manager' | 'Warehouse' | 'Sales'):
//   <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
//     <Route path="/employees" element={<EmployeeManagement />} />
//   </Route>
// ============================================================
 
export default function ProtectedRoute({ allowedRoles }) {
    const { currentUser, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
 
    // AuthContext hasn't finished checking localStorage yet. Without this
    // guard, a logged-in user would flash to /login on every hard refresh
    // before their session is restored.
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-dm-gray">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-dm-navy/20 border-t-dm-gold" />
                    <p className="text-sm text-dm-navy/70">Loading…</p>
                </div>
            </div>
        );
    }
 
    // Not logged in at all — send to login, remembering where they were
    // trying to go so Login can send them back after a successful sign-in.
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
 
    // Logged in, but this route is restricted to certain roles and the
    // current user isn't one of them — send to the dashboard rather than
    // showing a dead end.
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/dashboard" replace />;
    }
 
    return <Outlet />;
}
 
