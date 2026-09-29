import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { findUserByContact, getUser, saveUser, uploadImageFile } from '../lib/api';
import { parseLkMobile } from '../lib/phone';
import { UserProfile, UserRole } from '../types';
import { ensureVendorProfile } from '../lib/vendors';

/**
 * Passwordless identity: name + Sri Lankan mobile + optional photo.
 * The normalised contact number is the key; uid is remembered in localStorage.
 */

const STORAGE_KEY = 'gembook_uid';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

export type AuthErrorCode = 'exists' | 'not_found' | 'invalid';

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface CreateAccountInput {
  displayName: string;
  contactNumber: string;
  photoFile?: File | null;
  role?: UserRole;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  /** True once a profile exists. Kept for call sites that gate write actions. */
  isVerified: boolean;
  createAccount: (input: CreateAccountInput) => Promise<UserProfile>;
  signIn: (contactNumber: string) => Promise<UserProfile>;
  updateProfile: (partial: Partial<UserProfile>, photoFile?: File | null) => Promise<UserProfile | null>;
  /** Returns the current profile (identity is created up-front at onboarding). */
  ensureProfile: () => Promise<UserProfile | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function requireMobile(raw: string): string {
  const contact = parseLkMobile(raw);
  if (!contact) {
    throw new AuthError('invalid', 'Please enter a valid Sri Lankan mobile number.');
  }
  return contact;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const createAccount = useCallback(
    async ({ displayName, contactNumber, photoFile, role = 'USER' }: CreateAccountInput): Promise<UserProfile> => {
      const name = displayName.trim();
      if (!name) throw new AuthError('invalid', 'Please enter your name.');
      const contact = requireMobile(contactNumber);

      let existing: UserProfile | null = null;
      try {
        existing = await findUserByContact(contact);
      } catch (err) {
        console.error('Contact lookup failed:', err);
        throw new Error('Could not check this number. Check your connection and try again.');
      }
      if (existing && existing.uid) {
        throw new AuthError('exists', 'This number is already registered. Sign in instead.');
      }

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
        role: role === 'VENDOR' ? 'VENDOR' : 'USER',
        followersCount: 0,
        followingCount: 0,
        following: [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      const saved = await saveUser(profile);
      if (saved.role === 'VENDOR') {
        await ensureVendorProfile(saved);
      }
      persist(saved);
      return saved;
    },
    [persist]
  );

  const signIn = useCallback(
    async (contactNumber: string): Promise<UserProfile> => {
      const contact = requireMobile(contactNumber);
      let existing: UserProfile | null = null;
      try {
        existing = await findUserByContact(contact);
      } catch (err) {
        console.error('Contact lookup failed:', err);
        throw new Error('Could not look up this number. Check your connection and try again.');
      }
      if (!existing || !existing.uid) {
        throw new AuthError('not_found', 'No account found for this number. Create one?');
      }
      persist(existing);
      return existing;
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
        createAccount,
        signIn,
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
