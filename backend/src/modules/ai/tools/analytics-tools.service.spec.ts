import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsToolsService } from './analytics-tools.service';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { PaymentEntity } from 'src/modules/payment/entities/payment.entity';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { INVOICE_STATUS } from 'src/modules/invoice/enums/invoice-status.enum';
import { FirmEntity } from 'src/modules/firm/entities/firm.entity';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import { CustomerOrderEntity } from 'src/modules/customer-order/entities/customer-order.entity';
import { DeliveryNoteEntity } from 'src/modules/delivery-note/entities/delivery-note.entity';
import { CreditNoteEntity } from 'src/modules/credit-note/entities/credit-note.entity';

describe('AnalyticsToolsService', () => {
  let service: AnalyticsToolsService;
  let invoiceRepo: any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let paymentRepo: any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let quotationRepo: any;

  const mockInvoices = [
    {
      id: 1,
      sequential: 'FAC-001',
      status: INVOICE_STATUS.Paid,
      total: 1000,
      amountPaid: 1000,
      date: new Date('2026-01-15'),
      dueDate: new Date('2026-02-15'),
      cabinetId: 1,
      interlocutor: { surname: 'Ahmed' },
      currency: { code: 'TND' },
      createdAt: new Date(),
    },
    {
      id: 2,
      sequential: 'FAC-002',
      status: INVOICE_STATUS.Unpaid,
      total: 500,
      amountPaid: 0,
      date: new Date('2026-01-20'),
      dueDate: new Date('2025-12-01'), // overdue
      cabinetId: 1,
      interlocutor: { surname: 'Sami' },
      currency: { code: 'TND' },
      createdAt: new Date(),
    },
    {
      id: 3,
      sequential: 'FAC-003',
      status: INVOICE_STATUS.PartiallyPaid,
      total: 300,
      amountPaid: 150,
      date: new Date('2026-02-01'),
      dueDate: new Date('2099-03-01'), // not overdue
      cabinetId: 1,
      interlocutor: { surname: 'Ahmed' },
      currency: { code: 'TND' },
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsToolsService,
        {
          provide: getRepositoryToken(InvoiceEntity),
          useValue: {
            find: jest.fn().mockResolvedValue(mockInvoices),
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              addGroupBy: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getRepositoryToken(PaymentEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getRepositoryToken(QuotationEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(FirmEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: getRepositoryToken(ArticleEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(CustomerOrderEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(DeliveryNoteEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(CreditNoteEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsToolsService>(AnalyticsToolsService);
    invoiceRepo = module.get(getRepositoryToken(InvoiceEntity));
    paymentRepo = module.get(getRepositoryToken(PaymentEntity));
    quotationRepo = module.get(getRepositoryToken(QuotationEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInvoiceSummary', () => {
    it('should return correct invoice summary', async () => {
      const result = await service.getInvoiceSummary(1);

      expect(result.total).toBe(3);
      expect(result.paid).toBe(1);
      expect(result.unpaid).toBe(1);
      expect(result.partiallyPaid).toBe(1);
      expect(result.overdue).toBe(1);
      expect(result.totalAmount).toBe(1800);
      expect(result.totalPaid).toBe(1150);
      expect(result.totalRemaining).toBe(650);
    });
  });

  describe('getPaidInvoices', () => {
    it('should return only paid invoices', async () => {
      invoiceRepo.find.mockResolvedValue(
        mockInvoices.filter((i) => i.status === INVOICE_STATUS.Paid),
      );

      const result = await service.getPaidInvoices(1);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(INVOICE_STATUS.Paid);
    });
  });

  describe('getOverdueInvoices', () => {
    it('should return overdue invoices', async () => {
      const result = await service.getOverdueInvoices(1);
      expect(result.length).toBeGreaterThanOrEqual(1);
      // FAC-002 has dueDate in the past and is Unpaid
      expect(result.some((i: any) => i.sequential === 'FAC-002')).toBe(true);
    });
  });

  describe('getPartiallyPaidInvoices', () => {
    it('should return partially paid invoices', async () => {
      invoiceRepo.find.mockResolvedValue(
        mockInvoices.filter((i) => i.status === INVOICE_STATUS.PartiallyPaid),
      );

      const result = await service.getPartiallyPaidInvoices(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('getQuotesStatusSummary', () => {
    it('should return empty summary when no quotations', async () => {
      const result = await service.getQuotesStatusSummary(1);
      expect(result.total).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });

  describe('getDashboardKpis', () => {
    it('should return combined KPIs', async () => {
      const result = await service.getDashboardKpis(1);
      expect(result).toHaveProperty('invoices');
      expect(result).toHaveProperty('quotations');
      expect(result).toHaveProperty('recentRevenue');
      expect(result).toHaveProperty('topCustomers');
    });
  });
});
