export enum INVOICE_STATUS {
  Nonexistent = 'invoice.status.non_existent',
  Draft = 'invoice.status.draft',
  Sent = 'invoice.status.sent',
  Validated = 'invoice.status.validated',
  Paid = 'invoice.status.paid',
  Settled = 'invoice.status.settled',
  PartiallyPaid = 'invoice.status.partially_paid',
  PartiallySettled = 'invoice.status.partially_settled',
  Unpaid = 'invoice.status.unpaid',
  Expired = 'invoice.status.expired',
  Archived = 'quotation.status.archived',
}
