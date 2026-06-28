import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', [
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
    ]))
  }
});

export default function page() {
  return <DashboardPage />;
}
