import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AppModuleKey =
  | 'selling'
  | 'buying'
  | 'payments'
  | 'treasury'
  | 'suppliers'
  | 'clients'
  | 'articles'
  | 'withholding'
  | 'ai_assistant'
  | 'ai_floating_button';

export type ModuleSettings = Record<AppModuleKey, boolean>;

interface ModuleSettingsStore {
  _ready: boolean;
  modules: ModuleSettings;
  setModule: (key: AppModuleKey, enabled: boolean) => void;
  setModules: (modules: ModuleSettings) => void;
  reset: () => void;
}

export const defaultModuleSettings: ModuleSettings = {
  selling: true,
  buying: true,
  payments: true,
  treasury: true,
  suppliers: true,
  clients: true,
  articles: true,
  withholding: true,
  ai_assistant: true,
  ai_floating_button: true
};

const isClient = typeof window !== 'undefined';

const fallbackStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

export const useModuleSettingsStore = create<ModuleSettingsStore>()(
  persist(
    (set) => ({
      _ready: false,
      modules: defaultModuleSettings,

      setModule: (key, enabled) =>
        set((state) => ({
          modules: {
            ...state.modules,
            [key]: enabled
          }
        })),

      setModules: (modules) => set({ modules }),

      reset: () =>
        set({
          _ready: true,
          modules: defaultModuleSettings
        })
    }),
    {
      name: 'module-settings-storage',
      storage: createJSONStorage(() => (isClient ? localStorage : fallbackStorage)),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._ready = true;
        }
      }
    }
  )
);
