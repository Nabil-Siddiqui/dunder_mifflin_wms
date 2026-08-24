import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ============================================================
// Sidebar
// ============================================================
// Navigation links shown depend on the logged-in user's role.
// Each link is only rendered if the current role is allowed to
// see it — this mirrors (but does not replace) the backend's
// own role checks; it just keeps the UI from showing links that
// would fail anyway.
// ============================================================

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard', roles: ['Manager', 'Warehouse', 'Sales'] },
    { label: 'Inventory', path: '/inventory', roles: ['Manager', 'Warehouse', 'Sales'] },
    { label: 'Clients', path: '/clients', roles: ['Manager', 'Warehouse', 'Sales'] },
    { label: 'Sales Orders', path: '/sales-orders', roles: ['Manager', 'Warehouse', 'Sales'] },
    { label: 'Purchase Orders', path: '/purchase-orders', roles: ['Manager', 'Warehouse'] },
    { label: 'Employees', path: '/employees', roles: ['Manager'] },
];

function Sidebar() {
    const { currentUser } = useAuth();

    const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(currentUser?.role));

    return (
        <aside className="w-60 shrink-0 bg-dm-navy text-white flex flex-col h-screen sticky top-0">
            <div className="px-6 py-6 border-b border-white/10">
                <h1 className="text-lg font-semibold leading-tight">Dunder Mifflin</h1>
                <p className="text-xs text-white/60 mt-1">Scranton Branch — WMS</p>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-dm-gold text-dm-navy'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="px-6 py-4 border-t border-white/10 text-xs text-white/40">
                &copy; {new Date().getFullYear()} Dunder Mifflin Paper Company
            </div>
        </aside>
    );
}

export default Sidebar;