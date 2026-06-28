import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { PdfSettings } from '@/components/settings/PdfSettings';
import { TemplatePreviewPage } from '@/features/invoicing/templates';

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

export const getServerSideProps: GetServerSideProps = async ({ locale, params }) => ({
  props: {
    id: Number(params?.id),
    ...(await serverSideTranslations(locale ?? 'fr', namespaces))
  }
});

export default function Page({ id }: { id: number }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PdfSettings defaultValue="templates" />
      <TemplatePreviewPage id={id} />
    </div>
  );
}
