'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '../../components/RequireAuth';
import { useAuth } from '../../lib/AuthContext';
import { apiFetch, ApiError } from '../../lib/api';
import ScheduleSessionModal from '../../components/ScheduleSessionModal';
import ReviewModal from '../../components/ReviewModal';

const STATUS_STYLES = {
  scheduled: 'bg-teach-tint text-teach-dark',
  in_progress: 'bg-teach-tint text-teach-dark',
  completed: 'bg-paper text-ink/60 border border-line',
  cancelled: 'bg-paper text-ink/40 border border-line',
  no_show: 'bg-learn-tint text-learn-dark',
};

export default function SessionsPage() {
  return (
    <RequireAuth>
      <SessionsContent />
    </RequireAuth>
  );
}

function SessionsContent() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [reviewSession, setReviewSession] = useState(null);

  async function load() {
    try {
      const data = await apiFetch('/api/sessions/me');
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load sessions.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id, action, body) {
    setBusyId(id);
    setError('');
    try {
      await apiFetch(`/api/sessions/${id}/${action}`, { method: 'POST', body });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  }

  async function markComplete(session) {
    await act(session._id, 'complete');
    setReviewSession(session);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Sessions</h1>
        <button
          onClick={() => setShowSchedule(true)}
          className="bg-teach text-paper px-5 py-2 rounded-full text-sm hover:bg-teach-dark transition-colors"
        >
          Schedule a session
        </button>
      </div>

      {error && <p className="text-learn-dark mb-4">{error}</p>}
      {sessions === null && <p className="text-ink/40 text-sm">Loading…</p>}
      {sessions?.length === 0 && <p className="text-ink/50 text-sm">No sessions yet.</p>}

      <div className="space-y-3">
        {sessions?.map((s) => {
          const isTeacher = s.teacher._id === profile?._id;
          const other = isTeacher ? s.learner : s.teacher;
          const canAct = ['scheduled', 'in_progress'].includes(s.status);

          return (
            <div key={s._id} className="border border-line rounded-xl p-4 bg-white/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {s.skill?.name} — {isTeacher ? `teaching ${other?.displayName}` : `learning from ${other?.displayName}`}
                  </p>
                  <p className="text-sm text-ink/60 mt-0.5">
                    {new Date(s.startTime).toLocaleString()} – {new Date(s.endTime).toLocaleTimeString()}
                  </p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-2 capitalize ${STATUS_STYLES[s.status] || ''}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>

                {canAct && (
                  <div className="flex flex-col gap-1.5 shrink-0 items-end">
                    <button
                      onClick={() => markComplete(s)}
                      disabled={busyId === s._id}
                      className="text-xs bg-teach text-paper px-3 py-1.5 rounded-full hover:bg-teach-dark transition-colors disabled:opacity-50"
                    >
                      Mark complete
                    </button>
                    <button
                      onClick={() => act(s._id, 'no-show', { reason: '' })}
                      disabled={busyId === s._id}
                      className="text-xs text-learn-dark hover:underline"
                    >
                      Report no-show
                    </button>
                    <button
                      onClick={() => act(s._id, 'cancel', { reason: '' })}
                      disabled={busyId === s._id}
                      className="text-xs text-ink/50 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {s.status === 'completed' && (
                  <button
                    onClick={() => setReviewSession(s)}
                    className="text-xs text-teach hover:underline shrink-0"
                  >
                    Leave a review
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showSchedule && (
        <ScheduleSessionModal onClose={() => setShowSchedule(false)} onScheduled={load} />
      )}

      {reviewSession && (
        <ReviewModal
          session={reviewSession}
          otherName={
            (reviewSession.teacher._id === profile?._id ? reviewSession.learner : reviewSession.teacher)?.displayName
          }
          onClose={() => setReviewSession(null)}
          onSubmitted={load}
        />
      )}
    </div>
  );
}
