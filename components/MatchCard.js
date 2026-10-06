'use client';

import { useState } from 'react';
import SwapRequestModal from './SwapRequestModal';

const CATEGORY_LABELS = {
  skill: 'Skill Compatibility',
  availability: 'Availability',
  location: 'Location',
  experience: 'Experience',
  reputation: 'Reputation',
};

export default function MatchCard({ match }) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sent, setSent] = useState(false);
  const { user, totalScore, highlights, breakdown } = match;

  return (
    <div className="border border-line rounded-2xl bg-white/60 overflow-hidden">
      <div className="p-6 flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-teach-tint text-teach-dark font-display text-lg flex items-center justify-center shrink-0">
            {user.displayName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-lg">{user.displayName}</p>
            <ul className="mt-2 space-y-1">
              {highlights.map((h) => (
                <li key={h} className="text-sm text-ink/60 flex items-center gap-2">
                  <span className="text-teach">✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-right shrink-0 flex flex-col items-end gap-3">
          <div>
            <p className="font-display text-3xl text-teach-dark">{totalScore}%</p>
            <p className="text-xs text-ink/50">Compatible</p>
          </div>
          {sent ? (
            <span className="text-xs text-teach-dark bg-teach-tint px-3 py-1.5 rounded-full">Request sent</span>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="text-sm bg-learn text-paper px-4 py-1.5 rounded-full hover:bg-learn-dark transition-colors whitespace-nowrap"
            >
              Request swap
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <SwapRequestModal
          recipient={user}
          onClose={() => setShowModal(false)}
          onSent={() => setSent(true)}
        />
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full border-t border-line px-6 py-3 text-sm text-ink/60 hover:text-teach hover:bg-teach-tint/40 transition-colors flex items-center justify-between"
      >
        <span>{expanded ? 'Hide' : 'See'} full compatibility breakdown</span>
        <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {expanded && (
        <div className="border-t border-line px-6 py-5 bg-paper/60">
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(breakdown).map(([key, val]) => (
                <tr key={key} className="border-b border-line/60 last:border-0">
                  <td className="py-2 text-ink/70">{CATEGORY_LABELS[key] || key}</td>
                  <td className="py-2 text-right font-medium tabular-nums">
                    {val.weighted}/{val.max}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-medium">Total</td>
                <td className="py-2 text-right font-display text-lg text-teach-dark tabular-nums">
                  {totalScore}/100
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
