'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import clsx from 'clsx';

const LOGGED_IN_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/matches', label: 'Matches' },
  { href: '/requests', label: 'Requests' },
  { href: '/messages', label: 'Messages' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/ai-coach', label: 'AI Coach' },
];

export default function NavBar() {
  const { firebaseUser, profile, loading, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-tight">
          Skill<span className="text-teach">Swap</span>
        </Link>

        {firebaseUser && profile && (
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {LOGGED_IN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'hover:text-teach transition-colors',
                  pathname === link.href ? 'text-teach font-medium' : 'text-ink/70'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-4">
          {!loading && !firebaseUser && (
            <>
              <Link href="/auth/login" className="text-sm text-ink/70 hover:text-ink">
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm bg-ink text-paper px-4 py-2 rounded-full hover:bg-teach transition-colors"
              >
                Join SkillSwap
              </Link>
            </>
          )}

          {!loading && firebaseUser && profile && (
            <div className="flex items-center gap-3">
              <Link
                href="/credits"
                className="text-sm text-ink/70 hover:text-teach"
                title="Skill Credit balance"
              >
                {profile.credits?.balance ?? 0} credits
              </Link>
              <Link href="/notifications" className="text-sm text-ink/70 hover:text-teach" title="Notifications">
                🔔
              </Link>
              <Link href="/profile" className="text-sm font-medium hover:text-teach">
                {profile.displayName}
              </Link>
              <button
                onClick={signOut}
                className="text-sm text-ink/50 hover:text-learn transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
