'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '../../components/RequireAuth';
import { apiFetch, ApiError } from '../../lib/api';

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  );
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await apiFetch('/api/notifications/me');
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load notifications.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      // non-critical - leave as-is on failure
    }
  }

  async function markAllRead() {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // non-critical
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Notifications</h1>
        {notifications?.some((n) => !n.isRead) && (
          <button onClick={markAllRead} className="text-sm text-teach hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {error && <p className="text-learn-dark mb-4">{error}</p>}
      {notifications === null && <p className="text-ink/40 text-sm">Loading…</p>}
      {notifications?.length === 0 && <p className="text-ink/50 text-sm">Nothing yet.</p>}

      <div className="space-y-2">
        {notifications?.map((n) => (
          <Link
            key={n._id}
            href={n.link || '#'}
            onClick={() => !n.isRead && markRead(n._id)}
            className={`block border rounded-xl px-4 py-3 transition-colors ${
              n.isRead ? 'border-line bg-white/40' : 'border-teach/30 bg-teach-tint/40'
            }`}
          >
            <p className="text-sm font-medium">{n.title}</p>
            {n.message && <p className="text-sm text-ink/60 mt-0.5">{n.message}</p>}
            <p className="text-xs text-ink/40 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
