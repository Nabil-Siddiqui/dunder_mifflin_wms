import React from 'react';

// ============================================================
// Status Badge
// ============================================================
// Small colored pill representing an order's current status.
// Shared between Sales Orders (Pending/Approved/Awaiting Stock/
// Shipped/Rejected) and Purchase Orders (Ordered/Received), so
// the color mapping covers every status string used by both.
// ============================================================

const STATUS_STYLES = {
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Approved: 'bg-green-100 text-green-800 border-green-300',
    'Awaiting Stock': 'bg-orange-100 text-orange-800 border-orange-300',
    Shipped: 'bg-blue-100 text-blue-800 border-blue-300',
    Rejected: 'bg-red-100 text-red-800 border-red-300',
    Ordered: 'bg-purple-100 text-purple-800 border-purple-300',
    Received: 'bg-green-100 text-green-800 border-green-300',
};

const DEFAULT_STYLE = 'bg-gray-100 text-gray-800 border-gray-300';

function StatusBadge({ status }) {
    const styles = STATUS_STYLES[status] || DEFAULT_STYLE;

    return (
        <span
            className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}
        >
            {status}
        </span>
    );
}

export default StatusBadge;