import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  return {
    redirect: {
      destination: id ? `/payments/${encodeURIComponent(id)}/edit` : '/payments',
      permanent: false
    }
  };
};

export default function SellingPaymentEditRedirectPage() {
  return null;
}
