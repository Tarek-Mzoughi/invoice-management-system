import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/selling/quotations',
    permanent: false
  }
});

export default function SellingIndexPage() {
  return null;
}
