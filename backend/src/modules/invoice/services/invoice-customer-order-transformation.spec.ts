import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { CUSTOMER_ORDER_STATUS } from 'src/modules/customer-order/enums/customer-order-status.enum';
import { INVOICE_STATUS } from '../enums/invoice-status.enum';
import { InvoiceService } from './invoice.service';

jest.mock('@nestjs-cls/transactional', () => ({
  Transactional:
    () =>
    (_target: object, _propertyKey: string, descriptor: PropertyDescriptor) =>
      descriptor,
}));

const buildCustomerOrder = (activityType: ACTIVITY_TYPE) =>
  ({
    id: 42,
    activityType,
    cabinetId: 3,
    currencyId: 4,
    bankAccountId: 5,
    interlocutorId: 6,
    firmId: 7,
    discount: 10,
    discount_type: 'amount',
    object: 'Commande fournisseur',
    status: CUSTOMER_ORDER_STATUS.Created,
    invoices: [],
    deliveryNotes: [],
    goodsIssueNotes: [],
    articleCustomerOrderEntries: [
      {
        unit_price: 100,
        quantity: 2,
        discount: 0,
        discount_type: 'amount',
        subTotal: 200,
        total: 238,
        article: { id: 8 },
        articleCustomerOrderEntryTaxes: [{ taxId: 9 }],
      },
    ],
  }) as any;

const buildService = () => {
  const service = Object.create(InvoiceService.prototype) as InvoiceService;
  const save = jest.fn().mockResolvedValue({ id: 99 });
  const markValidatedByTransformation = jest.fn().mockResolvedValue(undefined);

  (service as any).save = save;
  (service as any).customerOrderLifecycleService = {
    assertCanTransformToInvoice: jest.fn(),
    markValidatedByTransformation,
  };

  return { service, save, markValidatedByTransformation };
};

describe('InvoiceService customer-order transformations', () => {
  it('creates a buying draft invoice with an automatic internal reference', async () => {
    const { service, save } = buildService();

    await service.saveFromCustomerOrder(
      buildCustomerOrder(ACTIVITY_TYPE.BUYING),
    );

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        activityType: ACTIVITY_TYPE.BUYING,
        customerOrderId: 42,
        firmId: 7,
        status: INVOICE_STATUS.Draft,
        articleInvoiceEntries: [
          expect.objectContaining({
            articleId: 8,
            taxes: [9],
          }),
        ],
      }),
      { autoReferenceFromSequential: true },
    );
  });

  it('creates and validates a buying invoice with an automatic internal reference', async () => {
    const { service, save, markValidatedByTransformation } = buildService();

    await service.saveFromCustomerOrderAndValidate(
      buildCustomerOrder(ACTIVITY_TYPE.BUYING),
    );

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        activityType: ACTIVITY_TYPE.BUYING,
        customerOrderId: 42,
        status: INVOICE_STATUS.Unpaid,
      }),
      { autoReferenceFromSequential: true },
    );
    expect(markValidatedByTransformation).toHaveBeenCalledWith(42);
  });

  it('keeps selling transformations on their existing reference behavior', async () => {
    const { service, save } = buildService();

    await service.saveFromCustomerOrder(
      buildCustomerOrder(ACTIVITY_TYPE.SELLING),
    );

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: ACTIVITY_TYPE.SELLING }),
      { autoReferenceFromSequential: false },
    );
  });
});
