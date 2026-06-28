import axios, { AxiosError } from 'axios';
import i18next from 'i18next';

export function getErrorMessage(
  namespace: string,
  error: Error | AxiosError,
  defaultValue?: string
) {
  if (!i18next.isInitialized) {
    i18next.init({
      lng: 'en',
      fallbackLng: 'en',
      ns: [namespace],
      defaultNS: namespace
    });
  }

  const translate = (key: string) => i18next.t(key, { ns: namespace });

  if (axios.isAxiosError(error)) {
    const errorMessage = Array.isArray(error.response?.data?.message)
      ? error.response?.data?.message[0]
      : error.response?.data?.message;

    return translate(errorMessage || defaultValue || '');
  }

  if (error instanceof Error) {
    return translate(error.message) || defaultValue || 'Unexpected Error';
  }

  return defaultValue || 'Unexpected Error';
}
