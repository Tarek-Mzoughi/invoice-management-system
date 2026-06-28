import React from 'react';
import { useRouter } from 'next/router';
import { ArticleUpdateForm } from '@/components/articles/ArticleUpdateForm';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', ['common', 'articles', 'contacts', 'country', 'currency', 'invoicing', 'logger', 'permissions', 'settings', 'social-title'])),
  },
});

export default function Page() {
  const router = useRouter();
  const articleId = router.query.id ? Number(router.query.id) : undefined;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ArticleUpdateForm articleId={articleId} className="mx-5 lg:mx-10" />
    </div>
  );
}
