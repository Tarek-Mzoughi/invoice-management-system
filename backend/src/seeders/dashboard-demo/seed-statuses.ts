import { CREDIT_NOTE_STATUS } from 'src/modules/credit-note/enums/credit-note-status.enum';
import { CUSTOMER_ORDER_STATUS } from 'src/modules/customer-order/enums/customer-order-status.enum';
import { DELIVERY_NOTE_STATUS } from 'src/modules/delivery-note/enums/delivery-note-status.enum';
import { GOODS_ISSUE_NOTE_STATUS } from 'src/modules/goods-issue-note/enums/goods-issue-note-status.enum';
import { INVOICE_STATUS } from 'src/modules/invoice/enums/invoice-status.enum';
import { QUOTATION_STATUS } from 'src/modules/quotation/enums/quotation-status.enum';
import { RETURN_NOTE_STATUS } from 'src/modules/return-note/enums/return-note-status.enum';

export const DEMO_DOCUMENT_STATUS_POOLS = {
  quotation: [
    QUOTATION_STATUS.Draft,
    QUOTATION_STATUS.Created,
    QUOTATION_STATUS.Accepted,
    QUOTATION_STATUS.Rejected,
    QUOTATION_STATUS.Expired,
  ],
  customerOrder: [
    CUSTOMER_ORDER_STATUS.Draft,
    CUSTOMER_ORDER_STATUS.Created,
    CUSTOMER_ORDER_STATUS.Validated,
    CUSTOMER_ORDER_STATUS.Cancelled,
  ],
  deliveryNote: [
    DELIVERY_NOTE_STATUS.Draft,
    DELIVERY_NOTE_STATUS.Created,
    DELIVERY_NOTE_STATUS.Delivered,
    DELIVERY_NOTE_STATUS.Cancelled,
  ],
  goodsIssueNote: [
    GOODS_ISSUE_NOTE_STATUS.Draft,
    GOODS_ISSUE_NOTE_STATUS.Created,
    GOODS_ISSUE_NOTE_STATUS.Issued,
    GOODS_ISSUE_NOTE_STATUS.Cancelled,
    GOODS_ISSUE_NOTE_STATUS.Expired,
  ],
  invoice: [
    INVOICE_STATUS.Draft,
    INVOICE_STATUS.Unpaid,
    INVOICE_STATUS.PartiallyPaid,
    INVOICE_STATUS.PartiallySettled,
    INVOICE_STATUS.Settled,
    INVOICE_STATUS.Paid,
    INVOICE_STATUS.Expired,
  ],
  creditNote: [
    CREDIT_NOTE_STATUS.Draft,
    CREDIT_NOTE_STATUS.Unpaid,
    CREDIT_NOTE_STATUS.PartiallyPaid,
    CREDIT_NOTE_STATUS.Paid,
    CREDIT_NOTE_STATUS.Expired,
  ],
  returnNote: [
    RETURN_NOTE_STATUS.Draft,
    RETURN_NOTE_STATUS.Validated,
    RETURN_NOTE_STATUS.Cancelled,
    RETURN_NOTE_STATUS.Expired,
  ],
} as const;
