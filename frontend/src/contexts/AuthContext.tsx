import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { findUserByContact, getUser, saveUser, uploadImageFile } from '../lib/api';
import { UserProfile } from '../types';

/**
 * Auth-less identity.
 *
 * Firebase Authentication (Google popup, phone OTP, reCAPTCHA) has been removed
 * entirely. A user is simply a Name + Contact Number + profile photo stored in
 * the Firestore `users` collection. The contact number is the identity key, and
 * the active uid is remembered in localStorage so the session survives reloads.
 * There is no password — re-entering the same contact number restores the
 * existing profile.
 */

const STORAGE_KEY = 'gembook_uid';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

export interface SignUpInput {
  displayName: string;
  contactNumber: string;
  photoFile?: File | null;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  /** True once a profile exists. Kept for call sites that gate write actions. */
  isVerified: boolean;
  /** Create or restore an identity from Name + Contact Number (+ optional photo). */
  signUp: (input: SignUpInput) => Promise<UserProfile>;
  updateProfile: (partial: Partial<UserProfile>, photoFile?: File | null) => Promise<UserProfile | null>;
  /** Returns the current profile (identity is created up-front at onboarding). */
  ensureProfile: () => Promise<UserProfile | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normaliseContact(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the remembered identity on load.
  useEffect(() => {
    let active = true;
    (async () => {
      const uid = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getUser(uid);
        if (active && profile && profile.uid) {
          setUserProfile(profile);
        } else if (active) {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.error('Could not restore session:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const persist = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    window.localStorage.setItem(STORAGE_KEY, profile.uid);
  }, []);

  const signUp = useCallback(
    async ({ displayName, contactNumber, photoFile }: SignUpInput): Promise<UserProfile> => {
      const name = displayName.trim();
      const contact = normaliseContact(contactNumber);
      if (!name) throw new Error('Please enter your name.');
      if (contact.length < 7) throw new Error('Please enter a valid contact number.');

      // Returning user: a matching contact number restores the existing profile.
      try {
        const existing = await findUserByContact(contact);
        if (existing && existing.uid) {
          const patch: Partial<UserProfile> = { uid: existing.uid };
          if (name && name !== existing.displayName) patch.displayName = name;
          if (photoFile) {
            patch.photoURL = await uploadImageFile(`avatars/${existing.uid}`, photoFile);
          }
          const saved = Object.keys(patch).length > 1 ? await saveUser(patch) : existing;
          persist(saved);
          return saved;
        }
      } catch (err) {
        console.error('Contact lookup failed, creating a new profile:', err);
      }

      // New user.
      const uid = crypto.randomUUID();
      let photoURL = DEFAULT_AVATAR;
      if (photoFile) {
        photoURL = await uploadImageFile(`avatars/${uid}`, photoFile);
      }

      const profile: UserProfile = {
        uid,
        displayName: name,
        contactNumber: contact,
        phone: contact,
        photoURL,
        role: 'USER',
        followersCount: 0,
        followingCount: 0,
        following: [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      const saved = await saveUser(profile);
      persist(saved);
      return saved;
    },
    [persist]
  );

  const updateProfile = useCallback(
    async (partial: Partial<UserProfile>, photoFile?: File | null): Promise<UserProfile | null> => {
      if (!userProfile) return null;
      const patch: Partial<UserProfile> = { ...partial, uid: userProfile.uid };
      if (photoFile) {
        patch.photoURL = await uploadImageFile(`avatars/${userProfile.uid}`, photoFile);
      }
      const saved = await saveUser(patch);
      const next = { ...userProfile, ...saved };
      persist(next);
      return next;
    },
    [userProfile, persist]
  );

  const ensureProfile = useCallback(async () => userProfile, [userProfile]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUserProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        loading,
        isVerified: !!userProfile,
        signUp,
        updateProfile,
        ensureProfile,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
