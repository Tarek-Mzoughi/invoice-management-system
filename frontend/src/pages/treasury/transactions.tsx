import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { TransactionList } from '@/components/treasury/TransactionList';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', [
      'common',
      'settings'
    ]))
  }
});

export default function TransactionsPage() {
  return <TransactionList />;
}
