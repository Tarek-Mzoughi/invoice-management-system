import RolePortal from '@/components/administrative-tools/UserManagement/role/RolePortal';
import React from 'react';
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
  const { isAdmin, isPending } = useCurrentPermissions();
  if (!isPending && !isAdmin) {
    return <AccessDenied />;
  }

  return <RolePortal />;
}
