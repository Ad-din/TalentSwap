'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../../../lib/firebase';
import { apiFetch, ApiError } from '../../../lib/api';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function registerBackendProfile(name) {
    await apiFetch('/api/auth/register', { method: 'POST', body: { displayName: name } });
  }

  async function handleEmailSignup(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await registerBackendProfile(displayName);
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : friendlyFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignup() {
    setError('');
    setSubmitting(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await registerBackendProfile(cred.user.displayName || '');
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : friendlyFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-3xl mb-2">Join SkillSwap</h1>
      <p className="text-ink/60 mb-8">Start with 50 free Skill Credits.</p>

      {error && (
        <p className="mb-4 text-sm text-learn-dark bg-learn-tint border border-learn/30 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <form onSubmit={handleEmailSignup} className="space-y-4">
        <Field label="Name" value={displayName} onChange={setDisplayName} required />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-paper py-3 rounded-full font-medium hover:bg-teach transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6 text-ink/40 text-sm">
        <div className="h-px bg-line flex-1" />
        or
        <div className="h-px bg-line flex-1" />
      </div>

      <button
        onClick={handleGoogleSignup}
        disabled={submitting}
        className="w-full border border-line py-3 rounded-full font-medium hover:border-ink transition-colors disabled:opacity-50"
      >
        Continue with Google
      </button>

      <p className="text-sm text-ink/60 mt-8 text-center">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-teach hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, required, minLength }) {
  return (
    <label className="block">
      <span className="text-sm text-ink/70 mb-1 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="w-full border border-line rounded-lg px-4 py-2.5 bg-white focus:border-teach outline-none"
      />
    </label>
  );
}

function friendlyFirebaseError(err) {
  const code = err?.code || '';
  if (code.includes('email-already-in-use')) return 'An account already exists with that email.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('invalid-email')) return 'That email address looks invalid.';
  if (code.includes('popup-closed-by-user')) return 'Google sign-in was cancelled.';
  return 'Something went wrong. Please try again.';
}
