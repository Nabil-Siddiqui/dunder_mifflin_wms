import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';

// ============================================================
// Sales Orders Page
// ============================================================
// Role-specific behavior on one page:
//   - Sales:     can create a new order for one of their own
//                clients, and sees only their own orders.
//   - Manager:   sees all orders, can Approve/Reject any
//                "Pending" order.
//   - Warehouse: sees all orders, can Ship any "Approved" order.
// ============================================================

export default function SalesOrders() {
    const { currentUser } = useAuth();

    const [orders, setOrders] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formClientId, setFormClientId] = useState('');
    const [formProductId, setFormProductId] = useState('');
    const [formQuantity, setFormQuantity] = useState('');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [actionErrorByOrderId, setActionErrorByOrderId] = useState({});
    const [processingOrderId, setProcessingOrderId] = useState(null);

    async function loadData() {
        try {
            const requests = [api.get('/sales-orders')];

            if (currentUser?.role === 'Sales') {
                requests.push(api.get('/clients'), api.get('/products'));
            }

            const results = await Promise.all(requests);

            setOrders(results[0].data);
            if (results[1]) setClients(results[1].data);
            if (results[2]) setProducts(results[2].data);
        } catch (err) {
            console.error('Error loading sales orders:', err);
            setError('Failed to load sales orders. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    async function handleCreateOrder(e) {
        e.preventDefault();
        setFormError('');

        if (!formClientId || !formProductId || !formQuantity) {
            setFormError('Please fill in all fields.');
            return;
        }

        if (Number(formQuantity) <= 0) {
            setFormError('Quantity must be greater than zero.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/sales-orders', {
                clientId: Number(formClientId),
                productId: Number(formProductId),
                quantityRequested: Number(formQuantity),
            });

            setFormClientId('');
            setFormProductId('');
            setFormQuantity('');
            setShowCreateForm(false);
            await loadData();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to create order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDecision(orderId, decision) {
        setProcessingOrderId(orderId);
        setActionErrorByOrderId((prev) => ({ ...prev, [orderId]: '' }));

        try {
            await api.patch(`/sales-orders/${orderId}/decision`, { decision });
            await loadData();
        } catch (err) {
            setActionErrorByOrderId((prev) => ({
                ...prev,
                [orderId]: err.response?.data?.error || 'Failed to process decision.',
            }));
        } finally {
            setProcessingOrderId(null);
        }
    }

    async function handleShip(orderId) {
        setProcessingOrderId(orderId);
        setActionErrorByOrderId((prev) => ({ ...prev, [orderId]: '' }));

        try {
            await api.patch(`/sales-orders/${orderId}/ship`);
            await loadData();
        } catch (err) {
            setActionErrorByOrderId((prev) => ({
                ...prev,
                [orderId]: err.response?.data?.error || 'Failed to ship order.',
            }));
        } finally {
            setProcessingOrderId(null);
        }
    }

    if (isLoading) {
        return <p className="text-sm text-gray-500">Loading sales orders…</p>;
    }

    if (error) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    const isSales = currentUser?.role === 'Sales';
    const isManager = currentUser?.role === 'Manager';
    const isWarehouse = currentUser?.role === 'Warehouse';

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-dm-navy">Sales Orders</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isSales
                            ? 'Orders you have placed on behalf of your clients.'
                            : 'All sales orders across the Scranton branch.'}
                    </p>
                </div>

                {isSales && (
                    <button
                        onClick={() => setShowCreateForm((prev) => !prev)}
                        className="rounded-md bg-dm-navy px-4 py-2 text-sm font-medium text-white hover:bg-dm-navyLight transition-colors"
                    >
                        {showCreateForm ? 'Cancel' : 'New Order'}
                    </button>
                )}
            </div>

            {isSales && showCreateForm && (
                <form
                    onSubmit={handleCreateOrder}
                    className="mb-6 rounded-lg border border-dm-border bg-white p-5 shadow-sm"
                >
                    <h2 className="mb-4 text-base font-medium text-dm-navy">Create New Order</h2>

                    {formError && (
                        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-dm-navy">Client</label>
                            <select
                                value={formClientId}
                                onChange={(e) => setFormClientId(e.target.value)}
                                className="w-full rounded-md border border-dm-border px-3 py-2 text-sm focus:border-dm-navy focus:outline-none"
                            >
                                <option value="">Select a client…</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.company_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-dm-navy">Product</label>
                            <select
                                value={formProductId}
                                onChange={(e) => setFormProductId(e.target.value)}
                                className="w-full rounded-md border border-dm-border px-3 py-2 text-sm focus:border-dm-navy focus:outline-none"
                            >
                                <option value="">Select a product…</option>
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} ({product.size}, {product.weight})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-dm-navy">
                                Quantity (boxes)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formQuantity}
                                onChange={(e) => setFormQuantity(e.target.value)}
                                className="w-full rounded-md border border-dm-border px-3 py-2 text-sm focus:border-dm-navy focus:outline-none"
                                placeholder="e.g. 50"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-4 rounded-md bg-dm-navy px-4 py-2 text-sm font-medium text-white hover:bg-dm-navyLight transition-colors disabled:opacity-60"
                    >
                        {isSubmitting ? 'Submitting…' : 'Submit Order'}
                    </button>
                </form>
            )}

            {clients.length === 0 && isSales && !isLoading && (
                <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                    You have no assigned clients yet. Contact your manager before creating an order.
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-dm-border bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-dm-border bg-dm-gray text-left text-xs uppercase tracking-wide text-gray-500">
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3 text-right">Quantity</th>
                            {!isSales && <th className="px-4 py-3">Sales Rep</th>}
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Created</th>
                            {(isManager || isWarehouse) && <th className="px-4 py-3">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                                    No sales orders found.
                                </td>
                            </tr>
                        )}

                        {orders.map((order) => (
                            <tr key={order.id} className="border-b border-dm-border last:border-0 align-top">
                                <td className="px-4 py-3 font-medium text-dm-navy">{order.client_name}</td>
                                <td className="px-4 py-3 text-gray-600">
                                    {order.product_name}
                                    <p className="text-xs text-gray-400">{order.sku}</p>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-600">
                                    {order.quantity_requested}
                                </td>
                                {!isSales && (
                                    <td className="px-4 py-3 text-gray-600">{order.sales_rep_name}</td>
                                )}
                                <td className="px-4 py-3">
                                    <StatusBadge status={order.status} />
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                {(isManager || isWarehouse) && (
                                    <td className="px-4 py-3">
                                        {isManager && order.status === 'Pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDecision(order.id, 'approve')}
                                                    disabled={processingOrderId === order.id}
                                                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleDecision(order.id, 'reject')}
                                                    disabled={processingOrderId === order.id}
                                                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        {isWarehouse && order.status === 'Approved' && (
                                            <button
                                                onClick={() => handleShip(order.id)}
                                                disabled={processingOrderId === order.id}
                                                className="rounded-md bg-dm-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-dm-navyLight disabled:opacity-60"
                                            >
                                                Mark as Shipped
                                            </button>
                                        )}

                                        {actionErrorByOrderId[order.id] && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {actionErrorByOrderId[order.id]}
                                            </p>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}