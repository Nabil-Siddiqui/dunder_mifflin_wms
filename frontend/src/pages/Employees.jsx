import React, { useEffect, useState } from 'react';
import api from '../services/api';

// ============================================================
// Employees Page (Manager only)
// ============================================================
// Three things happen here:
//   1. Create a new Sales Rep, optionally assigning any
//      currently-unassigned clients to them at creation time.
//   2. View existing Sales Reps, their assigned clients, and
//      activate/deactivate their accounts.
//   3. Reassign any client to a different Sales Rep at any time.
// ============================================================

export default function Employees() {
    const [reps, setReps] = useState([]);
    const [allClients, setAllClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [selectedClientIds, setSelectedClientIds] = useState([]);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [reassignErrorByClientId, setReassignErrorByClientId] = useState({});
    const [processingClientId, setProcessingClientId] = useState(null);
    const [statusErrorByRepId, setStatusErrorByRepId] = useState({});

    async function loadData() {
        try {
            const [repsRes, clientsRes] = await Promise.all([api.get('/users'), api.get('/clients')]);
            setReps(repsRes.data);
            setAllClients(clientsRes.data);
        } catch (err) {
            console.error('Error loading employees data:', err);
            setError('Failed to load employee data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const unassignedClients = allClients.filter((c) => !c.assigned_sales_rep_id);

    function toggleClientSelection(clientId) {
        setSelectedClientIds((prev) =>
            prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
        );
    }

    async function handleCreateRep(e) {
        e.preventDefault();
        setFormError('');

        if (!formName || !formEmail || !formPassword) {
            setFormError('Name, email, and password are all required.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/users', {
                name: formName,
                email: formEmail,
                password: formPassword,
                clientIds: selectedClientIds,
            });

            setFormName('');
            setFormEmail('');
            setFormPassword('');
            setSelectedClientIds([]);
            await loadData();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to create sales representative.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleToggleActive(repId, currentIsActive) {
        setStatusErrorByRepId((prev) => ({ ...prev, [repId]: '' }));
        try {
            await api.patch(`/users/${repId}/status`, { isActive: !currentIsActive });
            await loadData();
        } catch (err) {
            setStatusErrorByRepId((prev) => ({
                ...prev,
                [repId]: err.response?.data?.error || 'Failed to update account status.',
            }));
        }
    }

    async function handleReassign(clientId, newRepId) {
        setProcessingClientId(clientId);
        setReassignErrorByClientId((prev) => ({ ...prev, [clientId]: '' }));

        try {
            await api.patch(`/users/${newRepId}/clients`, { clientId });
            await loadData();
        } catch (err) {
            setReassignErrorByClientId((prev) => ({
                ...prev,
                [clientId]: err.response?.data?.error || 'Failed to reassign client.',
            }));
        } finally {
            setProcessingClientId(null);
        }
    }

    if (isLoading) {
        return <p className="text-sm text-gray-500">Loading employee data…</p>;
    }

    if (error) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-dm-navy">Employees</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Create Sales Representative accounts and manage client assignments.
                </p>
            </div>

            {/* --- Create New Sales Rep --- */}
            <form
                onSubmit={handleCreateRep}
                className="mb-8 rounded-lg border border-dm-border bg-white p-5 shadow-sm"
            >
                <h2 className="mb-4 text-base font-medium text-dm-navy">Create New Sales Representative</h2>

                {formError && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {formError}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-dm-navy">Full Name</label>
                        <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full rounded-md border border-dm-border px-3 py-2 text-sm focus:border-dm-navy focus:outline-none"
                            placeholder="Jim Halpert"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-dm-navy">Email</label>
                        <input
                            type="email"
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                            className="w-full rounded-md border border-dm-border px-3 py-2 text-sm focus:border-dm-navy focus:outline-none"
                            placeholder="jim.halpert@dundermifflin.com"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-dm-navy">Temporary Password</label>
                        <input
                            type="text"
                            value={formPassword}
                            onChange={(e) => setFormPassword(e.target.value)}
                            className="w-full rounded-md border border-dm-border px-3 py-2 text-sm focus:border-dm-navy focus:outline-none"
                            placeholder="Set an initial password"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-dm-navy">
                        Assign Clients (optional — only unassigned clients are shown)
                    </label>

                    {unassignedClients.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                            No unassigned clients available right now.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {unassignedClients.map((client) => (
                                <label
                                    key={client.id}
                                    className="flex items-center gap-2 rounded-md border border-dm-border px-3 py-2 text-sm cursor-pointer hover:bg-dm-gray"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedClientIds.includes(client.id)}
                                        onChange={() => toggleClientSelection(client.id)}
                                        className="accent-dm-navy"
                                    />
                                    {client.company_name}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-dm-navy px-4 py-2 text-sm font-medium text-white hover:bg-dm-navyLight transition-colors disabled:opacity-60"
                >
                    {isSubmitting ? 'Creating…' : 'Create Sales Representative'}
                </button>
            </form>

            {/* --- Existing Sales Reps --- */}
            <div className="mb-8">
                <h2 className="mb-3 text-base font-medium text-dm-navy">Sales Representatives</h2>

                {reps.length === 0 ? (
                    <div className="rounded-lg border border-dm-border bg-white p-6 text-center text-sm text-gray-500">
                        No sales representatives created yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reps.map((rep) => (
                            <div
                                key={rep.id}
                                className="rounded-lg border border-dm-border bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-dm-navy">{rep.name}</p>
                                        <p className="text-xs text-gray-500">{rep.email}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                rep.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            {rep.is_active ? 'Active' : 'Deactivated'}
                                        </span>
                                        <button
                                            onClick={() => handleToggleActive(rep.id, rep.is_active)}
                                            className="rounded-md border border-dm-border px-3 py-1.5 text-xs font-medium text-dm-navy hover:bg-dm-gray"
                                        >
                                            {rep.is_active ? 'Deactivate' : 'Reactivate'}
                                        </button>
                                    </div>
                                </div>

                                {statusErrorByRepId[rep.id] && (
                                    <p className="mt-2 text-xs text-red-600">{statusErrorByRepId[rep.id]}</p>
                                )}

                                <div className="mt-3 border-t border-dm-border pt-3">
                                    <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                                        Assigned Clients
                                    </p>
                                    {rep.assignedClients.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No clients assigned.</p>
                                    ) : (
                                        <ul className="text-sm text-gray-600 list-disc list-inside">
                                            {rep.assignedClients.map((client) => (
                                                <li key={client.id}>{client.company_name}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- Reassign Clients --- */}
            <div>
                <h2 className="mb-3 text-base font-medium text-dm-navy">Client Assignments</h2>
                <div className="overflow-x-auto rounded-lg border border-dm-border bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-dm-border bg-dm-gray text-left text-xs uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">Client</th>
                                <th className="px-4 py-3">Currently Assigned To</th>
                                <th className="px-4 py-3">Reassign</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allClients.map((client) => (
                                <tr key={client.id} className="border-b border-dm-border last:border-0">
                                    <td className="px-4 py-3 font-medium text-dm-navy">
                                        {client.company_name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {client.assigned_sales_rep_name || (
                                            <span className="italic text-gray-400">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={client.assigned_sales_rep_id || ''}
                                            onChange={(e) => handleReassign(client.id, Number(e.target.value))}
                                            disabled={processingClientId === client.id || reps.length === 0}
                                            className="rounded-md border border-dm-border px-2 py-1.5 text-xs focus:border-dm-navy focus:outline-none"
                                        >
                                            <option value="" disabled>
                                                Select a rep…
                                            </option>
                                            {reps.map((rep) => (
                                                <option key={rep.id} value={rep.id}>
                                                    {rep.name}
                                                </option>
                                            ))}
                                        </select>
                                        {reassignErrorByClientId[client.id] && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {reassignErrorByClientId[client.id]}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}