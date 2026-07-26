import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';

// ============================================================
// Purchase Orders Page
// ============================================================
// Manager and Warehouse only (enforced both by the route guard
// in App.jsx and by the backend). Warehouse can mark an
// "Ordered" purchase order as "Received," which tops up stock
// and — if it was auto-triggered by a Sales Order — flips that
// order back to "Approved" on the backend.
// ============================================================

export default function PurchaseOrders() {
    const { currentUser } = useAuth();

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [actionErrorById, setActionErrorById] = useState({});
    const [lastReceivedNote, setLastReceivedNote] = useState('');

    async function loadPurchaseOrders() {
        try {
            const response = await api.get('/purchase-orders');
            setPurchaseOrders(response.data);
        } catch (err) {
            console.error('Error loading purchase orders:', err);
            setError('Failed to load purchase orders. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadPurchaseOrders();
    }, []);

    async function handleReceive(id) {
        setProcessingId(id);
        setActionErrorById((prev) => ({ ...prev, [id]: '' }));
        setLastReceivedNote('');

        try {
            const response = await api.patch(`/purchase-orders/${id}/receive`);
            if (response.data.linkedSalesOrderUpdated) {
                setLastReceivedNote(
                    'Linked sales order has been moved back to "Approved" and is now ready to ship.'
                );
            }
            await loadPurchaseOrders();
        } catch (err) {
            setActionErrorById((prev) => ({
                ...prev,
                [id]: err.response?.data?.error || 'Failed to receive this purchase order.',
            }));
        } finally {
            setProcessingId(null);
        }
    }

    if (isLoading) {
        return <p className="text-sm text-gray-500">Loading purchase orders…</p>;
    }

    if (error) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    const isWarehouse = currentUser?.role === 'Warehouse';

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-dm-navy">Purchase Orders</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Restock orders placed with vendors, either automatically (from an
                    approved sales order exceeding stock) or manually.
                </p>
            </div>

            {lastReceivedNote && (
                <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {lastReceivedNote}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-dm-border bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-dm-border bg-dm-gray text-left text-xs uppercase tracking-wide text-gray-500">
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Vendor</th>
                            <th className="px-4 py-3 text-right">Quantity</th>
                            <th className="px-4 py-3">Linked Sales Order</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Ordered</th>
                            <th className="px-4 py-3">Received By</th>
                            {isWarehouse && <th className="px-4 py-3">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseOrders.length === 0 && (
                            <tr>
                                <td colSpan={isWarehouse ? 8 : 7} className="px-4 py-6 text-center text-gray-500">
                                    No purchase orders found.
                                </td>
                            </tr>
                        )}

                        {purchaseOrders.map((po) => (
                            <tr key={po.id} className="border-b border-dm-border last:border-0 align-top">
                                <td className="px-4 py-3">
                                    <p className="font-medium text-dm-navy">{po.product_name}</p>
                                    <p className="text-xs text-gray-400">{po.sku}</p>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{po.vendor_name}</td>
                                <td className="px-4 py-3 text-right text-gray-600">{po.quantity_ordered}</td>
                                <td className="px-4 py-3 text-gray-600">
                                    {po.triggering_sales_order_id ? (
                                        <span>#{po.triggering_sales_order_id}</span>
                                    ) : (
                                        <span className="text-gray-400 italic">Manual restock</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={po.status} />
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {new Date(po.ordered_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {po.received_by_name || <span className="text-gray-400">—</span>}
                                </td>
                                {isWarehouse && (
                                    <td className="px-4 py-3">
                                        {po.status === 'Ordered' && (
                                            <button
                                                onClick={() => handleReceive(po.id)}
                                                disabled={processingId === po.id}
                                                className="rounded-md bg-dm-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-dm-navyLight disabled:opacity-60"
                                            >
                                                {processingId === po.id ? 'Receiving…' : 'Mark as Received'}
                                            </button>
                                        )}
                                        {actionErrorById[po.id] && (
                                            <p className="mt-1 text-xs text-red-600">{actionErrorById[po.id]}</p>
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