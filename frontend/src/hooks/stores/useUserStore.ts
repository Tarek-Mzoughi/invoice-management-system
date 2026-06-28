import { create } from 'zustand';

import { Gender, ResponseUserDto, UserProfile } from '@/types';

interface UserStoreData {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  roleId?: string;
  currentPassword?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  cin?: string;
  bio?: string;
  gender?: Gender;
  isPrivate?: boolean;
  picture?: File;
  pictureId?: number;
}

export interface UserStore extends UserStoreData {
  set: <K extends keyof UserStoreData>(key: K, value: UserStoreData[K]) => void;
  reset: () => void;
  getUser: () => UserStoreData & { profile: Partial<UserProfile> };
  setUser: (data: Partial<ResponseUserDto>) => void;
}

const initialState: UserStoreData = {
  id: undefined,
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  dateOfBirth: undefined,
  roleId: undefined,
  currentPassword: '',
  password: '',
  confirmPassword: '',
  phone: '',
  cin: '',
  bio: '',
  gender: undefined,
  isPrivate: false,
  picture: undefined,
  pictureId: undefined
};

export const useUserStore = create<UserStore>((set, get) => ({
  ...initialState,

  set: (key, value) => set({ [key]: value }),

  reset: () => set(initialState),

  getUser: () => {
    const data = get();

    return {
      id: data.id,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      roleId: data.roleId,
      currentPassword: data.currentPassword,
      password: data.password,
      confirmPassword: data.confirmPassword,
      phone: data.phone,
      cin: data.cin,
      bio: data.bio,
      gender: data.gender,
      isPrivate: data.isPrivate,
      picture: data.picture,
      pictureId: data.pictureId,
      profile: {
        phone: data.phone,
        cin: data.cin,
        bio: data.bio,
        gender: data.gender,
        isPrivate: data.isPrivate,
        pictureId: data.pictureId
      }
    };
  },

  setUser: (data) =>
    set({
      id: data.id,
      username: data.username ?? '',
      email: data.email ?? '',
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      roleId: data.roleId,
      currentPassword: '',
      password: '',
      confirmPassword: '',
      phone: data.profile?.phone ?? '',
      cin: data.profile?.cin ?? '',
      bio: data.profile?.bio ?? '',
      gender: data.profile?.gender,
      isPrivate: data.profile?.isPrivate ?? false,
      picture: undefined,
      pictureId: data.profile?.pictureId
    })
}));
