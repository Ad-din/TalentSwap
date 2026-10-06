'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '../../components/RequireAuth';
import { useAuth } from '../../lib/AuthContext';
import { apiFetch, ApiError } from '../../lib/api';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { profile, refreshProfile } = useAuth();
  const [bio, setBio] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [mySkills, setMySkills] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setExperienceLevel(profile.experienceLevel || 'beginner');
    }
  }, [profile]);

  useEffect(() => {
    apiFetch('/api/user-skills/me')
      .then(setMySkills)
      .catch(() => setMySkills({ teach: [], learn: [] }));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch('/api/users/me', { method: 'PATCH', body: { bio, experienceLevel } });
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      // ApiError already logged via apiFetch's thrown error message on screen elsewhere if needed
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Your profile</h1>

      <div className="space-y-6">
        <label className="block">
          <span className="text-sm text-ink/70 mb-1 block">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full border border-line rounded-lg px-4 py-2.5 bg-white focus:border-teach outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm text-ink/70 mb-1 block">Overall experience level</span>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="border border-line rounded-lg px-4 py-2.5 bg-white focus:border-teach outline-none capitalize"
          >
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="bg-ink text-paper px-6 py-2.5 rounded-full hover:bg-teach transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-teach-dark">Saved</span>}
        </div>
      </div>

      <hr className="border-line my-10" />

      <div className="grid md:grid-cols-2 gap-8">
        <SkillList title="You teach" accent="teach" items={mySkills?.teach} />
        <SkillList title="You want to learn" accent="learn" items={mySkills?.learn} />
      </div>
    </div>
  );
}

function SkillList({ title, accent, items }) {
  const tint = accent === 'teach' ? 'bg-teach-tint text-teach-dark' : 'bg-learn-tint text-learn-dark';
  return (
    <div>
      <h2 className="font-medium mb-3">{title}</h2>
      {items === undefined && <p className="text-ink/40 text-sm">Loading…</p>}
      {items?.length === 0 && <p className="text-ink/40 text-sm">Nothing added yet.</p>}
      <div className="flex flex-wrap gap-2">
        {items?.map((entry) => (
          <span key={entry._id} className={`text-sm px-3 py-1 rounded-full ${tint}`}>
            {entry.skill?.name}
          </span>
        ))}
      </div>
    </div>
  );
}
