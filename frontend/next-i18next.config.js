const HttpBackend = require('i18next-http-backend');

const nextI18NextConfig = {
  backend: {
    backendOptions: [
      {
        loadPath: '/locales/{{lng}}/{{ns}}.json'
      }
    ],
    backends: typeof window !== 'undefined' ? [HttpBackend] : []
  },
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en']
  },
  defaultNS: 'common',
  ns: [
    'common',
    'articles',
    'contacts',
    'country',
    'currency',
    'dashboard',
    'invoicing',
    'logger',
    'permissions',
    'settings',
    'social-title'
  ],
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  serializeConfig: false,
  use: [],
  localeDetection: false
};

module.exports = nextI18NextConfig;
