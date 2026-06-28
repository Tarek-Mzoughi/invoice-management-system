import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthPersistData {
  _ready: boolean;
  accessToken: string;
  refreshToken: string;
  isAuthenticated: boolean;
}

interface AuthPersistStore extends AuthPersistData {
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setAuthenticated: (isAuth: boolean) => void;
  logout: () => void;
}

const initialState: AuthPersistData = {
  _ready: false,
  accessToken: '',
  refreshToken: '',
  isAuthenticated: false
};

const isClient = typeof window !== 'undefined';

const fallbackStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

export const useAuthPersistStore = create<AuthPersistStore>()(
  persist(
    (set) => ({
      ...initialState,

      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),

      logout: () => set({ ...initialState, _ready: true })
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => (isClient ? localStorage : fallbackStorage)),

      onRehydrateStorage: () => (state) => {
        if (state) {
          state._ready = true;
        }
      }
    }
  )
);
