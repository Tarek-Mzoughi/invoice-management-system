import type { GetServerSideProps } from 'next';
import {
  getClientEditPath,
  getSupplierEditPath
} from '@/components/contacts/shared/firm-navigation';

export const getServerSideProps: GetServerSideProps = async ({ params, query }) => {
  const id = params?.id;

  return {
    redirect: {
      destination: query.entity === 'suppliers' ? getSupplierEditPath(String(id)) : getClientEditPath(String(id)),
      permanent: false
    }
  };
};

export default function LegacyModifyFirmPage() {
  return null;
}
