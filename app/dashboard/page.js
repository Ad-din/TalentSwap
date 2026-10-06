'use client';

import Link from 'next/link';
import RequireAuth from '../../components/RequireAuth';
import { useAuth } from '../../lib/AuthContext';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { profile, loading, refreshProfile, signOut } = useAuth();

  // firebaseUser exists (RequireAuth already confirmed that) but no backend
  // profile was found - most commonly because registration failed partway
  // through on the server. Surface this instead of rendering nothing, so
  // it's obvious something needs fixing rather than looking like a blank bug.
  if (!loading && !profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl mb-3">Couldn't load your profile</h1>
        <p className="text-ink/60 mb-8">
          You're signed in, but we couldn't find a SkillSwap profile for this account. This
          usually means something went wrong during registration.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={refreshProfile}
            className="bg-teach text-paper px-6 py-3 rounded-full font-medium hover:bg-teach-dark transition-colors"
          >
            Try again
          </button>
          <button onClick={signOut} className="text-ink/60 hover:text-learn-dark">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  if (!profile.onboardingComplete) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl mb-3">Almost there</h1>
        <p className="text-ink/60 mb-8">
          Finish setting up your skills and availability so we can start finding you matches.
        </p>
        <Link href="/onboarding" className="bg-teach text-paper px-6 py-3 rounded-full font-medium hover:bg-teach-dark transition-colors">
          Finish setup
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl mb-1">Welcome back, {profile.displayName}</h1>
      <p className="text-ink/60 mb-10">Here's where things stand.</p>

      <div className="grid md:grid-cols-3 gap-4">
        <SummaryCard
          label="Skill Credits"
          value={profile.credits?.balance ?? 0}
          href="/credits"
          accent="teach"
        />
        <SummaryCard
          label="Average rating"
          value={profile.reputation?.totalReviews ? `${profile.reputation.averageRating.toFixed(1)} / 5` : '—'}
          href="/profile"
          accent="learn"
        />
        <SummaryCard label="Find matches" value="Browse now" href="/matches" accent="teach" isAction />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, href, accent, isAction }) {
  const border = accent === 'teach' ? 'hover:border-teach' : 'hover:border-learn';
  return (
    <Link href={href} className={`border border-line rounded-2xl p-6 bg-white/60 transition-colors ${border}`}>
      <p className="text-sm text-ink/50 mb-2">{label}</p>
      <p className={`font-display text-2xl ${isAction ? 'text-ink' : ''}`}>{value}</p>
    </Link>
  );
}
