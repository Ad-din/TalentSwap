'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../lib/api';

export default function SwapRequestModal({ recipient, onClose, onSent }) {
  const [myTeach, setMyTeach] = useState([]);
  const [theirTeach, setTheirTeach] = useState([]);
  const [offeredSkillId, setOfferedSkillId] = useState('');
  const [requestedSkillId, setRequestedSkillId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch('/api/user-skills/me'), apiFetch(`/api/user-skills/${recipient._id}`)])
      .then(([mine, theirs]) => {
        setMyTeach(mine.teach);
        setTheirTeach(theirs.teach);
        if (mine.teach[0]) setOfferedSkillId(mine.teach[0].skill._id);
        if (theirs.teach[0]) setRequestedSkillId(theirs.teach[0].skill._id);
      })
      .catch(() => setError('Could not load skill lists.'))
      .finally(() => setLoading(false));
  }, [recipient._id]);

  async function submit(e) {
    e.preventDefault();
    if (!offeredSkillId || !requestedSkillId) {
      setError('Pick a skill on both sides.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/swap-requests', {
        method: 'POST',
        body: { recipientId: recipient._id, offeredSkillId, requestedSkillId, message },
      });
      onSent?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/30 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div
        className="bg-paper border border-line rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl mb-1">Propose a swap with {recipient.displayName}</h2>
        <p className="text-sm text-ink/60 mb-5">Pick what you'll teach and what you want in return.</p>

        {loading && <p className="text-sm text-ink/40">Loading your skills…</p>}

        {!loading && (
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-sm text-learn-dark">{error}</p>}

            {myTeach.length === 0 ? (
              <p className="text-sm text-learn-dark">
                You haven't listed anything to teach yet - add a skill on your profile first.
              </p>
            ) : (
              <label className="block">
                <span className="text-sm text-ink/70 mb-1 block">You'll teach</span>
                <select
                  value={offeredSkillId}
                  onChange={(e) => setOfferedSkillId(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 bg-white"
                >
                  {myTeach.map((s) => (
                    <option key={s._id} value={s.skill._id}>{s.skill.name}</option>
                  ))}
                </select>
              </label>
            )}

            {theirTeach.length === 0 ? (
              <p className="text-sm text-learn-dark">{recipient.displayName} hasn't listed anything to teach yet.</p>
            ) : (
              <label className="block">
                <span className="text-sm text-ink/70 mb-1 block">You'll learn</span>
                <select
                  value={requestedSkillId}
                  onChange={(e) => setRequestedSkillId(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 bg-white"
                >
                  {theirTeach.map((s) => (
                    <option key={s._id} value={s.skill._id}>{s.skill.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="text-sm text-ink/70 mb-1 block">Message (optional)</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full border border-line rounded-lg px-3 py-2 bg-white"
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="text-ink/60 px-4 py-2">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || myTeach.length === 0 || theirTeach.length === 0}
                className="bg-teach text-paper px-5 py-2 rounded-full hover:bg-teach-dark transition-colors disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
