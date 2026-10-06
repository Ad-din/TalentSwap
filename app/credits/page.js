'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '../../components/RequireAuth';
import { apiFetch, ApiError } from '../../lib/api';

const TYPE_LABELS = {
  teaching_reward: 'Teaching reward',
  learning_cost: 'Learning cost',
  signup_bonus: 'Signup bonus',
  admin_adjustment: 'Admin adjustment',
};

export default function CreditsPage() {
  return (
    <RequireAuth>
      <CreditsContent />
    </RequireAuth>
  );
}

function CreditsContent() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([apiFetch('/api/credits/me/balance'), apiFetch('/api/credits/me/history')])
      .then(([b, h]) => {
        setBalance(b.balance);
        setTransactions(h.transactions);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load credit history.'));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl mb-1">Skill Credits</h1>
      <p className="text-ink/60 mb-8">Earn credits by teaching, spend them to learn.</p>

      {error && <p className="text-learn-dark mb-4">{error}</p>}

      <div className="border border-line rounded-2xl p-8 bg-teach-tint/40 text-center mb-8">
        <p className="text-sm text-ink/60 mb-1">Current balance</p>
        <p className="font-display text-5xl text-teach-dark">{balance ?? '—'}</p>
      </div>

      <h2 className="font-medium mb-3">Transaction history</h2>
      {transactions === null && <p className="text-ink/40 text-sm">Loading…</p>}
      {transactions?.length === 0 && <p className="text-ink/50 text-sm">No transactions yet.</p>}

      <div className="space-y-2">
        {transactions?.map((t) => (
          <div key={t._id} className="border border-line rounded-xl px-4 py-3 bg-white/60 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{TYPE_LABELS[t.type] || t.type}</p>
              <p className="text-xs text-ink/50">{new Date(t.createdAt).toLocaleString()}</p>
            </div>
            <p className={`font-medium tabular-nums ${t.amount >= 0 ? 'text-teach-dark' : 'text-learn-dark'}`}>
              {t.amount >= 0 ? '+' : ''}{t.amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
