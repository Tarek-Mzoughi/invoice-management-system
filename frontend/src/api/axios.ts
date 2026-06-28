import _axios from 'axios';
import { useAuthPersistStore } from '@/hooks/stores/useAuthPersistStore';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

declare module 'axios' {
  export interface AxiosRequestConfig {
    silentForbiddenToast?: boolean;
    skipCabinetHeader?: boolean;
  }
}

const BASE_URL =
  typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_BASE_URL : process.env.BASE_URL;

const axios = _axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-custom-lang': 'en'
  }
});

let signOutPromise: Promise<unknown> | null = null;

const performSignOut = () => {
  const authStore = useAuthPersistStore.getState();
  authStore.logout?.();

  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  localStorage.removeItem('active-cabinet-id');

  if (!signOutPromise) {
    signOutPromise = signOut({ callbackUrl: '/auth' }).finally(() => {
      signOutPromise = null;
    });
  }

  return signOutPromise;
};

// Request interceptor
axios.interceptors.request.use(
  function (config) {
    const authStore = useAuthPersistStore.getState();
    if (typeof window !== 'undefined') {
      const locale = window.localStorage.getItem('locale') || 'en';
      config.headers['x-custom-lang'] = locale;

      const activeCabinetId = window.localStorage.getItem('active-cabinet-id');
      if (activeCabinetId && !config.skipCabinetHeader) {
        config.headers['x-cabinet-id'] = activeCabinetId;
      }

      if (authStore.accessToken) {
        config.headers['Authorization'] = `Bearer ${authStore.accessToken}`;
      }
    }

    return config;
  },
  function (err) {
    return Promise.reject(err);
  }
);

axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthPersistStore.getState();

    if (error.response?.status === 403) {
      const message =
        error.response.data?.message || "Vous n'avez pas l'autorisation d'effectuer cette action.";
      if (typeof window !== 'undefined' && !originalRequest?.silentForbiddenToast) {
        toast.error(Array.isArray(message) ? message[0] : message, {
          id: 'rbac-forbidden'
        });
      }
      return Promise.reject(error);
    }

    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      await performSignOut();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (authStore.refreshToken) {
      originalRequest._retry = true;

      try {
        const response = await _axios.post(`${BASE_URL}/auth/refresh-token`, {
          refresh_token: authStore.refreshToken
        });

        const newAccessToken = response.data.access_token;
        useAuthPersistStore.getState().setAccessToken(newAccessToken);
        useAuthPersistStore.getState().setAuthenticated(true);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        return axios(originalRequest);
      } catch (err) {
        await performSignOut();
        return Promise.reject(err);
      }
    }

    await performSignOut();
    return Promise.reject(error);
  }
);

export default axios;
