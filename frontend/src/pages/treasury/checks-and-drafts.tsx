import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ChecksAndDraftsPage } from '@/components/treasury/checks-and-drafts/ChecksAndDraftsPage';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', ['common', 'settings', 'invoicing']))
  }
});

export default function TreasuryChecksAndDraftsRoute() {
  return <ChecksAndDraftsPage />;
}
