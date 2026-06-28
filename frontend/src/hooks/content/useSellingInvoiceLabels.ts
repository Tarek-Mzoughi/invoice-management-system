import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import useCabinet from './useCabinet';
import type { CabinetInvoiceDisplayType } from '@/types';

interface UseSellingInvoiceLabelsOptions {
  enabled?: boolean;
  displayType?: CabinetInvoiceDisplayType;
  scope?: 'selling' | 'buying';
}

type TranslateOptions = Record<string, unknown>;

interface DisplayableInvoiceLike {
  reference?: string | null;
  sequential?: string | null;
}

export const useSellingInvoiceLabels = (options: UseSellingInvoiceLabelsOptions = {}) => {
  const router = useRouter();
  const { displayType: displayTypeOverride } = options;
  const { t: tInvoicing } = useTranslation('invoicing');
  const inferredScope =
    options.scope ||
    (router.pathname.startsWith('/buying') || router.asPath.startsWith('/buying')
      ? 'buying'
      : 'selling');
  const routeEnabled =
    inferredScope === 'selling' &&
    (router.pathname.startsWith('/selling') || router.asPath.startsWith('/selling'));
  const isEnabled = inferredScope === 'selling' ? options.enabled ?? routeEnabled : false;
  const shouldLoadCabinetDisplayType =
    displayTypeOverride === undefined && inferredScope === 'selling' && isEnabled;
  const { cabinet } = useCabinet(shouldLoadCabinetDisplayType);

  const displayType = displayTypeOverride ?? cabinet?.invoiceDisplayType ?? 'invoice';
  const translationKey =
    inferredScope === 'buying'
      ? 'invoice'
      : isEnabled && displayType === 'honorary_note'
        ? 'honoraryNote'
        : 'invoice';
  const shouldUseBuyingOverrides = inferredScope === 'buying' && translationKey === 'invoice';

  const t = React.useCallback(
    (key: string, translationOptions?: TranslateOptions) => {
      const fallbackValue = tInvoicing(`${translationKey}.${key}`, translationOptions);

      if (!shouldUseBuyingOverrides) {
        return fallbackValue;
      }

      return tInvoicing(`${translationKey}.buying_${key}`, {
        ...translationOptions,
        defaultValue: fallbackValue
      });
    },
    [shouldUseBuyingOverrides, tInvoicing, translationKey]
  );

  const displayNumber = React.useCallback(
    (document?: DisplayableInvoiceLike | null) => {
      if (!document) {
        return '-';
      }

      if (inferredScope === 'buying') {
        return document.reference || document.sequential || '-';
      }

      return document.sequential || '-';
    },
    [inferredScope]
  );

  return React.useMemo(
    () => ({
      displayType,
      enabled: isEnabled,
      isHonoraryNote: translationKey === 'honoraryNote',
      isBuying: inferredScope === 'buying',
      scope: inferredScope,
      translationKey,
      singular: t('singular'),
      plural: t('plural'),
      newLabel: t('new'),
      editTitle: t('edit_title'),
      document: t('document', { defaultValue: t('singular') }),
      changeStatusTitle: t('change_status', { defaultValue: 'Changer le statut' }),
      detailDescription: t('details.description', { defaultValue: '' }),
      referenceFieldLabel: shouldUseBuyingOverrides
        ? tInvoicing(`${translationKey}.buying_reference_label`, {
            defaultValue: t('attributes.reference')
          })
        : t('attributes.reference'),
      referencePlaceholder: shouldUseBuyingOverrides
        ? tInvoicing(`${translationKey}.placeholders.buying_reference`, {
            defaultValue: t('placeholders.reference', { defaultValue: '' })
          })
        : t('placeholders.reference', { defaultValue: '' }),
      partnerFallback: shouldUseBuyingOverrides
        ? tInvoicing(`${translationKey}.buying_details.walk_in_customer`, {
            defaultValue: 'Fournisseur passager'
          })
        : t('details.walk_in_customer', { defaultValue: 'Client passager' }),
      displayNumber,
      t
    }),
    [
      displayNumber,
      displayType,
      inferredScope,
      isEnabled,
      shouldUseBuyingOverrides,
      t,
      tInvoicing,
      translationKey
    ]
  );
};

export default useSellingInvoiceLabels;
