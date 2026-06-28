import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'react-i18next';
import { WithholdingTaxCertificatesPortal } from '@/components/withholding-tax/WithholdingTaxCertificatesPortal';
import { ACTIVITY_TYPE } from '@/types';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', [
      'common',
      'contacts',
      'currency',
      'invoicing',
      'settings',
      'social-title'
    ]))
  }
});

export default function Page() {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');

  return (
    <WithholdingTaxCertificatesPortal
      activityType={ACTIVITY_TYPE.SELLING}
      partnerLabel={tInvoicing('payment.attributes.customer')}
      partnerPlaceholder={tCommon('filters.search_customer')}
      title={tInvoicing('withholding_tax.sales_title')}
      subtitle={tInvoicing('withholding_tax.sales_subtitle')}
    />
  );
}
