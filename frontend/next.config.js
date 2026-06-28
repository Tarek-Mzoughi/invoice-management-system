/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config.js');
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  i18n,
  async redirects() {
    return [
      {
        source: '/settings/pdf/live',
        destination: '/settings/pdf/templates',
        permanent: false
      },
      {
        source: '/buying/customer-orders',
        destination: '/buying/commandes-fournisseurs',
        permanent: false
      },
      {
        source: '/buying/new-customer-order',
        destination: '/buying/nouvelle-commande-fournisseur',
        permanent: false
      },
      {
        source: '/buying/customer-order/:id',
        destination: '/buying/commande-fournisseur/:id',
        permanent: false
      },
      {
        source: '/buying/delivery-notes',
        destination: '/buying/bons-reception',
        permanent: false
      },
      {
        source: '/buying/new-delivery-note',
        destination: '/buying/nouveau-bon-reception',
        permanent: false
      },
      {
        source: '/buying/delivery-note/:id',
        destination: '/buying/bon-reception/:id',
        permanent: false
      },
      {
        source: '/buying/invoices',
        destination: '/buying/factures-achat',
        permanent: false
      },
      {
        source: '/buying/new-invoice',
        destination: '/buying/nouvelle-facture-achat',
        permanent: false
      },
      {
        source: '/buying/invoice/:id',
        destination: '/buying/facture-achat/:id',
        permanent: false
      },
      {
        source: '/buying/credit-notes',
        destination: '/buying/avoirs-fournisseurs',
        permanent: false
      },
      {
        source: '/buying/new-credit-note',
        destination: '/buying/nouvel-avoir-fournisseur',
        permanent: false
      },
      {
        source: '/buying/credit-note/:id',
        destination: '/buying/avoir-fournisseur/:id',
        permanent: false
      },
      {
        source: '/buying/return-notes',
        destination: '/buying/retours-fournisseurs',
        permanent: false
      },
      {
        source: '/buying/new-return-note',
        destination: '/buying/nouveau-retour-fournisseur',
        permanent: false
      },
      {
        source: '/buying/return-note/:id',
        destination: '/buying/retour-fournisseur/:id',
        permanent: false
      }
    ];
  }
};

module.exports = nextConfig;
