import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ============================================================
// Clients Page
// ============================================================
// Manager/Warehouse see all clients, including which Sales Rep
// (if any) each one is assigned to. Sales Reps see only their
// own assigned clients — the backend already filters this, so
// this page just renders whatever comes back, adjusting columns
// slightly based on role.
// ============================================================

export default function Clients() {
    const { currentUser } = useAuth();
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadClients() {
            try {
                const response = await api.get('/clients');
                setClients(response.data);
            } catch (err) {
                console.error('Error loading clients:', err);
                setError('Failed to load clients. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }

        loadClients();
    }, []);

    if (isLoading) {
        return <p className="text-sm text-gray-500">Loading clients…</p>;
    }

    if (error) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    const showRepColumn = currentUser?.role === 'Manager' || currentUser?.role === 'Warehouse';

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-dm-navy">Clients</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {currentUser?.role === 'Sales'
                        ? 'Clients currently assigned to you.'
                        : 'All client accounts and their assigned Sales Representative.'}
                </p>
            </div>

            {clients.length === 0 ? (
                <div className="rounded-lg border border-dm-border bg-white p-8 text-center text-sm text-gray-500">
                    {currentUser?.role === 'Sales'
                        ? 'No clients are assigned to you yet. Contact your manager.'
                        : 'No clients found.'}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-dm-border bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-dm-border bg-dm-gray text-left text-xs uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">Company</th>
                                <th className="px-4 py-3">Contact Person</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Phone</th>
                                {showRepColumn && <th className="px-4 py-3">Assigned Rep</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((client) => (
                                <tr key={client.id} className="border-b border-dm-border last:border-0">
                                    <td className="px-4 py-3 font-medium text-dm-navy">
                                        {client.company_name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{client.contact_person}</td>
                                    <td className="px-4 py-3 text-gray-600">{client.email}</td>
                                    <td className="px-4 py-3 text-gray-600">{client.phone}</td>
                                    {showRepColumn && (
                                        <td className="px-4 py-3 text-gray-600">
                                            {client.assigned_sales_rep_name || (
                                                <span className="text-gray-400 italic">Unassigned</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}