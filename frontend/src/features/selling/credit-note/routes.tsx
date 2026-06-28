import React from 'react';
import { CreditNoteCreateForm } from '@/components/selling/credit-note/CreditNoteCreateForm';
import { CreditNotePortal } from '@/components/selling/credit-note/CreditNotePortal';
import { CreditNoteUpdateForm } from '@/components/selling/credit-note/CreditNoteUpdateForm';
import {
  SellingDocumentRouteFrame,
  SellingPortalRouteFrame,
  useSellingFirmId,
  useSellingRouteId
} from '@/features/selling/shared/navigation';
import type {
  SellingDocumentRouteConfig,
  SellingPortalConfig
} from '@/features/invoicing/shared/models';

const creditNoteRouteConfig: SellingDocumentRouteConfig = {
  listPath: '/selling/credit-notes',
  createPath: '/selling/new-credit-note',
  detailPath: '/selling/credit-note'
};

const creditNotePortalConfig: SellingPortalConfig = {
  listPath: creditNoteRouteConfig.listPath,
  portalClassName: 'py-6'
};

export const SellingCreditNoteListRoute = () => (
  <SellingPortalRouteFrame>
    <CreditNotePortal className={creditNotePortalConfig.portalClassName} />
  </SellingPortalRouteFrame>
);

export const SellingCreditNoteCreateRoute = () => {
  const firmId = useSellingFirmId();

  return (
    <SellingDocumentRouteFrame>
      <CreditNoteCreateForm firmId={firmId} listPath={creditNoteRouteConfig.listPath} />
    </SellingDocumentRouteFrame>
  );
};

export const SellingCreditNoteUpdateRoute = () => {
  const creditNoteId = useSellingRouteId();

  return (
    <SellingDocumentRouteFrame>
      <CreditNoteUpdateForm creditNoteId={creditNoteId} listPath={creditNoteRouteConfig.listPath} />
    </SellingDocumentRouteFrame>
  );
};
