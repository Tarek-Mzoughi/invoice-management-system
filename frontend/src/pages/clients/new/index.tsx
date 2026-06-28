import React from 'react';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { FirmCreateForm } from '@/components/contacts/firm/FirmCreateForm';
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

export default function NewClientPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FirmCreateForm
        className="mx-5 lg:mx-10"
        entityOverride="clients"
        listHref={CLIENT_FIRM_MODULE_CONFIG.listPath}
      />
    </div>
  );
}

