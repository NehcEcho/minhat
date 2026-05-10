import { create } from 'zustand';

interface AuthState {
  token: string | null;
  username: string | null;
  userInfo: Record<string, unknown> | null;
  setToken: (token: string) => void;
  setUsername: (username: string) => void;
  setUserInfo: (info: Record<string, unknown>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  userInfo: null,
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  setUsername: (username) => {
    localStorage.setItem('username', username);
    set({ username });
  },
  setUserInfo: (info) => set({ userInfo: info }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    set({ token: null, username: null, userInfo: null });
  },
}));
