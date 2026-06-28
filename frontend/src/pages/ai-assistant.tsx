import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { AiAssistantPage } from '@/components/ai/AiAssistantPage';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', ['common']))
  }
});

export default function page() {
  return <AiAssistantPage />;
}
