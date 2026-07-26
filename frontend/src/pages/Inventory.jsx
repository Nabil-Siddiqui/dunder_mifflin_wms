import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ============================================================
// Inventory Page
// ============================================================
// Read-only product catalog view for all roles. Rows where the
// backend has flagged "lowStock" (quantity_in_stock <= reorder_
// threshold) are visually highlighted so low inventory is easy
// to spot without any client-side recalculation.
//
// Manager and Warehouse additionally see a "Replenish Low Stock"
// button, which asks the backend to auto-create Purchase Orders
// bringing every low-stock product back up to double its reorder
// threshold (skipping any product that already has a pending
// Purchase Order in transit).
// ============================================================

export default function Inventory() {
    const { currentUser } = useAuth();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [isReplenishing, setIsReplenishing] = useState(false);
    const [replenishMessage, setReplenishMessage] = useState('');
    const [replenishError, setReplenishError] = useState('');

    async function loadProducts() {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (err) {
            console.error('Error loading products:', err);
            setError('Failed to load inventory. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadProducts();
    }, []);

    async function handleReplenish() {
        setIsReplenishing(true);
        setReplenishMessage('');
        setReplenishError('');

        try {
            const response = await api.post('/purchase-orders/replenish');
            setReplenishMessage(response.data.message);
            await loadProducts();
        } catch (err) {
            setReplenishError(err.response?.data?.error || 'Failed to replenish low-stock products.');
        } finally {
            setIsReplenishing(false);
        }
    }

    if (isLoading) {
        return <p className="text-sm text-gray-500">Loading inventory…</p>;
    }

    if (error) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    const categories = ['All', ...new Set(products.map((p) => p.category))];
    const visibleProducts =
        categoryFilter === 'All' ? products : products.filter((p) => p.category === categoryFilter);

    const canReplenish = currentUser?.role === 'Manager' || currentUser?.role === 'Warehouse';

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-dm-navy">Inventory</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Current stock levels across all paper categories.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {canReplenish && (
                        <button
                            onClick={handleReplenish}
                            disabled={isReplenishing}
                            className="rounded-md bg-dm-navy px-4 py-2 text-sm font-medium text-white hover:bg-dm-navyLight transition-colors disabled:opacity-60"
                        >
                            {isReplenishing ? 'Replenishing…' : 'Replenish Low Stock'}
                        </button>
                    )}

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="rounded-md border border-dm-border px-3 py-2 text-sm text-dm-navy focus:border-dm-navy focus:outline-none"
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {replenishMessage && (
                <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {replenishMessage}
                </div>
            )}

            {replenishError && (
                <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {replenishError}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-dm-border bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-dm-border bg-dm-gray text-left text-xs uppercase tracking-wide text-gray-500">
                            <th className="px-4 py-3">SKU</th>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Size / Weight</th>
                            <th className="px-4 py-3">Vendor</th>
                            <th className="px-4 py-3 text-right">Unit Price</th>
                            <th className="px-4 py-3 text-right">In Stock</th>
                            <th className="px-4 py-3 text-right">Reorder At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleProducts.map((product) => (
                            <tr
                                key={product.id}
                                className={`border-b border-dm-border last:border-0 ${
                                    product.lowStock ? 'bg-red-50' : ''
                                }`}
                            >
                                <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.sku}</td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-dm-navy">{product.name}</p>
                                    <p className="text-xs text-gray-500">{product.category}</p>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {product.size} · {product.weight}
                                </td>
                                <td className="px-4 py-3 text-gray-600">{product.vendor_name}</td>
                                <td className="px-4 py-3 text-right text-gray-600">
                                    ${Number(product.unit_price).toFixed(2)}
                                </td>
                                <td
                                    className={`px-4 py-3 text-right font-medium ${
                                        product.lowStock ? 'text-red-600' : 'text-dm-navy'
                                    }`}
                                >
                                    {product.quantity_in_stock}
                                    {product.lowStock && (
                                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                                            Low
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-500">
                                    {product.reorder_threshold}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}