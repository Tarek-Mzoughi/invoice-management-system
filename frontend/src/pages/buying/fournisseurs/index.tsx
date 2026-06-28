import type { GetServerSideProps } from 'next';
import { getSupplierListPath } from '@/components/contacts/shared/firm-navigation';

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: getSupplierListPath(),
    permanent: false
  }
});

export default function LegacyBuyingSuppliersPage() {
  return null;
}
