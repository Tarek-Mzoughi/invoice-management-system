import React from 'react';
import { GoodsIssueNoteCreateForm } from '@/components/selling/goods-issue-note/GoodsIssueNoteCreateForm';
import { GoodsIssueNotePortal } from '@/components/selling/goods-issue-note/GoodsIssueNotePortal';
import { GoodsIssueNoteUpdateForm } from '@/components/selling/goods-issue-note/GoodsIssueNoteUpdateForm';
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

const goodsIssueNoteRouteConfig: SellingDocumentRouteConfig = {
  listPath: '/selling/goods-issue-notes',
  createPath: '/selling/new-goods-issue-note',
  detailPath: '/selling/goods-issue-note'
};

const goodsIssueNotePortalConfig: SellingPortalConfig = {
  listPath: goodsIssueNoteRouteConfig.listPath,
  portalClassName: 'py-6'
};

export const SellingGoodsIssueNoteListRoute = () => (
  <SellingPortalRouteFrame>
    <GoodsIssueNotePortal className={goodsIssueNotePortalConfig.portalClassName} />
  </SellingPortalRouteFrame>
);

export const SellingGoodsIssueNoteCreateRoute = () => {
  const firmId = useSellingFirmId();

  return (
    <SellingDocumentRouteFrame>
      <GoodsIssueNoteCreateForm firmId={firmId} listPath={goodsIssueNoteRouteConfig.listPath} />
    </SellingDocumentRouteFrame>
  );
};

export const SellingGoodsIssueNoteUpdateRoute = () => {
  const goodsIssueNoteId = useSellingRouteId();

  return (
    <SellingDocumentRouteFrame>
      <GoodsIssueNoteUpdateForm
        goodsIssueNoteId={goodsIssueNoteId}
        listPath={goodsIssueNoteRouteConfig.listPath}
      />
    </SellingDocumentRouteFrame>
  );
};
