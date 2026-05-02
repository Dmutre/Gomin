import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { E2eeKeys, User } from '../types';

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  privateKey: CryptoKey | null; // RSA private key — in memory only, never persisted
  publicKeyB64: string | null;
  e2eeKeys: E2eeKeys | null; // encrypted bundle, safe to persist
  isAuthenticated: boolean;

  login: (
    user: User,
    sessionToken: string,
    privateKey: CryptoKey,
    publicKeyB64: string,
    e2eeKeys: E2eeKeys,
  ) => void;
  setPrivateKey: (privateKey: CryptoKey) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionToken: null,
      privateKey: null,
      publicKeyB64: null,
      e2eeKeys: null,
      isAuthenticated: false,

      login: (user, sessionToken, privateKey, publicKeyB64, e2eeKeys) =>
        set({
          user,
          sessionToken,
          privateKey,
          publicKeyB64,
          e2eeKeys,
          isAuthenticated: true,
        }),

      setPrivateKey: (privateKey) => set({ privateKey }),

      logout: () =>
        set({
          user: null,
          sessionToken: null,
          privateKey: null,
          publicKeyB64: null,
          e2eeKeys: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      // Only persist safe fields — privateKey is CryptoKey (not serialisable)
      partialize: (state) => ({
        user: state.user,
        sessionToken: state.sessionToken,
        publicKeyB64: state.publicKeyB64,
        e2eeKeys: state.e2eeKeys,
        // Re-derive isAuthenticated from token presence on rehydration
        isAuthenticated: !!state.sessionToken,
      }),
    },
  ),
);
