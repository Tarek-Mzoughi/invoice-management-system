import type { GetServerSideProps } from 'next';
import {
  getClientListPath,
  getSupplierListPath
} from '@/components/contacts/shared/firm-navigation';

export const getServerSideProps: GetServerSideProps = async ({ query }) => ({
  redirect: {
    destination: query.entity === 'suppliers' ? getSupplierListPath() : getClientListPath(),
    permanent: false
  }
});

export default function LegacyFirmsPage() {
  return null;
}
