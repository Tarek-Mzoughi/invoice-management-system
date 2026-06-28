export type SellingDocumentStatusTone =
  | 'draft'
  | 'warning'
  | 'success'
  | 'info'
  | 'danger'
  | 'neutral';

export interface SellingDocumentStatusConfig<TStatus = string> {
  status: TStatus;
  labelKey: string;
  tone: SellingDocumentStatusTone;
  withCheckIcon?: boolean;
}
