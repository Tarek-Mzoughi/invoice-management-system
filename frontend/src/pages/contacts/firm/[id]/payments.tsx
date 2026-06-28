import React from 'react';
import { useRouter } from 'next/router';
import { FirmDetails } from '@/components/contacts/firm/FirmDetails';
import { PaymentEmbeddedPortal } from '@/components/payment/PaymentEmbeddedPortal';
import { useTranslation } from 'react-i18next';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', ['common', 'articles', 'contacts', 'country', 'currency', 'invoicing', 'logger', 'permissions', 'settings', 'social-title'])),
  },
});

export default function Page() {
  const router = useRouter();
  const id = router.query.id as string;

  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tContact, ready: contactReady } = useTranslation('contacts');

  const routes = [
    { title: tCommon('menu.contacts'), href: '/contacts' },
    { title: tContact('firm.plural'), href: '/contacts/firms' },
    {
      title: `${tContact('firm.singular')} N°${id}`,
      href: '/contacts/firm?id=' + id
    }
  ];

  return (
    <FirmDetails firmId={id}>
      <PaymentEmbeddedPortal firmId={parseInt(id)} routes={routes} />
    </FirmDetails>
  );
}
