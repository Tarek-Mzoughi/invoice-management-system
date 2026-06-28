import React from 'react';
import { ReturnNoteCreateForm } from '@/components/selling/return-note/ReturnNoteCreateForm';
import { ReturnNotePortal } from '@/components/selling/return-note/ReturnNotePortal';
import { ReturnNoteUpdateForm } from '@/components/selling/return-note/ReturnNoteUpdateForm';
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

const returnNoteRouteConfig: SellingDocumentRouteConfig = {
  listPath: '/selling/return-notes',
  createPath: '/selling/new-return-note',
  detailPath: '/selling/return-note'
};

const returnNotePortalConfig: SellingPortalConfig = {
  listPath: returnNoteRouteConfig.listPath,
  portalClassName: 'py-6'
};

export const SellingReturnNoteListRoute = () => (
  <SellingPortalRouteFrame>
    <ReturnNotePortal className={returnNotePortalConfig.portalClassName} />
  </SellingPortalRouteFrame>
);

export const SellingReturnNoteCreateRoute = () => {
  const firmId = useSellingFirmId();

  return (
    <SellingDocumentRouteFrame>
      <ReturnNoteCreateForm firmId={firmId} listPath={returnNoteRouteConfig.listPath} />
    </SellingDocumentRouteFrame>
  );
};

export const SellingReturnNoteUpdateRoute = () => {
  const returnNoteId = useSellingRouteId();

  return (
    <SellingDocumentRouteFrame>
      <ReturnNoteUpdateForm returnNoteId={returnNoteId} listPath={returnNoteRouteConfig.listPath} />
    </SellingDocumentRouteFrame>
  );
};
