'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';
import { apiFetch } from './api';
import { disconnectSocket } from './socket';

const AuthContext = createContext({
  firebaseUser: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      const { user } = await apiFetch('/api/auth/me');
      setProfile(user);
    } catch (err) {
      // No SkillSwap profile yet (e.g. mid-registration) - not a fatal error.
      setProfile(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signOut() {
    disconnectSocket();
    await firebaseSignOut(auth);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, loading, refreshProfile: loadProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
