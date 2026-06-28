import { INVOICE_STATUS, QUOTATION_STATUS } from '../../../../types';

export interface SellingDocumentEditabilityRule<TStatus> {
  editableStatuses: TStatus[];
}

export const isStatusEditable = <TStatus>(
  status: TStatus | undefined,
  rule: SellingDocumentEditabilityRule<TStatus>
) => !!status && rule.editableStatuses.includes(status);

export const INVOICE_EDITABILITY_RULE: SellingDocumentEditabilityRule<INVOICE_STATUS> = {
  editableStatuses: [INVOICE_STATUS.Draft, INVOICE_STATUS.Unpaid]
};

export const INVOICE_FORM_STATUS = {
  draft: INVOICE_STATUS.Draft,
  validated: INVOICE_STATUS.Unpaid
} as const;

export const SELLING_QUOTATION_EDITABILITY_RULE: SellingDocumentEditabilityRule<QUOTATION_STATUS> =
  {
    editableStatuses: [
      QUOTATION_STATUS.Draft,
      QUOTATION_STATUS.Validated,
      QUOTATION_STATUS.Accepted,
      QUOTATION_STATUS.Rejected
    ]
  };
