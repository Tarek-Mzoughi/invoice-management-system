import React from 'react';
import { ArticleCreateForm } from '@/components/articles/ArticleCreateForm';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', ['common', 'articles', 'contacts', 'country', 'currency', 'invoicing', 'logger', 'permissions', 'settings', 'social-title'])),
  },
});

export default function Page() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ArticleCreateForm className="mx-5 lg:mx-10" />
    </div>
  );
}
