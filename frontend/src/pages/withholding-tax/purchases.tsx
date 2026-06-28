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
      activityType={ACTIVITY_TYPE.BUYING}
      partnerLabel={tInvoicing('payment.attributes.supplier')}
      partnerPlaceholder={tCommon('filters.search_supplier')}
      showExportTej
      title={tInvoicing('withholding_tax.purchases_title')}
      subtitle={tInvoicing('withholding_tax.purchases_subtitle')}
    />
  );
}
