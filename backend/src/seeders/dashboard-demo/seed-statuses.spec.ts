import { DEMO_DOCUMENT_STATUS_POOLS } from './seed-statuses';

describe('dashboard demo document status pools', () => {
  it('matches the statuses exposed by each frontend screen', () => {
    expect(DEMO_DOCUMENT_STATUS_POOLS).toEqual({
      quotation: [
        'quotation.status.draft',
        'quotation.status.created',
        'quotation.status.accepted',
        'quotation.status.rejected',
        'quotation.status.expired',
      ],
      customerOrder: [
        'customerOrder.status.draft',
        'customerOrder.status.created',
        'customerOrder.status.validated',
        'customerOrder.status.cancelled',
      ],
      deliveryNote: [
        'deliveryNote.status.draft',
        'deliveryNote.status.created',
        'deliveryNote.status.delivered',
        'deliveryNote.status.cancelled',
      ],
      goodsIssueNote: [
        'goodsIssueNote.status.draft',
        'goodsIssueNote.status.created',
        'goodsIssueNote.status.issued',
        'goodsIssueNote.status.cancelled',
        'goodsIssueNote.status.expired',
      ],
      invoice: [
        'invoice.status.draft',
        'invoice.status.unpaid',
        'invoice.status.partially_paid',
        'invoice.status.partially_settled',
        'invoice.status.settled',
        'invoice.status.paid',
        'invoice.status.expired',
      ],
      creditNote: [
        'creditNote.status.draft',
        'creditNote.status.unpaid',
        'creditNote.status.partially_paid',
        'creditNote.status.paid',
        'creditNote.status.expired',
      ],
      returnNote: [
        'returnNote.status.draft',
        'returnNote.status.validated',
        'returnNote.status.cancelled',
        'returnNote.status.expired',
      ],
    });
  });

  it('never generates archived statuses', () => {
    const statuses = Object.values(DEMO_DOCUMENT_STATUS_POOLS).flat();

    expect(statuses.some((status) => status.endsWith('.archived'))).toBe(false);
  });
});
