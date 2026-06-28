import { Activity } from '@/types';
import { create } from 'zustand';

type ActivityManager = {
  // data
  id?: number;
  label?: string;
  // methods
  set: (name: keyof ActivityManager, value: any) => void;
  reset: () => void;
  getActivity: () => Partial<Activity>;
  setActivity: (activity: Partial<Activity>) => void;
};

const initialState: Omit<ActivityManager, 'set' | 'reset' | 'getActivity' | 'setActivity'> = {
  id: 0,
  label: ''
};

export const useActivityManager = create<ActivityManager>((set, get) => ({
  ...initialState,
  set: (name: keyof ActivityManager, value: any) =>
    set((state) => ({
      ...state,
      [name]: value
    })),
  reset: () => set({ ...initialState }),
  getActivity: () => {
    const data = get();
    return {
      id: data.id,
      label: data.label
    };
  },
  setActivity: (activity: Partial<Activity>) => {
    set((state) => ({
      ...state,
      ...activity
    }));
  }
}));
