import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ============================================================
// Login Page
// ============================================================
// Only entry point into the app for unauthenticated users.
// Delegates the actual request to AuthContext.login(), which
// handles storing the token/user and updating currentUser.
// ============================================================

export default function Login() {
    const { login, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Already logged in (e.g. session restored from localStorage) —
    // don't show the login form, just continue on.
    if (!isLoading && isAuthenticated) {
        const redirectTo = location.state?.from?.pathname || '/dashboard';
        return <Navigate to={redirectTo} replace />;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(email, password);
            const redirectTo = location.state?.from?.pathname || '/dashboard';
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.error || 'Unable to log in. Please check your credentials and try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-dm-gray px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-dm-navy">
                        <svg viewBox="0 0 24 24" className="h-7 w-7 text-dm-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-dm-navy">Dunder Mifflin Paper Company</h1>
                    <p className="mt-1 text-sm text-dm-navy/60">Scranton Branch</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-lg border border-dm-border bg-white p-6 shadow-sm"
                >
                    <h2 className="mb-5 text-base font-medium text-dm-navy">Sign in to your account</h2>

                    {error && (
                        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <label className="mb-1 block text-sm font-medium text-dm-navy" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="username"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mb-4 w-full rounded-md border border-dm-border px-3 py-2 text-sm text-dm-navy focus:border-dm-navy focus:outline-none"
                        placeholder="name@dundermifflin.com"
                    />

                    <label className="mb-1 block text-sm font-medium text-dm-navy" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mb-6 w-full rounded-md border border-dm-border px-3 py-2 text-sm text-dm-navy focus:border-dm-navy focus:outline-none"
                        placeholder="••••••••"
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-md bg-dm-navy py-2 text-sm font-medium text-white transition-colors hover:bg-dm-navyLight disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-dm-navy/40">
                    Employee access only. Contact your manager if you need an account.
                </p>
            </div>
        </div>
    );
}
