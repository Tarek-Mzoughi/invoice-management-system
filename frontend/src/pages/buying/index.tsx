import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/buying/commandes-fournisseurs',
    permanent: false
  }
});

export default function BuyingIndexPage() {
  return null;
}
