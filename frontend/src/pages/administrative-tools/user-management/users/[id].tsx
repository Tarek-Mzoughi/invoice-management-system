import React from 'react';
import { useRouter } from 'next/router';
import { UserEditorPage } from '@/components/administrative-tools/UserManagement/user/UserEditorPage';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { AccessDenied } from '@/features/rbac/AccessDenied';
import { useCurrentPermissions } from '@/features/rbac/usePermissions';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', ['common', 'articles', 'contacts', 'country', 'currency', 'invoicing', 'logger', 'permissions', 'settings', 'social-title'])),
  },
});

export default function Page() {
  const router = useRouter();
  const { isAdmin, isPending } = useCurrentPermissions();

  if (!isPending && !isAdmin) {
    return <AccessDenied />;
  }

  if (!router.isReady || typeof router.query.id !== 'string') {
    return null;
  }

  const userId = router.query.id;

  return <UserEditorPage key={userId} userId={userId} />;
}
