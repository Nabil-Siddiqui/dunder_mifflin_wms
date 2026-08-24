import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// ============================================================
// Auth Context
// ============================================================
// Provides the current logged-in user, a login() function, and
// a logout() function to any component in the app via the
// useAuth() hook, without prop-drilling through every layer.
// ============================================================

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // On first load, restore the session from localStorage if present.
    // This is what keeps someone logged in after refreshing the page.
    useEffect(() => {
        const storedUser = localStorage.getItem('dm_user');
        const storedToken = localStorage.getItem('dm_token');

        if (storedUser && storedToken) {
            setCurrentUser(JSON.parse(storedUser));
        }

        setIsLoading(false);
    }, []);

    async function login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data;

        localStorage.setItem('dm_token', token);
        localStorage.setItem('dm_user', JSON.stringify(user));
        setCurrentUser(user);

        return user;
    }

    function logout() {
        localStorage.removeItem('dm_token');
        localStorage.removeItem('dm_user');
        setCurrentUser(null);
    }

    const value = {
        currentUser,
        isLoading,
        login,
        logout,
        isAuthenticated: !!currentUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for consuming the context cleanly in components:
//   const { currentUser, login, logout } = useAuth();
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider.');
    }
    return context;
}