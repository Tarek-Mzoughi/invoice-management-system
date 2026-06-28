import React from 'react';
import {
  GoodsReceiptNoteCreateForm,
  GoodsReceiptNotePortal,
  GoodsReceiptNoteUpdateForm
} from '@/components/buying/goods-receipt-note';
import {
  BuyingDocumentRouteFrame,
  BuyingPortalRouteFrame,
  useBuyingFirmId,
  useBuyingRouteId
} from '@/features/buying/shared/navigation';

export const BuyingGoodsReceiptNoteListRoute = () => (
  <BuyingPortalRouteFrame>
    <GoodsReceiptNotePortal />
  </BuyingPortalRouteFrame>
);

export const BuyingGoodsReceiptNoteCreateRoute = () => {
  const firmId = useBuyingFirmId();

  return (
    <BuyingDocumentRouteFrame>
      <GoodsReceiptNoteCreateForm firmId={firmId} />
    </BuyingDocumentRouteFrame>
  );
};

export const BuyingGoodsReceiptNoteUpdateRoute = () => {
  const goodsReceiptNoteId = useBuyingRouteId();

  return (
    <BuyingDocumentRouteFrame>
      <GoodsReceiptNoteUpdateForm goodsReceiptNoteId={goodsReceiptNoteId} />
    </BuyingDocumentRouteFrame>
  );
};
