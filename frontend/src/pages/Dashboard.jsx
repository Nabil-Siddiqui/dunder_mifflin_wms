import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ============================================================
// Dashboard
// ============================================================
// Landing page after login. Shows a handful of summary cards
// pulled from data every role already has access to. Content
// shown differs slightly by role, but all data comes from
// endpoints the user is already permitted to call — no new
// backend routes needed for this page.
// ============================================================

function SummaryCard({ label, value, accent = 'navy' }) {
    const accentClasses = {
        navy: 'text-dm-navy',
        gold: 'text-dm-gold',
        red: 'text-red-600',
        green: 'text-green-600',
    };

    return (
        <div className="rounded-lg border border-dm-border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`mt-1 text-3xl font-semibold ${accentClasses[accent]}`}>{value}</p>
        </div>
    );
}

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [products, setProducts] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                const requests = [api.get('/products'), api.get('/sales-orders')];

                // Purchase Orders endpoint is Manager/Warehouse only — skip
                // the call entirely for Sales Reps rather than letting it
                // fail with a 403.
                if (currentUser?.role === 'Manager' || currentUser?.role === 'Warehouse') {
                    requests.push(api.get('/purchase-orders'));
                }

                const results = await Promise.all(requests);

                setProducts(results[0].data);
                setSalesOrders(results[1].data);
                if (results[2]) {
                    setPurchaseOrders(results[2].data);
                }
            } catch (err) {
                console.error('Error loading dashboard data:', err);
            } finally {
                setIsLoading(false);
            }
        }

        loadDashboardData();
    }, [currentUser]);

    if (isLoading) {
        return <p className="text-sm text-gray-500">Loading dashboard…</p>;
    }

    const lowStockCount = products.filter((p) => p.lowStock).length;
    const pendingOrdersCount = salesOrders.filter((o) => o.status === 'Pending').length;
    const awaitingStockCount = salesOrders.filter((o) => o.status === 'Awaiting Stock').length;
    const approvedReadyToShipCount = salesOrders.filter((o) => o.status === 'Approved').length;
    const orderedPurchaseOrdersCount = purchaseOrders.filter((po) => po.status === 'Ordered').length;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-dm-navy">
                    Welcome back, {currentUser?.name?.split(' ')[0]}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Here's what's happening at the Scranton branch today.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard label="Products Low on Stock" value={lowStockCount} accent="red" />

                {currentUser?.role === 'Sales' ? (
                    <SummaryCard label="Your Pending Orders" value={pendingOrdersCount} accent="gold" />
                ) : (
                    <SummaryCard label="Orders Awaiting Approval" value={pendingOrdersCount} accent="gold" />
                )}

                <SummaryCard label="Orders Awaiting Stock" value={awaitingStockCount} accent="navy" />

                {currentUser?.role === 'Warehouse' ? (
                    <SummaryCard label="Ready to Ship" value={approvedReadyToShipCount} accent="green" />
                ) : (
                    <SummaryCard label="Total Products" value={products.length} accent="navy" />
                )}

                {(currentUser?.role === 'Manager' || currentUser?.role === 'Warehouse') && (
                    <SummaryCard
                        label="Purchase Orders Awaiting Delivery"
                        value={orderedPurchaseOrdersCount}
                        accent="navy"
                    />
                )}
            </div>
        </div>
    );
}