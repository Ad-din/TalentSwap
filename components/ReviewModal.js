'use client';

import { useState } from 'react';
import { apiFetch, ApiError } from '../lib/api';

export default function ReviewModal({ session, otherName, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/reviews', { method: 'POST', body: { sessionId: session._id, rating, comment } });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/30 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div className="bg-paper border border-line rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl mb-5">Rate your session with {otherName}</h2>

        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-sm text-learn-dark">{error}</p>}

          <div className="flex gap-1 justify-center text-3xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={n <= rating ? 'text-learn' : 'text-line'}
              >
                ★
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-sm text-ink/70 mb-1 block">Comment (optional)</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full border border-line rounded-lg px-3 py-2 bg-white"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-ink/60 px-4 py-2">Skip</button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-teach text-paper px-5 py-2 rounded-full hover:bg-teach-dark transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
