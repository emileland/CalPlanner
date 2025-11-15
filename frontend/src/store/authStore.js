import { create } from 'zustand';

const STORAGE_KEY = 'calplanner_session';

const readSession = () => {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { token: null, user: null };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Unable to read auth session', error);
    return { token: null, user: null };
  }
};

const writeSession = (session) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!session?.token && !session?.user) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const useAuthStore = create((set) => ({
  ...readSession(),
  setSession: ({ token, user }) => {
    writeSession({ token, user });
    set({ token, user });
  },
  updateUser: (userPatch) =>
    set((state) => {
      const user = state.user ? { ...state.user, ...userPatch } : userPatch;
      writeSession({ token: state.token, user });
      return { ...state, user };
    }),
  logout: () => {
    writeSession({ token: null, user: null });
    set({ token: null, user: null });
  },
}));
