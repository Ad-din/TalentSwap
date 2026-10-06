'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../../lib/firebase';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-3xl mb-8">Welcome back</h1>

      {error && (
        <p className="mb-4 text-sm text-learn-dark bg-learn-tint border border-learn/30 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <label className="block">
          <span className="text-sm text-ink/70 mb-1 block">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-4 py-2.5 bg-white focus:border-teach outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-ink/70 mb-1 block">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-4 py-2.5 bg-white focus:border-teach outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-paper py-3 rounded-full font-medium hover:bg-teach transition-colors disabled:opacity-50"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6 text-ink/40 text-sm">
        <div className="h-px bg-line flex-1" />
        or
        <div className="h-px bg-line flex-1" />
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={submitting}
        className="w-full border border-line py-3 rounded-full font-medium hover:border-ink transition-colors disabled:opacity-50"
      >
        Continue with Google
      </button>

      <p className="text-sm text-ink/60 mt-8 text-center">
        New to SkillSwap?{' '}
        <Link href="/auth/signup" className="text-teach hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function friendlyFirebaseError(err) {
  const code = err?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('popup-closed-by-user')) return 'Google sign-in was cancelled.';
  return 'Something went wrong. Please try again.';
}
