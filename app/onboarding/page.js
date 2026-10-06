'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '../../lib/api';
import RequireAuth from '../../components/RequireAuth';
import { useAuth } from '../../lib/AuthContext';

const STEPS = ['Skills you teach', 'Skills you want to learn', 'Weekly availability', 'Location'];
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingFlow />
    </RequireAuth>
  );
}

function OnboardingFlow() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [step, setStep] = useState(0);
  const [skills, setSkills] = useState([]);
  const [teachIds, setTeachIds] = useState([]);
  const [learnIds, setLearnIds] = useState([]);
  const [slots, setSlots] = useState([]);
  const [prefersOnlineOnly, setPrefersOnlineOnly] = useState(false);
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch('/api/skills')
      .then((data) => setSkills(data.skills))
      .catch(() => setError('Could not load the skill list.'));
  }, []);

  function toggle(list, setList, id) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function addSlot() {
    setSlots([...slots, { dayOfWeek: 'saturday', startTime: '18:00', endTime: '20:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }]);
  }

  function updateSlot(index, field, value) {
    setSlots(slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function removeSlot(index) {
    setSlots(slots.filter((_, i) => i !== index));
  }

  async function finish() {
    setSubmitting(true);
    setError('');
    try {
      for (const skillId of teachIds) {
        await apiFetch('/api/user-skills/me', { method: 'POST', body: { skillId, type: 'teach' } });
      }
      for (const skillId of learnIds) {
        await apiFetch('/api/user-skills/me', { method: 'POST', body: { skillId, type: 'learn' } });
      }
      await apiFetch('/api/users/me/availability', { method: 'PUT', body: { slots } });

      if (!prefersOnlineOnly && navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await apiFetch('/api/users/me/location', {
                method: 'PUT',
                body: { latitude: pos.coords.latitude, longitude: pos.coords.longitude, city, prefersOnlineOnly },
              }).catch(() => {});
              resolve();
            },
            async () => {
              await apiFetch('/api/users/me/location', { method: 'PUT', body: { city, prefersOnlineOnly } }).catch(() => {});
              resolve();
            }
          );
        });
      } else {
        await apiFetch('/api/users/me/location', { method: 'PUT', body: { city, prefersOnlineOnly } });
      }

      await apiFetch('/api/users/me', { method: 'PATCH', body: { onboardingComplete: true } });
      await refreshProfile();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong finishing setup.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? 'bg-teach' : 'bg-line'}`} />
          </div>
        ))}
      </div>

      <h1 className="font-display text-2xl mb-1">{STEPS[step]}</h1>
      <p className="text-ink/60 text-sm mb-8">Step {step + 1} of {STEPS.length}</p>

      {error && <p className="text-learn-dark mb-4">{error}</p>}

      {step === 0 && (
        <SkillPicker skills={skills} selected={teachIds} accent="teach" onToggle={(id) => toggle(teachIds, setTeachIds, id)} />
      )}
      {step === 1 && (
        <SkillPicker skills={skills} selected={learnIds} accent="learn" onToggle={(id) => toggle(learnIds, setLearnIds, id)} />
      )}

      {step === 2 && (
        <div className="space-y-4">
          {slots.map((slot, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap border border-line rounded-lg p-3">
              <select value={slot.dayOfWeek} onChange={(e) => updateSlot(i, 'dayOfWeek', e.target.value)} className="border border-line rounded px-2 py-1 capitalize">
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="time" value={slot.startTime} onChange={(e) => updateSlot(i, 'startTime', e.target.value)} className="border border-line rounded px-2 py-1" />
              <span className="text-ink/40">to</span>
              <input type="time" value={slot.endTime} onChange={(e) => updateSlot(i, 'endTime', e.target.value)} className="border border-line rounded px-2 py-1" />
              <button onClick={() => removeSlot(i)} className="text-learn-dark text-sm ml-auto">Remove</button>
            </div>
          ))}
          <button onClick={addSlot} className="text-teach hover:underline text-sm">+ Add a time slot</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={prefersOnlineOnly} onChange={(e) => setPrefersOnlineOnly(e.target.checked)} />
            <span>I only want online sessions</span>
          </label>
          <label className="block">
            <span className="text-sm text-ink/70 mb-1 block">City</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-line rounded-lg px-4 py-2.5 bg-white focus:border-teach outline-none" />
          </label>
          {!prefersOnlineOnly && (
            <p className="text-xs text-ink/50">
              We'll ask your browser for an approximate location to help match you with nearby people — we never store your exact address.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between mt-10">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-ink/60 disabled:opacity-0"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} className="bg-ink text-paper px-6 py-2.5 rounded-full hover:bg-teach transition-colors">
            Continue
          </button>
        ) : (
          <button onClick={finish} disabled={submitting} className="bg-teach text-paper px-6 py-2.5 rounded-full hover:bg-teach-dark transition-colors disabled:opacity-50">
            {submitting ? 'Finishing…' : 'Finish setup'}
          </button>
        )}
      </div>
    </div>
  );
}

function SkillPicker({ skills, selected, accent, onToggle }) {
  const activeClass = accent === 'teach' ? 'bg-teach text-paper border-teach' : 'bg-learn text-paper border-learn';
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => {
        const isActive = selected.includes(skill._id);
        return (
          <button
            key={skill._id}
            onClick={() => onToggle(skill._id)}
            className={`text-sm border rounded-full px-3.5 py-1.5 transition-colors ${
              isActive ? activeClass : 'border-line hover:border-ink'
            }`}
          >
            {skill.name}
          </button>
        );
      })}
    </div>
  );
}
