import React from 'react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Page404 } from '@/components/shared';
import { FirmUpdateForm } from '@/components/contacts/firm/FirmUpdateForm';
import { CLIENT_FIRM_MODULE_CONFIG } from '@/components/contacts/shared/firm-navigation';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', [
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
    ]))
  }
});

export default function EditClientPage() {
  const router = useRouter();
  const id = Number(router.query.id);

  if (!id) return <Page404 />;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FirmUpdateForm
        className="mx-5 lg:mx-10"
        detailHref={CLIENT_FIRM_MODULE_CONFIG.detailPath}
        entityOverride="clients"
        firmId={id}
        listHref={CLIENT_FIRM_MODULE_CONFIG.listPath}
      />
    </div>
  );
}

