import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const invoicingPageNamespaces = [
  'common',
  'articles',
  'contacts',
  'country',
  'currency',
  'invoicing',
  'logger',
  'permissions',
  'settings',
  'social-title'
] as const;

export const getInvoicingPageServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', [...invoicingPageNamespaces]))
  }
});
