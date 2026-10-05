'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../lib/api';

export default function ScheduleSessionModal({ onClose, onScheduled }) {
  const [acceptedSwaps, setAcceptedSwaps] = useState(null);
  const [swapRequestId, setSwapRequestId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isOnline, setIsOnline] = useState(true);
  const [meetingLink, setMeetingLink] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch('/api/swap-requests/me')
      .then((data) => {
        const all = [...data.sent, ...data.received].filter((r) => r.status === 'accepted');
        setAcceptedSwaps(all);
        if (all[0]) {
          setSwapRequestId(all[0]._id);
          setSkillId(all[0].offeredSkill._id);
        }
      })
      .catch(() => setError('Could not load accepted swaps.'));
  }, []);

  const selectedSwap = acceptedSwaps?.find((s) => s._id === swapRequestId);

  async function submit(e) {
    e.preventDefault();
    if (!date || !startTime) {
      setError('Pick a date and start time.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const start = new Date(`${date}T${startTime}:00`);
      const end = new Date(start.getTime() + durationMinutes * 60000);
      await apiFetch('/api/sessions', {
        method: 'POST',
        body: {
          swapRequestId,
          skillId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          isOnline,
          meetingLink,
          address,
        },
      });
      onScheduled?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not schedule the session.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/30 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div className="bg-paper border border-line rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl mb-5">Schedule a session</h2>

        {acceptedSwaps === null && <p className="text-sm text-ink/40">Loading…</p>}
        {acceptedSwaps?.length === 0 && (
          <p className="text-sm text-ink/50">
            No accepted swaps yet - accept or send a swap request first.
          </p>
        )}

        {acceptedSwaps?.length > 0 && (
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-sm text-learn-dark">{error}</p>}

            <label className="block">
              <span className="text-sm text-ink/70 mb-1 block">Swap</span>
              <select
                value={swapRequestId}
                onChange={(e) => {
                  const swap = acceptedSwaps.find((s) => s._id === e.target.value);
                  setSwapRequestId(e.target.value);
                  setSkillId(swap?.offeredSkill._id || '');
                }}
                className="w-full border border-line rounded-lg px-3 py-2 bg-white"
              >
                {acceptedSwaps.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.offeredSkill.name} ↔ {s.requestedSkill.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedSwap && (
              <label className="block">
                <span className="text-sm text-ink/70 mb-1 block">Which skill is being taught this session?</span>
                <select
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 bg-white"
                >
                  <option value={selectedSwap.offeredSkill._id}>{selectedSwap.offeredSkill.name}</option>
                  <option value={selectedSwap.requestedSkill._id}>{selectedSwap.requestedSkill.name}</option>
                </select>
              </label>
            )}

            <div className="flex gap-3">
              <label className="block flex-1">
                <span className="text-sm text-ink/70 mb-1 block">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full border border-line rounded-lg px-3 py-2 bg-white" />
              </label>
              <label className="block flex-1">
                <span className="text-sm text-ink/70 mb-1 block">Start time</span>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full border border-line rounded-lg px-3 py-2 bg-white" />
              </label>
            </div>

            <label className="block">
              <span className="text-sm text-ink/70 mb-1 block">Duration</span>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full border border-line rounded-lg px-3 py-2 bg-white"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} />
              <span className="text-sm">Online session</span>
            </label>

            {isOnline ? (
              <label className="block">
                <span className="text-sm text-ink/70 mb-1 block">Meeting link (optional)</span>
                <input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 bg-white" />
              </label>
            ) : (
              <label className="block">
                <span className="text-sm text-ink/70 mb-1 block">Address</span>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 bg-white" />
              </label>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="text-ink/60 px-4 py-2">Cancel</button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-teach text-paper px-5 py-2 rounded-full hover:bg-teach-dark transition-colors disabled:opacity-50"
              >
                {submitting ? 'Scheduling…' : 'Schedule'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
