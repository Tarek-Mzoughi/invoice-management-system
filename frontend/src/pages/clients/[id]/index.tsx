import React from 'react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Page404 } from '@/components/shared';
import { FirmProfilePage } from '@/components/contacts/shared/FirmProfilePage';
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

export default function ClientDetailsPage() {
  const router = useRouter();
  const id = Number(router.query.id);

  if (!id) return <Page404 />;

  return (
    <FirmProfilePage
      className="mx-5 lg:mx-10"
      config={CLIENT_FIRM_MODULE_CONFIG}
      firmId={id}
    />
  );
}

