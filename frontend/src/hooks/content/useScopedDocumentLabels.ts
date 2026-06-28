import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

type SupportedDocumentKey = 'customerOrder' | 'deliveryNote' | 'creditNote' | 'returnNote';
type DocumentScope = 'selling' | 'buying';

interface TranslateOptions {
  [key: string]: unknown;
}

interface DisplayableDocument {
  reference?: string | null;
  sequential?: string | null;
}

export const useScopedDocumentLabels = (
  documentKey: SupportedDocumentKey,
  scope?: DocumentScope
) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');
  const resolvedScope =
    scope ||
    (router.pathname.startsWith('/buying') || router.asPath.startsWith('/buying')
      ? 'buying'
      : 'selling');
  const isBuying = resolvedScope === 'buying';

  const t = React.useCallback(
    (key: string, options?: TranslateOptions) => {
      const fallbackValue = tInvoicing(`${documentKey}.${key}`, options);

      if (!isBuying) {
        return fallbackValue;
      }

      return tInvoicing(`${documentKey}.buying_${key}`, {
        ...options,
        defaultValue: fallbackValue
      });
    },
    [documentKey, isBuying, tInvoicing]
  );

  const referenceFieldLabel = React.useMemo(() => {
    const fallbackValue = tInvoicing(`${documentKey}.attributes.reference`);

    if (!isBuying) {
      return fallbackValue;
    }

    return tInvoicing(`${documentKey}.buying_reference_label`, {
      defaultValue: fallbackValue
    });
  }, [documentKey, isBuying, tInvoicing]);

  const referencePlaceholder = React.useMemo(() => {
    const fallbackValue = tInvoicing(`${documentKey}.placeholders.reference`, {
      defaultValue: ''
    });

    if (!isBuying) {
      return fallbackValue;
    }

    return tInvoicing(`${documentKey}.placeholders.buying_reference`, {
      defaultValue: fallbackValue
    });
  }, [documentKey, isBuying, tInvoicing]);

  const partnerFallback = React.useMemo(() => {
    const fallbackValue = tInvoicing(`${documentKey}.details.walk_in_customer`, {
      defaultValue: 'Client passager'
    });

    if (!isBuying) {
      return fallbackValue;
    }

    return tInvoicing(`${documentKey}.buying_details.walk_in_customer`, {
      defaultValue: 'Fournisseur passager'
    });
  }, [documentKey, isBuying, tInvoicing]);

  const displayNumber = React.useCallback(
    (document?: DisplayableDocument | null) => {
      if (!document) {
        return '-';
      }

      if (isBuying) {
        return document.reference || document.sequential || '-';
      }

      return document.sequential || '-';
    },
    [isBuying]
  );

  return React.useMemo(
    () => ({
      scope: resolvedScope,
      isBuying,
      t,
      singular: t('singular'),
      plural: t('plural'),
      newLabel: t('new'),
      addButtonLabel: t('add_button_label'),
      cardDescription: t('card_description'),
      document: t('document', { defaultValue: t('singular') }),
      changeStatusTitle: t('change_status', { defaultValue: 'Changer le statut' }),
      detailDescription: t('details.description', { defaultValue: '' }),
      referenceFieldLabel,
      referencePlaceholder,
      partnerFallback,
      displayNumber
    }),
    [
      displayNumber,
      isBuying,
      partnerFallback,
      referenceFieldLabel,
      referencePlaceholder,
      resolvedScope,
      t
    ]
  );
};

export default useScopedDocumentLabels;
