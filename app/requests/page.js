'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '../../components/RequireAuth';
import { apiFetch, ApiError } from '../../lib/api';

export default function RequestsPage() {
  return (
    <RequireAuth>
      <RequestsContent />
    </RequireAuth>
  );
}

function RequestsContent() {
  const router = useRouter();
  const [sent, setSent] = useState(null);
  const [received, setReceived] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      const data = await apiFetch('/api/swap-requests/me');
      setSent(data.sent);
      setReceived(data.received);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load requests.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function respond(id, action) {
    setBusyId(id);
    try {
      const data = await apiFetch(`/api/swap-requests/${id}/respond`, { method: 'POST', body: { action } });
      await load();
      if (action === 'accept' && data.conversation) {
        router.push('/messages');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(id) {
    setBusyId(id);
    try {
      await apiFetch(`/api/swap-requests/${id}/cancel`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Swap requests</h1>
      {error && <p className="text-learn-dark mb-4">{error}</p>}

      <section className="mb-12">
        <h2 className="font-medium text-lg mb-4">Received</h2>
        {received === null && <p className="text-ink/40 text-sm">Loading…</p>}
        {received?.length === 0 && <p className="text-ink/50 text-sm">No requests yet.</p>}
        <div className="space-y-3">
          {received?.map((r) => (
            <div key={r._id} className="border border-line rounded-xl p-4 bg-white/60 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{r.requester?.displayName}</p>
                <p className="text-sm text-ink/60">
                  Offers <span className="text-teach-dark">{r.offeredSkill?.name}</span> for{' '}
                  <span className="text-learn-dark">{r.requestedSkill?.name}</span>
                </p>
                {r.message && <p className="text-sm text-ink/50 mt-1">"{r.message}"</p>}
                <StatusBadge status={r.status} />
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => respond(r._id, 'accept')}
                    disabled={busyId === r._id}
                    className="bg-teach text-paper px-4 py-2 rounded-full text-sm hover:bg-teach-dark transition-colors disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(r._id, 'reject')}
                    disabled={busyId === r._id}
                    className="border border-line px-4 py-2 rounded-full text-sm hover:border-learn disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-lg mb-4">Sent</h2>
        {sent === null && <p className="text-ink/40 text-sm">Loading…</p>}
        {sent?.length === 0 && <p className="text-ink/50 text-sm">You haven't sent any requests yet.</p>}
        <div className="space-y-3">
          {sent?.map((r) => (
            <div key={r._id} className="border border-line rounded-xl p-4 bg-white/60 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{r.recipient?.displayName}</p>
                <p className="text-sm text-ink/60">
                  You offer <span className="text-teach-dark">{r.offeredSkill?.name}</span> for{' '}
                  <span className="text-learn-dark">{r.requestedSkill?.name}</span>
                </p>
                <StatusBadge status={r.status} />
              </div>
              {r.status === 'pending' && (
                <button
                  onClick={() => cancel(r._id)}
                  disabled={busyId === r._id}
                  className="text-sm text-learn-dark hover:underline shrink-0"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-paper text-ink/60 border border-line',
    accepted: 'bg-teach-tint text-teach-dark',
    rejected: 'bg-learn-tint text-learn-dark',
    cancelled: 'bg-paper text-ink/40 border border-line',
    completed: 'bg-teach-tint text-teach-dark',
  };
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-2 capitalize ${styles[status] || ''}`}>
      {status}
    </span>
  );
}
