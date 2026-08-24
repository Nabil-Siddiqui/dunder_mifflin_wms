import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ============================================================
// Navbar
// ============================================================
// Top bar shown on every authenticated page. Displays the
// logged-in user's name and role, and a logout button.
// ============================================================

function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    return (
        <header className="flex items-center justify-between bg-white border-b border-dm-border px-6 py-3">
            <div />

            <div className="flex items-center gap-4">
                <div className="text-right leading-tight">
                    <p className="text-sm font-medium text-dm-navy">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500">{currentUser?.role}</p>
                </div>

                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-dm-navy border border-dm-border rounded-md px-3 py-1.5 hover:bg-dm-gray transition-colors"
                >
                    Log Out
                </button>
            </div>
        </header>
    );
}

export default Navbar;