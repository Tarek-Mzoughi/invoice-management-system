export interface InvoicingDocumentRouteConfig {
  listPath: string;
  createPath: string;
  detailPath: string;
}

export interface InvoicingPortalConfig {
  listPath: string;
  pageClassName?: string;
  portalClassName?: string;
}

export type SellingDocumentRouteConfig = InvoicingDocumentRouteConfig;
export type SellingPortalConfig = InvoicingPortalConfig;
export type BuyingDocumentRouteConfig = InvoicingDocumentRouteConfig;
export type BuyingPortalConfig = InvoicingPortalConfig;
