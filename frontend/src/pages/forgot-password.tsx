import { AuthenticationLayout } from '@/components/auth/AuthenticationLayout';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', ['common']))
  }
});

export default function ForgotPasswordPage() {
  return <AuthenticationLayout initialScreen="forgot-password" />;
}
