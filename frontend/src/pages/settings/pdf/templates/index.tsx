import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { PdfSettings } from '@/components/settings/PdfSettings';
import { TemplateListPage } from '@/features/invoicing/templates';

const namespaces = [
  'common',
  'articles',
  'contacts',
  'country',
  'currency',
  'invoicing',
  'logger',
  'permissions',
  'settings',
  'social-title'
];

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', namespaces))
  }
});

export default function Page() {
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <PdfSettings defaultValue="templates" />
      <TemplateListPage />
    </div>
  );
}
