'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api';
import RequireAuth from '../../components/RequireAuth';
import MatchCard from '../../components/MatchCard';

export default function MatchesPage() {
  return (
    <RequireAuth>
      <MatchesContent />
    </RequireAuth>
  );
}

function MatchesContent() {
  const [matches, setMatches] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/matches')
      .then((data) => {
        setMatches(data.matches);
        setNote(data.note || '');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load matches.'));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl mb-2">Your matches</h1>
      <p className="text-ink/60 mb-8">
        Ranked by skill fit, availability, distance, experience, and reputation — every score is explained.
      </p>

      {error && <p className="text-learn-dark">{error}</p>}

      {!error && matches === null && <p className="text-ink/40 text-sm">Loading matches…</p>}

      {note && (
        <p className="text-sm text-ink/60 bg-white/60 border border-line rounded-xl px-4 py-3 mb-6">{note}</p>
      )}

      {matches && matches.length === 0 && !note && (
        <p className="text-ink/50">
          No matches yet. As more people join and list their skills, compatible matches will appear here.
        </p>
      )}

      <div className="space-y-4">
        {matches?.map((match) => (
          <MatchCard key={match.user._id} match={match} />
        ))}
      </div>
    </div>
  );
}
