import type { GetServerSideProps } from 'next';
import {
  getClientNewPath,
  getSupplierNewPath
} from '@/components/contacts/shared/firm-navigation';

export const getServerSideProps: GetServerSideProps = async ({ query }) => ({
  redirect: {
    destination: query.entity === 'suppliers' ? getSupplierNewPath() : getClientNewPath(),
    permanent: false
  }
});

export default function LegacyNewFirmPage() {
  return null;
}
