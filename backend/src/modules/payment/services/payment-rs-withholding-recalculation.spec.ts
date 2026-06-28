import { BadRequestException } from '@nestjs/common';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { INVOICE_STATUS } from 'src/modules/invoice/enums/invoice-status.enum';
import { PAYMENT_MODE } from '../enums/payment-mode.enum';
import { PaymentInvoiceEntryService } from './payment-invoice-entry.service';
import { PaymentService } from './payment.service';

describe('payment withholding allocation recalculation', () => {
  const createPaymentService = () => Object.create(PaymentService.prototype);

  it('reduces a stale single-invoice allocation when withholding is removed', () => {
    const service = createPaymentService();

    const adjusted = service.normalizeInvoiceAllocationsForWithholdingDecrease(
      {
        amount: 119.387,
        fee: 0,
        mode: PAYMENT_MODE.Cash,
        taxWithholdingAmount: null,
      },
      [{ invoiceId: 1, amount: 121.19 }],
      [],
      1.803,
      3,
    );

    expect(adjusted).toEqual([{ invoiceId: 1, amount: 119.387 }]);
  });

  it('reduces multiple invoice allocations proportionally', () => {
    const service = createPaymentService();

    const adjusted = service.normalizeInvoiceAllocationsForWithholdingDecrease(
      {
        amount: 90,
        fee: 0,
        mode: PAYMENT_MODE.Cash,
        taxWithholdingAmount: null,
      },
      [
        { invoiceId: 1, amount: 70 },
        { invoiceId: 2, amount: 30 },
      ],
      [],
      10,
      3,
    );

    expect(adjusted).toEqual([
      { invoiceId: 1, amount: 63 },
      { invoiceId: 2, amount: 27 },
    ]);
  });

  it('applies rounding remainder to the last affected allocation', () => {
    const service = createPaymentService();

    const adjusted = service.normalizeInvoiceAllocationsForWithholdingDecrease(
      {
        amount: 99.99,
        fee: 0,
        mode: PAYMENT_MODE.Cash,
        taxWithholdingAmount: null,
      },
      [
        { invoiceId: 1, amount: 33.333 },
        { invoiceId: 2, amount: 33.333 },
        { invoiceId: 3, amount: 33.334 },
      ],
      [],
      0.01,
      3,
    );

    expect(adjusted).toEqual([
      { invoiceId: 1, amount: 33.33 },
      { invoiceId: 2, amount: 33.33 },
      { invoiceId: 3, amount: 33.33 },
    ]);
  });

  it('never reduces allocations below zero', () => {
    const service = createPaymentService();

    const adjusted = service.reduceInvoiceAllocationsByAmount(
      [
        { invoiceId: 1, amount: 2 },
        { invoiceId: 2, amount: 1 },
      ],
      3,
      3,
    );

    expect(adjusted).toEqual([
      { invoiceId: 1, amount: 0 },
      { invoiceId: 2, amount: 0 },
    ]);
  });

  it('leaves unresolved allocation mismatches to coverage validation', () => {
    const service = createPaymentService();

    const adjusted = service.normalizeInvoiceAllocationsForWithholdingDecrease(
      {
        amount: 100,
        fee: 0,
        mode: PAYMENT_MODE.Cash,
        taxWithholdingAmount: null,
      },
      [{ invoiceId: 1, amount: 121.19 }],
      [],
      1.803,
      3,
    );

    expect(() =>
      service.assertCoverageMatchesAllocations(
        {
          amount: 100,
          fee: 0,
          mode: PAYMENT_MODE.Cash,
          taxWithholdingAmount: null,
        },
        adjusted,
        [],
        3,
      ),
    ).toThrow(BadRequestException);
  });

  it('recalculates a paid invoice as partially paid after allocation decreases', async () => {
    const paymentInvoiceEntryRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          amount: 119.387,
          payment: {
            mode: PAYMENT_MODE.Cash,
          },
        },
      ]),
    };
    const invoiceService = {
      findOneByCondition: jest.fn().mockResolvedValue({
        activityType: ACTIVITY_TYPE.SELLING,
        currency: { digitAfterComma: 3 },
        id: 1,
        taxWithholdingAmount: 0,
        total: 121.19,
      }),
      updateFields: jest.fn(),
    };
    const service = new PaymentInvoiceEntryService(
      paymentInvoiceEntryRepository as any,
      invoiceService as any,
    );

    await service.recalculateInvoiceStatuses([1]);

    expect(invoiceService.updateFields).toHaveBeenCalledWith(1, {
      amountPaid: 119.387,
      amountSettled: 0,
      status: INVOICE_STATUS.PartiallyPaid,
    });
  });

  it('removes payment withholding without deleting payment, uploads, credit notes, or treasury movement', async () => {
    const service = createPaymentService();
    const existingPayment = {
      id: 1,
      activityType: ACTIVITY_TYPE.SELLING,
      amount: 90,
      fee: 0,
      mode: PAYMENT_MODE.Cash,
      convertionRate: 1,
      currencyId: 1,
      currency: { digitAfterComma: 3 },
      taxWithholdingId: 3,
      taxWithholdingDate: new Date('2026-04-25T00:00:00.000Z'),
      taxWithholdingAmount: 1.803,
      invoices: [
        {
          id: 10,
          paymentId: 1,
          invoiceId: 20,
          amount: 101.803,
          invoice: {
            id: 20,
            activityType: ACTIVITY_TYPE.SELLING,
            currencyId: 1,
          },
        },
      ],
      creditNotes: [
        {
          id: 30,
          paymentId: 1,
          creditNoteId: 40,
          amount: 10,
          originalCurrencyId: 1,
          exchangeRateToPaymentCurrency: 1,
          convertedAmount: 10,
          convertedCurrencyId: 1,
        },
      ],
      uploads: [{ id: 50, paymentId: 1, uploadId: 60 }],
    };
    service.paymentRepository = {
      findOne: jest.fn().mockResolvedValue(existingPayment),
      save: jest.fn().mockResolvedValue({ id: 1 }),
      softDelete: jest.fn(),
    };
    service.paymentInvoiceEntryService = {
      softDeleteMany: jest.fn().mockResolvedValue(undefined),
      saveMany: jest.fn().mockResolvedValue([]),
    };
    service.paymentCreditNoteEntryService = {
      softDeleteMany: jest.fn(),
      saveMany: jest.fn(),
    };
    service.paymentStorageService = {
      softDelete: jest.fn(),
      save: jest.fn(),
    };
    service.treasuryMovementService = {
      softDelete: jest.fn(),
      save: jest.fn(),
    };
    service.hydratePayment = jest
      .fn()
      .mockResolvedValueOnce(existingPayment)
      .mockResolvedValue({
        id: 1,
        taxWithholdingId: null,
        taxWithholdingDate: null,
        taxWithholdingAmount: null,
      });

    const result = await service.removeWithholdingTransactionally(1);

    expect(result).toEqual({
      id: 1,
      taxWithholdingId: null,
      taxWithholdingDate: null,
      taxWithholdingAmount: null,
    });
    expect(service.paymentRepository.save).toHaveBeenCalledWith({
      id: 1,
      taxWithholdingId: null,
      taxWithholdingDate: null,
      taxWithholdingAmount: null,
    });
    expect(
      service.paymentInvoiceEntryService.softDeleteMany,
    ).toHaveBeenCalledWith([10]);
    expect(service.paymentInvoiceEntryService.saveMany).toHaveBeenCalledWith([
      {
        paymentId: 1,
        invoiceId: 20,
        amount: 100,
        digitAfterComma: 3,
      },
    ]);
    expect(service.paymentRepository.softDelete).not.toHaveBeenCalled();
    expect(
      service.paymentCreditNoteEntryService.softDeleteMany,
    ).not.toHaveBeenCalled();
    expect(
      service.paymentCreditNoteEntryService.saveMany,
    ).not.toHaveBeenCalled();
    expect(service.paymentStorageService.softDelete).not.toHaveBeenCalled();
    expect(service.treasuryMovementService.softDelete).not.toHaveBeenCalled();
    expect(service.treasuryMovementService.save).not.toHaveBeenCalled();
  });

  it('rejects removing withholding from a payment with no withholding amount', async () => {
    const service = createPaymentService();
    service.paymentRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        taxWithholdingAmount: 0,
      }),
      save: jest.fn(),
    };
    service.paymentInvoiceEntryService = {
      softDeleteMany: jest.fn(),
      saveMany: jest.fn(),
    };

    await expect(service.removeWithholdingTransactionally(1)).rejects.toThrow(
      BadRequestException,
    );

    expect(service.paymentRepository.save).not.toHaveBeenCalled();
    expect(
      service.paymentInvoiceEntryService.softDeleteMany,
    ).not.toHaveBeenCalled();
    expect(service.paymentInvoiceEntryService.saveMany).not.toHaveBeenCalled();
  });
});
