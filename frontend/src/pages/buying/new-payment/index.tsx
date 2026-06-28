import type { GetServerSideProps } from 'next';

const buildDestination = (firmId?: string | string[]) => {
  const normalizedFirmId = Array.isArray(firmId) ? firmId[0] : firmId;
  const firmQuery = normalizedFirmId ? `&firmId=${encodeURIComponent(normalizedFirmId)}` : '';
  return `/payments/new?type=buying${firmQuery}`;
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => ({
  redirect: {
    destination: buildDestination(query.firmId),
    permanent: false
  }
});

export default function BuyingNewPaymentRedirectPage() {
  return null;
}
