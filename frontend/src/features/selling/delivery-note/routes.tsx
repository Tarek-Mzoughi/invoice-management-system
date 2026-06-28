import React from 'react';
import { DeliveryNoteCreateForm } from '@/components/selling/delivery-note/DeliveryNoteCreateForm';
import { DeliveryNotePortal } from '@/components/selling/delivery-note/DeliveryNotePortal';
import { DeliveryNoteUpdateForm } from '@/components/selling/delivery-note/DeliveryNoteUpdateForm';
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

const deliveryNoteRouteConfig: SellingDocumentRouteConfig = {
  listPath: '/selling/delivery-notes',
  createPath: '/selling/new-delivery-note',
  detailPath: '/selling/delivery-note'
};

const deliveryNotePortalConfig: SellingPortalConfig = {
  listPath: deliveryNoteRouteConfig.listPath,
  portalClassName: 'py-6'
};

export const SellingDeliveryNoteListRoute = () => (
  <SellingPortalRouteFrame>
    <DeliveryNotePortal className={deliveryNotePortalConfig.portalClassName} />
  </SellingPortalRouteFrame>
);

export const SellingDeliveryNoteCreateRoute = () => {
  const firmId = useSellingFirmId();

  return (
    <SellingDocumentRouteFrame>
      <DeliveryNoteCreateForm firmId={firmId} listPath={deliveryNoteRouteConfig.listPath} />
    </SellingDocumentRouteFrame>
  );
};

export const SellingDeliveryNoteUpdateRoute = () => {
  const deliveryNoteId = useSellingRouteId();

  return (
    <SellingDocumentRouteFrame>
      <DeliveryNoteUpdateForm
        deliveryNoteId={deliveryNoteId}
        listPath={deliveryNoteRouteConfig.listPath}
      />
    </SellingDocumentRouteFrame>
  );
};
