import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface ComingSoonProps {
  className?: string;
}

export const ComingSoon = ({ className }: ComingSoonProps) => {
  const { t } = useTranslation('common');
  return (
    <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
      <div className="mx-auto max-w-screen-sm text-center">
        <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-8xl text-primary-600 dark:text-primary-500">
          {t('coming_soon.coming_soon')}
        </h1>
        <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
          {t('coming_soon.note1')}
        </p>
        <p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
          {t('coming_soon.note2')}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex bg-primary-600 hover:bg-primary-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4">
          {t('coming_soon.go_back')}
        </Link>
      </div>
    </div>
  );
};
