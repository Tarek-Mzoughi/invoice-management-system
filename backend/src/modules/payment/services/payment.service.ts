import { BadRequestException, Injectable } from '@nestjs/common';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { PaymentRepository } from '../repositories/payment-file.repository';
import { PaymentNotFoundException } from '../errors/payment.notfound.error';
import { ResponsePaymentDto } from '../dtos/payment.response.dto';
import { CreatePaymentDto } from '../dtos/payment.create.dto';
import { UpdatePaymentDto } from '../dtos/payment.update.dto';
import { CreatePaymentCreditNoteEntryDto } from '../dtos/payment-credit-note-entry.create.dto';
import { CreatePaymentInvoiceEntryDto } from '../dtos/payment-invoice-entry.create.dto';
import { InvoiceService } from 'src/modules/invoice/services/invoice.service';
import { FirmService } from 'src/modules/firm/services/firm.service';
import { Transactional } from '@nestjs-cls/transactional';
import { PaymentInvoiceEntryService } from './payment-invoice-entry.service';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { PaymentStorageService } from './payment-upload.service';
import { ResponsePaymentUploadDto } from '../dtos/payment-upload.response.dto';
import { PaymentEntity } from '../entities/payment.entity';
import { PaymentStorageEntity } from '../entities/payment-file.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { FIRM_ENTITY_TYPE } from 'src/modules/firm/enums/firm-entity-type.enum';
import { BankAccountService } from 'src/modules/bank-account/services/bank-account.service';
import { BANK_ACCOUNT_TYPE } from 'src/modules/bank-account/enums/bank-account-type.enum';
import { TreasuryMovementService } from 'src/modules/treasury-movement/services/treasury-movement.service';
import { TREASURY_MOVEMENT_KIND } from 'src/modules/treasury-movement/enums/treasury-movement-kind.enum';
import { TREASURY_MOVEMENT_DIRECTION } from 'src/modules/treasury-movement/enums/treasury-movement-direction.enum';
import { PAYMENT_COLLECTION_STATUS } from '../enums/payment-collection-status.enum';
import { PAYMENT_MODE } from '../enums/payment-mode.enum';
import { TaxWithholdingService } from 'src/modules/tax-withholding/services/tax-withholding.service';
import { PaymentCreditNoteEntryService } from './payment-credit-note-entry.service';
import { CreditNoteService } from 'src/modules/credit-note/services/credit-note.service';
import {
  createDineroAmountFromFloatWithDynamicCurrency,
  normalizeDineroPrecision,
} from 'src/utils/money.utils';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';

const PAYMENT_RELATIONS = [
  'currency',
  'firm',
  'treasuryAccount',
  'originTreasuryAccount',
  'taxWithholding',
  'uploads',
  'uploads.upload',
  'invoices',
  'invoices.invoice',
  'invoices.invoice.currency',
  'creditNotes',
  'creditNotes.creditNote',
  'creditNotes.creditNote.currency',
  'creditNotes.originalCurrency',
  'creditNotes.convertedCurrency',
] as const;

type PreparedCreditNoteEntry = CreatePaymentCreditNoteEntryDto & {
  paymentId: number;
  creditNoteId: number;
  amount: number;
  originalCurrencyId: number;
  exchangeRateToPaymentCurrency: number;
  convertedAmount: number;
  convertedCurrencyId: number;
};

type PreparedInvoiceEntry = CreatePaymentInvoiceEntryDto & {
  paymentId: number;
  invoiceId: number;
  amount: number;
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentInvoiceEntryService: PaymentInvoiceEntryService,
    private readonly paymentStorageService: PaymentStorageService,
    private readonly invoiceService: InvoiceService,
    private readonly currencyService: CurrencyService,
    private readonly firmService: FirmService,
    private readonly bankAccountService: BankAccountService,
    private readonly treasuryMovementService: TreasuryMovementService,
    private readonly taxWithholdingService: TaxWithholdingService,
    private readonly paymentCreditNoteEntryService: PaymentCreditNoteEntryService,
    private readonly creditNoteService: CreditNoteService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  private async getCabinetIdForUser(
    userId?: string,
  ): Promise<number | undefined> {
    return userId
      ? await this.tenantContextService.getCurrentCabinetIdOrFail(userId)
      : undefined;
  }

  private async scopeQueryForUser(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<IQueryObject> {
    const cabinetId = await this.getCabinetIdForUser(userId);
    return cabinetId
      ? this.tenantContextService.scopeQueryToCabinet(query, cabinetId)
      : { ...query };
  }

  private normalizeActivityType(activityType?: ACTIVITY_TYPE): ACTIVITY_TYPE {
    return activityType === ACTIVITY_TYPE.BUYING
      ? ACTIVITY_TYPE.BUYING
      : ACTIVITY_TYPE.SELLING;
  }

  private assertFirmEntityType(
    activityType: ACTIVITY_TYPE,
    entityType?: FIRM_ENTITY_TYPE | null,
  ) {
    const expectedEntityType =
      activityType === ACTIVITY_TYPE.BUYING
        ? FIRM_ENTITY_TYPE.SUPPLIERS
        : FIRM_ENTITY_TYPE.CLIENTS;

    if ((entityType ?? FIRM_ENTITY_TYPE.CLIENTS) !== expectedEntityType) {
      throw new BadRequestException(
        activityType === ACTIVITY_TYPE.BUYING
          ? 'Les paiements d’achat doivent être liés à un fournisseur.'
          : 'Les paiements de vente doivent être liés à un client.',
      );
    }
  }

  private isNegotiableMode(mode?: PAYMENT_MODE | null): boolean {
    return [PAYMENT_MODE.Check, PAYMENT_MODE.BillOfExchange].includes(
      mode as PAYMENT_MODE,
    );
  }

  private isCreditNoteSettlementMode(mode?: PAYMENT_MODE | null): boolean {
    return mode === PAYMENT_MODE.CreditNoteSettlement;
  }

  private getImmediatePaidStatus(
    activityType?: ACTIVITY_TYPE | null,
  ): PAYMENT_COLLECTION_STATUS {
    return this.normalizeActivityType(activityType) === ACTIVITY_TYPE.BUYING
      ? PAYMENT_COLLECTION_STATUS.PAID_SUPPLIER
      : PAYMENT_COLLECTION_STATUS.PAID;
  }

  private toFiniteNumber(value?: number | string | null, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private getCollectionStatus(payment?: PaymentEntity | null) {
    return payment?.collectionStatus ?? PAYMENT_COLLECTION_STATUS.PENDING;
  }

  private normalizePaymentCollectionStatus<T extends PaymentEntity | null>(
    payment: T,
  ): T {
    if (!payment) return payment;

    if (this.isNegotiableMode(payment.mode) && !payment.collectionStatus) {
      payment.collectionStatus = PAYMENT_COLLECTION_STATUS.PENDING;
    } else if (!payment.collectionStatus && payment.mode) {
      payment.collectionStatus = this.getImmediatePaidStatus(
        payment.activityType,
      );
    }

    return payment;
  }

  private normalizePaymentCollectionStatuses(
    payments: PaymentEntity[],
  ): PaymentEntity[] {
    return payments.map((payment) =>
      this.normalizePaymentCollectionStatus(payment),
    );
  }

  private parseDate(value?: Date | string | null): Date | null {
    if (!value) return null;

    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private getValidConversionRate(
    payment?: Partial<PaymentEntity> | null,
  ): number | null {
    const rate = Number(payment?.convertionRate);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  }

  private roundAmount(value: number, digitsAfterComma = 3): number {
    return Number(value.toFixed(digitsAfterComma));
  }

  private toMinorAmount(
    value: number | string | null | undefined,
    digits = 3,
  ): number {
    const precision = normalizeDineroPrecision(digits);
    return createDineroAmountFromFloatWithDynamicCurrency(
      this.toFiniteNumber(value),
      precision,
    );
  }

  private fromMinorAmount(value: number, digits = 3): number {
    const precision = normalizeDineroPrecision(digits);
    const factor = 10 ** precision;
    return Number((value / factor).toFixed(precision));
  }

  private reduceInvoiceAllocationsByAmount<
    T extends CreatePaymentInvoiceEntryDto,
  >(invoiceEntries: T[], reductionAmount: number, digitsAfterComma = 3): T[] {
    const precision = normalizeDineroPrecision(digitsAfterComma);
    const requestedReductionMinor = Math.max(
      this.toMinorAmount(reductionAmount, precision),
      0,
    );

    if (!requestedReductionMinor || !invoiceEntries.length) {
      return invoiceEntries;
    }

    const allocations = invoiceEntries.map((entry, index) => ({
      index,
      amountMinor: Math.max(this.toMinorAmount(entry.amount, precision), 0),
    }));
    const affectedAllocations = allocations.filter(
      (allocation) => allocation.amountMinor > 0,
    );
    const totalAllocatedMinor = affectedAllocations.reduce(
      (sum, allocation) => sum + allocation.amountMinor,
      0,
    );

    if (!totalAllocatedMinor) {
      throw new BadRequestException(
        'Cannot reduce withholding tax from empty invoice allocations.',
      );
    }

    if (requestedReductionMinor > totalAllocatedMinor) {
      throw new BadRequestException(
        'The withholding tax reduction exceeds the invoice allocation total.',
      );
    }

    const reductions = new Map<number, number>();
    let appliedReductionMinor = 0;

    for (const allocation of affectedAllocations) {
      const proportionalReduction = Math.floor(
        (requestedReductionMinor * allocation.amountMinor) /
          totalAllocatedMinor,
      );
      const safeReduction = Math.min(
        proportionalReduction,
        allocation.amountMinor,
      );
      reductions.set(allocation.index, safeReduction);
      appliedReductionMinor += safeReduction;
    }

    let remainderMinor = requestedReductionMinor - appliedReductionMinor;
    for (
      let index = affectedAllocations.length - 1;
      index >= 0 && remainderMinor > 0;
      index -= 1
    ) {
      const allocation = affectedAllocations[index];
      const currentReduction = reductions.get(allocation.index) ?? 0;
      const capacity = allocation.amountMinor - currentReduction;
      const extraReduction = Math.min(capacity, remainderMinor);

      reductions.set(allocation.index, currentReduction + extraReduction);
      remainderMinor -= extraReduction;
    }

    if (remainderMinor > 0) {
      throw new BadRequestException(
        'Unable to safely distribute withholding tax allocation reduction.',
      );
    }

    return invoiceEntries.map((entry, index) => {
      const amountMinor = allocations[index].amountMinor;
      const reductionMinor = reductions.get(index) ?? 0;
      const nextAmountMinor = Math.max(amountMinor - reductionMinor, 0);

      return {
        ...entry,
        amount: this.fromMinorAmount(nextAmountMinor, precision),
      };
    }) as T[];
  }

  private normalizeInvoiceAllocationsForWithholdingDecrease<
    T extends CreatePaymentInvoiceEntryDto,
  >(
    payment: PaymentEntity,
    invoiceEntries: T[],
    creditNoteEntries: PreparedCreditNoteEntry[],
    previousTaxWithholdingAmount: number,
    paymentCurrencyDigits: number,
  ): T[] {
    const precision = normalizeDineroPrecision(paymentCurrencyDigits);
    const previousWithholdingMinor = this.toMinorAmount(
      previousTaxWithholdingAmount,
      precision,
    );
    const newWithholdingMinor = this.toMinorAmount(
      payment.taxWithholdingAmount,
      precision,
    );
    const removedWithholdingMinor = Math.max(
      previousWithholdingMinor - newWithholdingMinor,
      0,
    );

    if (!removedWithholdingMinor || !invoiceEntries.length) {
      return invoiceEntries;
    }

    const incomingAllocationMinor = invoiceEntries.reduce(
      (sum, entry) =>
        sum + Math.max(this.toMinorAmount(entry.amount, precision), 0),
      0,
    );
    const creditNoteCoverageMinor = creditNoteEntries.reduce(
      (sum, entry) =>
        sum + Math.max(this.toMinorAmount(entry.convertedAmount, precision), 0),
      0,
    );
    const realCoverageMinor =
      Math.max(this.toMinorAmount(payment.amount, precision), 0) +
      Math.max(this.toMinorAmount(payment.fee, precision), 0) +
      creditNoteCoverageMinor +
      Math.max(newWithholdingMinor, 0);
    const allocationCoverageGapMinor = Math.max(
      incomingAllocationMinor - realCoverageMinor,
      0,
    );

    if (!allocationCoverageGapMinor) {
      return invoiceEntries;
    }

    const reductionMinor = Math.min(
      allocationCoverageGapMinor,
      removedWithholdingMinor,
    );

    if (!reductionMinor) {
      return invoiceEntries;
    }

    return this.reduceInvoiceAllocationsByAmount(
      invoiceEntries,
      this.fromMinorAmount(reductionMinor, precision),
      precision,
    );
  }

  private buildExistingInvoiceAllocationPayload(
    payment: PaymentEntity,
    paymentCurrencyDigits: number,
  ): CreatePaymentInvoiceEntryDto[] {
    const conversionRate = this.getValidConversionRate(payment) ?? 1;

    return (payment.invoices ?? [])
      .filter(
        (entry) => Number(entry?.invoiceId) > 0 && Number(entry?.amount) > 0,
      )
      .map((entry) => {
        const isCrossCurrency =
          entry.invoice?.currencyId &&
          payment.currencyId &&
          entry.invoice.currencyId !== payment.currencyId;
        const amountInPaymentCurrency = isCrossCurrency
          ? this.roundAmount(
              this.toFiniteNumber(entry.amount) / conversionRate,
              paymentCurrencyDigits,
            )
          : this.roundAmount(
              this.toFiniteNumber(entry.amount),
              paymentCurrencyDigits,
            );

        return {
          invoiceId: Number(entry.invoiceId),
          amount: amountInPaymentCurrency,
          digitAfterComma: paymentCurrencyDigits,
        };
      });
  }

  private buildExistingCreditNoteCoverageEntries(
    payment: PaymentEntity,
    paymentCurrencyDigits: number,
  ): PreparedCreditNoteEntry[] {
    return (payment.creditNotes ?? [])
      .filter(
        (entry) => Number(entry?.creditNoteId) > 0 && Number(entry?.amount) > 0,
      )
      .map((entry) => ({
        paymentId: payment.id,
        creditNoteId: Number(entry.creditNoteId),
        amount: this.toFiniteNumber(entry.amount),
        originalCurrencyId:
          entry.originalCurrencyId ??
          entry.creditNote?.currencyId ??
          payment.currencyId,
        exchangeRateToPaymentCurrency: this.toFiniteNumber(
          entry.exchangeRateToPaymentCurrency,
          1,
        ),
        convertedAmount: this.roundAmount(
          this.toFiniteNumber(entry.convertedAmount ?? entry.amount),
          paymentCurrencyDigits,
        ),
        convertedCurrencyId: entry.convertedCurrencyId ?? payment.currencyId,
        digitAfterComma:
          entry.originalCurrency?.digitAfterComma ??
          entry.creditNote?.currency?.digitAfterComma ??
          paymentCurrencyDigits,
      }));
  }

  private async buildWorkflowPayload(
    paymentLike: Partial<PaymentEntity>,
    existingPayment?: Partial<PaymentEntity>,
    cabinetId?: number,
  ): Promise<Partial<PaymentEntity>> {
    const mode = paymentLike.mode ?? existingPayment?.mode;

    if (this.isCreditNoteSettlementMode(mode)) {
      return {
        ...paymentLike,
        amount: this.toFiniteNumber(paymentLike.amount, 0),
        reference: paymentLike.reference?.trim() || null,
        dueDate: null,
        treasuryAccountId: null,
        originTreasuryAccountId: null,
        collectionStatus: this.getImmediatePaidStatus(
          paymentLike.activityType ?? existingPayment?.activityType,
        ),
        depositedAt: null,
        paidAt: null,
        rejectedAt: null,
        rejectionReason: null,
        encashmentMovementId: null,
      };
    }

    if (!this.isNegotiableMode(mode)) {
      const treasuryAccountId =
        paymentLike.treasuryAccountId ?? existingPayment?.treasuryAccountId;
      if (!treasuryAccountId) {
        throw new BadRequestException(
          'Treasury account is required for payments.',
        );
      }

      await (cabinetId
        ? this.bankAccountService.findOneByIdInCabinet(
            treasuryAccountId,
            cabinetId,
          )
        : this.bankAccountService.findOneById(treasuryAccountId));

      return {
        ...paymentLike,
        reference: paymentLike.reference?.trim() || null,
        dueDate: null,
        treasuryAccountId,
        originTreasuryAccountId: null,
        collectionStatus: this.getImmediatePaidStatus(
          paymentLike.activityType ?? existingPayment?.activityType,
        ),
        depositedAt: null,
        paidAt: null,
        rejectedAt: null,
        rejectionReason: null,
        encashmentMovementId:
          paymentLike.encashmentMovementId ??
          existingPayment?.encashmentMovementId ??
          null,
      };
    }

    const reference =
      paymentLike.reference?.trim() || existingPayment?.reference?.trim();
    if (!reference) {
      throw new BadRequestException(
        'Reference is required for checks and drafts.',
      );
    }

    const dueDate = this.parseDate(
      paymentLike.dueDate ?? existingPayment?.dueDate,
    );
    if (!dueDate) {
      throw new BadRequestException(
        'Due date is required for checks and drafts.',
      );
    }

    const treasuryAccountId =
      paymentLike.treasuryAccountId ?? existingPayment?.treasuryAccountId;
    if (!treasuryAccountId) {
      throw new BadRequestException(
        'Treasury account is required for checks and drafts.',
      );
    }

    await (cabinetId
      ? this.bankAccountService.findOneByIdInCabinet(
          treasuryAccountId,
          cabinetId,
        )
      : this.bankAccountService.findOneById(treasuryAccountId));

    const paymentDate = this.parseDate(
      paymentLike.date ?? existingPayment?.date,
    );
    if (paymentDate && dueDate.getTime() < paymentDate.getTime()) {
      throw new BadRequestException(
        'Due date must be greater than or equal to payment date.',
      );
    }

    return {
      ...paymentLike,
      reference,
      dueDate,
      treasuryAccountId,
      originTreasuryAccountId:
        paymentLike.originTreasuryAccountId ??
        existingPayment?.originTreasuryAccountId ??
        null,
      collectionStatus:
        paymentLike.collectionStatus ??
        existingPayment?.collectionStatus ??
        PAYMENT_COLLECTION_STATUS.PENDING,
      depositedAt:
        paymentLike.depositedAt ?? existingPayment?.depositedAt ?? null,
      paidAt: paymentLike.paidAt ?? existingPayment?.paidAt ?? null,
      rejectedAt: paymentLike.rejectedAt ?? existingPayment?.rejectedAt ?? null,
      rejectionReason:
        paymentLike.rejectionReason ?? existingPayment?.rejectionReason ?? null,
      encashmentMovementId:
        paymentLike.encashmentMovementId ??
        (this.isNegotiableMode(existingPayment?.mode)
          ? existingPayment?.encashmentMovementId
          : null) ??
        null,
    };
  }

  private async hydratePayment(
    id: number,
    userId?: string,
  ): Promise<PaymentEntity> {
    const cabinetId = await this.getCabinetIdForUser(userId);
    const payment = await this.paymentRepository.findOne({
      where: cabinetId ? { id, cabinetId } : { id },
      relations: [...PAYMENT_RELATIONS],
    });

    if (!payment) {
      throw new PaymentNotFoundException();
    }

    return this.normalizePaymentCollectionStatus(payment);
  }

  private async findWorkflowPaymentById(
    id: number,
    userId?: string,
  ): Promise<PaymentEntity> {
    const payment = await this.hydratePayment(id, userId);

    if (!this.isNegotiableMode(payment.mode)) {
      throw new BadRequestException(
        'Only checks and drafts support this treasury workflow.',
      );
    }

    return this.normalizePaymentCollectionStatus(payment);
  }

  private buildEncashmentLabel(payment: PaymentEntity): string {
    const instrumentType =
      payment.mode === PAYMENT_MODE.BillOfExchange ? 'Traite' : 'Chèque';
    const suffix = payment.reference?.trim() || payment.id?.toString() || '';
    const prefix =
      payment.activityType === ACTIVITY_TYPE.BUYING
        ? 'Décaissement'
        : 'Encaissement';

    return [prefix, instrumentType, suffix].filter(Boolean).join(' ');
  }

  private buildTreasuryMovementLabel(payment: PaymentEntity): string {
    const prefix =
      payment.activityType === ACTIVITY_TYPE.BUYING
        ? 'Décaissement'
        : 'Encaissement';
    const suffix = payment.reference?.trim() || payment.id?.toString() || '';

    return [prefix, suffix].filter(Boolean).join(' ');
  }

  private async createTreasuryMovementForPayment(payment: PaymentEntity) {
    if (!payment.treasuryAccountId || !payment.currencyId) {
      throw new BadRequestException(
        'Treasury account and currency are required for payment treasury movements.',
      );
    }

    const treasuryAccount = await this.bankAccountService.findOneById(
      payment.treasuryAccountId,
    );
    if (payment.cabinetId && treasuryAccount.cabinetId !== payment.cabinetId) {
      throw new BadRequestException(
        'Treasury account does not belong to the payment cabinet.',
      );
    }

    if (!treasuryAccount.currencyId) {
      throw new BadRequestException('Treasury account currency is missing.');
    }

    const isCrossCurrencyMovement =
      treasuryAccount.currencyId !== payment.currencyId;
    const conversionRate = this.getValidConversionRate(payment);

    if (isCrossCurrencyMovement && !conversionRate) {
      throw new BadRequestException(
        'A valid conversion rate is required when the treasury account uses a different currency.',
      );
    }

    if (!Number.isFinite(payment.amount) || payment.amount <= 0) {
      throw new BadRequestException('The payment amount must be positive.');
    }

    const targetCurrencyDigits =
      treasuryAccount.currency?.digitAfterComma ??
      payment.currency?.digitAfterComma ??
      3;
    const movementAmount = isCrossCurrencyMovement
      ? this.roundAmount(
          payment.amount * (conversionRate as number),
          targetCurrencyDigits,
        )
      : payment.amount;

    return this.treasuryMovementService.save(
      {
        accountId: payment.treasuryAccountId,
        currencyId: treasuryAccount.currencyId,
        kind:
          payment.activityType === ACTIVITY_TYPE.BUYING
            ? TREASURY_MOVEMENT_KIND.EXPENSE
            : TREASURY_MOVEMENT_KIND.INCOME,
        direction:
          payment.activityType === ACTIVITY_TYPE.BUYING
            ? TREASURY_MOVEMENT_DIRECTION.OUT
            : TREASURY_MOVEMENT_DIRECTION.IN,
        amount: movementAmount,
        label: this.buildTreasuryMovementLabel(payment),
        notes: payment.notes,
        movementDate: (
          this.parseDate(payment.date) || new Date()
        ).toISOString(),
      },
      undefined,
      payment.cabinetId,
    );
  }

  private async clearImmediateTreasuryMovement(payment?: PaymentEntity | null) {
    if (
      payment &&
      !this.isNegotiableMode(payment.mode) &&
      payment.encashmentMovementId
    ) {
      await this.treasuryMovementService.softDelete(
        payment.encashmentMovementId,
        undefined,
        payment.cabinetId,
      );
    }
  }

  private async syncImmediateTreasuryMovement(
    payment: PaymentEntity,
    existingPayment?: PaymentEntity | null,
  ): Promise<void> {
    await this.clearImmediateTreasuryMovement(existingPayment);

    if (
      this.isNegotiableMode(payment.mode) ||
      this.isCreditNoteSettlementMode(payment.mode)
    ) {
      return;
    }

    const movement = await this.createTreasuryMovementForPayment(payment);
    await this.paymentRepository.save({
      id: payment.id,
      encashmentMovementId: movement.id,
    });
  }

  private async resolveTaxWithholdingPayload(
    paymentLike: CreatePaymentDto | UpdatePaymentDto,
    userId?: string,
  ): Promise<Partial<PaymentEntity>> {
    if (!paymentLike.taxWithholdingId) {
      return {
        taxWithholdingId: null,
        taxWithholdingDate: null,
        taxWithholdingAmount: null,
      };
    }

    const invoices = (paymentLike.invoices ?? []).filter(
      (entry) => Number(entry?.invoiceId) > 0 && Number(entry?.amount) > 0,
    );

    if (!invoices.length) {
      throw new BadRequestException(
        'At least one invoice is required when withholding tax is enabled.',
      );
    }

    const invoiceEntities = await Promise.all(
      invoices.map((entry) =>
        this.invoiceService.findOneById(Number(entry.invoiceId), userId),
      ),
    );
    const hasInvoiceLevelWithholding = invoiceEntities.some(
      (invoice) => Number(invoice.taxWithholdingAmount || 0) > 0,
    );

    if (hasInvoiceLevelWithholding) {
      throw new BadRequestException(
        'A selected invoice already has withholding tax. Payment-level withholding would double count it.',
      );
    }

    const taxWithholding = await this.taxWithholdingService.findOneById(
      paymentLike.taxWithholdingId,
    );
    const paymentCurrency = paymentLike.currencyId
      ? await this.currencyService.findOneById(paymentLike.currencyId)
      : null;
    const digitsAfterComma = paymentCurrency?.digitAfterComma ?? 3;
    const withholdingBase = invoices.reduce(
      (sum, entry) => sum + Number(entry.amount || 0),
      0,
    );
    const taxWithholdingAmount = this.roundAmount(
      withholdingBase * ((taxWithholding.rate || 0) / 100),
      digitsAfterComma,
    );
    const taxWithholdingDate =
      this.parseDate(paymentLike.taxWithholdingDate) ||
      this.parseDate(paymentLike.date) ||
      new Date();

    return {
      taxWithholdingId: taxWithholding.id,
      taxWithholdingDate,
      taxWithholdingAmount,
    };
  }

  private async prepareCreditNoteEntries(
    payment: PaymentEntity,
    entries: CreatePaymentCreditNoteEntryDto[],
    activityType: ACTIVITY_TYPE,
    fallbackConversionRate: number,
    paymentCurrencyDigits: number,
    userId?: string,
  ): Promise<PreparedCreditNoteEntry[]> {
    const preparedEntries: PreparedCreditNoteEntry[] = [];

    for (const entry of entries) {
      const creditNote = await this.creditNoteService.findOneByCondition(
        {
          filter: `id||$eq||${entry.creditNoteId}`,
          join: 'currency',
        },
        userId,
      );

      if (!creditNote) {
        throw new BadRequestException('Credit note not found.');
      }

      if (
        entry.originalCurrencyId &&
        entry.originalCurrencyId !== creditNote.currencyId
      ) {
        throw new BadRequestException(
          'The credit note original currency does not match the selected credit note.',
        );
      }

      if (
        entry.convertedCurrencyId &&
        entry.convertedCurrencyId !== payment.currencyId
      ) {
        throw new BadRequestException(
          'The credit note converted currency must match the payment currency.',
        );
      }

      const originalCurrencyDigits =
        creditNote.currency?.digitAfterComma ?? paymentCurrencyDigits;
      const originalAmount = this.roundAmount(
        this.toFiniteNumber(entry.amount),
        originalCurrencyDigits,
      );
      const isCrossCurrency = creditNote.currencyId !== payment.currencyId;
      const requestedRate = this.toFiniteNumber(
        entry.exchangeRateToPaymentCurrency,
        fallbackConversionRate,
      );
      const exchangeRateToPaymentCurrency = isCrossCurrency ? requestedRate : 1;

      if (isCrossCurrency && exchangeRateToPaymentCurrency <= 0) {
        throw new BadRequestException(
          'A valid exchange rate is required when a credit note uses a different currency.',
        );
      }

      preparedEntries.push({
        paymentId: payment.id,
        creditNoteId: Number(entry.creditNoteId),
        amount: originalAmount,
        originalCurrencyId: creditNote.currencyId,
        exchangeRateToPaymentCurrency,
        convertedAmount: this.roundAmount(
          isCrossCurrency
            ? originalAmount * exchangeRateToPaymentCurrency
            : originalAmount,
          paymentCurrencyDigits,
        ),
        convertedCurrencyId: payment.currencyId,
        digitAfterComma: originalCurrencyDigits,
      });
    }

    await this.paymentCreditNoteEntryService.assertCreditNoteEntriesCanBeUsed(
      preparedEntries,
      activityType,
      payment.firmId,
    );

    return preparedEntries;
  }

  private assertCoverageMatchesAllocations(
    payment: PaymentEntity,
    invoicePayloadEntries: CreatePaymentInvoiceEntryDto[],
    creditNoteEntries: PreparedCreditNoteEntry[],
    paymentCurrencyDigits: number,
  ) {
    const invoiceAllocationTotal = this.roundAmount(
      invoicePayloadEntries.reduce(
        (sum, entry) => sum + this.toFiniteNumber(entry.amount),
        0,
      ),
      paymentCurrencyDigits,
    );
    const creditNoteCoverage = this.roundAmount(
      creditNoteEntries.reduce(
        (sum, entry) => sum + this.toFiniteNumber(entry.convertedAmount),
        0,
      ),
      paymentCurrencyDigits,
    );
    const moneyAmount = this.roundAmount(
      this.toFiniteNumber(payment.amount),
      paymentCurrencyDigits,
    );
    const fee = this.roundAmount(
      this.toFiniteNumber(payment.fee),
      paymentCurrencyDigits,
    );
    const withholdingAmount = this.roundAmount(
      this.toFiniteNumber(payment.taxWithholdingAmount),
      paymentCurrencyDigits,
    );
    const totalCoverage = this.roundAmount(
      moneyAmount + fee + creditNoteCoverage + withholdingAmount,
      paymentCurrencyDigits,
    );
    const tolerance = Math.max(1 / 10 ** paymentCurrencyDigits, 0.000001);

    if (invoiceAllocationTotal <= 0) {
      throw new BadRequestException(
        'At least one invoice allocation is required for a payment.',
      );
    }

    if (this.isNegotiableMode(payment.mode) && creditNoteCoverage > 0) {
      throw new BadRequestException(
        'Credit note usage is not supported with checks or drafts in the current payment workflow.',
      );
    }

    if (this.isCreditNoteSettlementMode(payment.mode)) {
      if (moneyAmount !== 0) {
        throw new BadRequestException(
          'A credit note settlement must have a zero money amount.',
        );
      }

      if (creditNoteCoverage <= 0) {
        throw new BadRequestException(
          'A credit note settlement requires at least one credit note amount.',
        );
      }
    } else if (moneyAmount <= 0) {
      throw new BadRequestException(
        'The payment amount must be positive unless the payment is settled by credit note.',
      );
    }

    if (totalCoverage <= 0) {
      throw new BadRequestException('The payment coverage must be positive.');
    }

    if (Math.abs(totalCoverage - invoiceAllocationTotal) > tolerance) {
      throw new BadRequestException(
        'The payment coverage must match the invoice allocation total.',
      );
    }
  }

  private async recalculateLinkedSellingInvoices(
    payment?: Pick<PaymentEntity, 'invoices'> | null,
  ) {
    const invoiceIds = Array.from(
      new Set(
        (payment?.invoices ?? [])
          .map((entry) => entry.invoiceId)
          .filter((invoiceId) => Number(invoiceId) > 0),
      ),
    );

    if (!invoiceIds.length) {
      return;
    }

    await this.paymentInvoiceEntryService.recalculateInvoiceStatuses(
      invoiceIds,
    );
  }

  async findOneById(
    id: number,
    relations: string[] = [],
    userId?: string,
  ): Promise<PaymentEntity> {
    const cabinetId = await this.getCabinetIdForUser(userId);
    const payment = relations.length
      ? await this.paymentRepository.findOne({
          where: cabinetId ? { id, cabinetId } : { id },
          relations,
        })
      : cabinetId
        ? await this.paymentRepository.findOne({ where: { id, cabinetId } })
        : await this.paymentRepository.findOneById(id);

    if (!payment) {
      throw new PaymentNotFoundException();
    }
    return this.normalizePaymentCollectionStatus(payment);
  }

  async findOneByCondition(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<ResponsePaymentDto | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const payment = await this.paymentRepository.findOne(
      queryOptions as FindOneOptions<PaymentEntity>,
    );
    if (!payment) return null;
    return this.normalizePaymentCollectionStatus(payment);
  }

  async findAll(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<ResponsePaymentDto[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    return this.normalizePaymentCollectionStatuses(
      await this.paymentRepository.findAll(
        queryOptions as FindManyOptions<PaymentEntity>,
      ),
    );
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponsePaymentDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const count = await this.paymentRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = this.normalizePaymentCollectionStatuses(
      await this.paymentRepository.findAll(
        queryOptions as FindManyOptions<PaymentEntity>,
      ),
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: parseInt(query.page),
        take: parseInt(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(entities, pageMetaDto);
  }

  @Transactional()
  async save(
    createPaymentDto: CreatePaymentDto,
    userId?: string,
  ): Promise<PaymentEntity> {
    const cabinetId =
      (await this.getCabinetIdForUser(userId)) ??
      (createPaymentDto as CreatePaymentDto & { cabinetId?: number }).cabinetId;
    const activityType = this.normalizeActivityType(
      createPaymentDto.activityType,
    );
    const normalizedConversionRate =
      Number(createPaymentDto.convertionRate) > 0
        ? Number(createPaymentDto.convertionRate)
        : 1;
    const normalizedInvoices = (createPaymentDto.invoices ?? []).filter(
      (entry) => Number(entry?.invoiceId) > 0 && Number(entry?.amount) > 0,
    );
    const normalizedCreditNotes = (createPaymentDto.creditNotes ?? []).filter(
      (entry) => Number(entry?.creditNoteId) > 0 && Number(entry?.amount) > 0,
    );
    const firm = createPaymentDto.firmId
      ? cabinetId
        ? await this.firmService.findOneByIdInCabinet(
            createPaymentDto.firmId,
            cabinetId,
          )
        : await this.firmService.findOneById(createPaymentDto.firmId)
      : null;
    this.assertFirmEntityType(activityType, firm?.entityType);

    const createPaymentCore = { ...createPaymentDto } as Partial<PaymentEntity>;
    delete createPaymentCore.uploads;
    delete createPaymentCore.invoices;
    delete (createPaymentCore as CreatePaymentDto).creditNotes;
    createPaymentCore.amount = this.toFiniteNumber(createPaymentDto.amount);
    createPaymentCore.fee = this.toFiniteNumber(createPaymentDto.fee);

    const taxWithholdingPayload = await this.resolveTaxWithholdingPayload(
      createPaymentDto,
      userId,
    );

    const paymentPayload = await this.buildWorkflowPayload(
      {
        ...createPaymentCore,
        ...taxWithholdingPayload,
        activityType,
        cabinetId,
        convertionRate: normalizedConversionRate,
      },
      undefined,
      cabinetId,
    );

    const payment = await this.paymentRepository.save(paymentPayload);
    const currency = await this.currencyService.findOneById(payment.currencyId);
    const creditNoteEntries = await this.prepareCreditNoteEntries(
      payment,
      normalizedCreditNotes,
      activityType,
      normalizedConversionRate,
      currency.digitAfterComma,
      userId,
    );

    this.assertCoverageMatchesAllocations(
      payment,
      normalizedInvoices,
      creditNoteEntries,
      currency.digitAfterComma,
    );

    const invoiceEntries: PreparedInvoiceEntry[] = await Promise.all(
      normalizedInvoices.map(async (entry) => {
        const invoice = await this.invoiceService.findOneById(
          Number(entry.invoiceId),
          userId,
        );
        if (this.normalizeActivityType(invoice.activityType) !== activityType) {
          throw new BadRequestException(
            'Le paiement et la facture doivent appartenir à la même activité',
          );
        }
        return {
          paymentId: payment.id,
          invoiceId: Number(entry.invoiceId),
          amount:
            entry.amount *
            (invoice.currencyId !== payment.currencyId
              ? normalizedConversionRate
              : 1),
          digitAfterComma: currency.digitAfterComma,
        };
      }),
    );

    await this.paymentInvoiceEntryService.saveMany(invoiceEntries);
    await this.paymentCreditNoteEntryService.saveMany(creditNoteEntries);

    const hydratedPayment = await this.hydratePayment(payment.id, userId);
    await this.syncImmediateTreasuryMovement(hydratedPayment);

    // Handle file uploads if they exist
    if (createPaymentDto.uploads) {
      await Promise.all(
        createPaymentDto.uploads.map((u) =>
          this.paymentStorageService.save(payment.id, u.uploadId),
        ),
      );
    }
    return this.hydratePayment(payment.id, userId);
  }

  @Transactional()
  async removeWithholding(id: number, userId?: string): Promise<PaymentEntity> {
    return this.removeWithholdingTransactionally(id, userId);
  }

  private async removeWithholdingTransactionally(
    id: number,
    userId?: string,
  ): Promise<PaymentEntity> {
    const existingPayment = await this.hydratePayment(id, userId);

    const previousTaxWithholdingAmount = this.toFiniteNumber(
      existingPayment.taxWithholdingAmount,
    );

    if (previousTaxWithholdingAmount <= 0) {
      throw new BadRequestException(
        'Payment does not contain withholding tax.',
      );
    }

    const paymentCurrencyDigits =
      existingPayment.currency?.digitAfterComma ?? 3;
    const clearedPayment = {
      ...existingPayment,
      taxWithholdingId: null,
      taxWithholdingDate: null,
      taxWithholdingAmount: null,
    } as PaymentEntity;
    const normalizedInvoices = this.buildExistingInvoiceAllocationPayload(
      existingPayment,
      paymentCurrencyDigits,
    );
    const creditNoteEntries = this.buildExistingCreditNoteCoverageEntries(
      existingPayment,
      paymentCurrencyDigits,
    );
    const adjustedNormalizedInvoices =
      this.normalizeInvoiceAllocationsForWithholdingDecrease(
        clearedPayment,
        normalizedInvoices,
        creditNoteEntries,
        previousTaxWithholdingAmount,
        paymentCurrencyDigits,
      ).filter((entry) => Number(entry?.amount) > 0);

    this.assertCoverageMatchesAllocations(
      clearedPayment,
      adjustedNormalizedInvoices,
      creditNoteEntries,
      paymentCurrencyDigits,
    );

    const normalizedConversionRate =
      this.getValidConversionRate(existingPayment) ?? 1;
    const invoiceEntries: PreparedInvoiceEntry[] = await Promise.all(
      adjustedNormalizedInvoices.map(async (entry) => {
        const existingEntry = existingPayment.invoices?.find(
          (candidate) =>
            Number(candidate.invoiceId) === Number(entry.invoiceId),
        );
        const invoice =
          existingEntry?.invoice ??
          (await this.invoiceService.findOneById(
            Number(entry.invoiceId),
            userId,
          ));

        if (
          this.normalizeActivityType(invoice.activityType) !==
          this.normalizeActivityType(existingPayment.activityType)
        ) {
          throw new BadRequestException(
            'Le paiement et la facture doivent appartenir à la même activité',
          );
        }

        return {
          paymentId: existingPayment.id,
          invoiceId: Number(entry.invoiceId),
          amount:
            entry.amount *
            (invoice.currencyId !== existingPayment.currencyId
              ? normalizedConversionRate
              : 1),
          digitAfterComma: paymentCurrencyDigits,
        };
      }),
    );

    await this.paymentRepository.save({
      id: existingPayment.id,
      taxWithholdingId: null,
      taxWithholdingDate: null,
      taxWithholdingAmount: null,
    });
    await this.paymentInvoiceEntryService.softDeleteMany(
      (existingPayment.invoices ?? []).map((entry) => entry.id),
    );
    await this.paymentInvoiceEntryService.saveMany(invoiceEntries);

    return this.hydratePayment(existingPayment.id, userId);
  }

  @Transactional()
  async update(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
    userId?: string,
  ): Promise<PaymentEntity> {
    const normalizedConversionRate =
      Number(updatePaymentDto.convertionRate) > 0
        ? Number(updatePaymentDto.convertionRate)
        : 1;
    const normalizedInvoices = (updatePaymentDto.invoices ?? []).filter(
      (entry) => Number(entry?.invoiceId) > 0 && Number(entry?.amount) > 0,
    );
    const normalizedCreditNotes = (updatePaymentDto.creditNotes ?? []).filter(
      (entry) => Number(entry?.creditNoteId) > 0 && Number(entry?.amount) > 0,
    );
    const updatePaymentCore = { ...updatePaymentDto } as Partial<PaymentEntity>;
    delete updatePaymentCore.uploads;
    delete updatePaymentCore.invoices;
    delete (updatePaymentCore as UpdatePaymentDto).creditNotes;

    const { uploads: existingUploads, ...existingPayment } =
      await this.hydratePayment(id, userId);
    const cabinetId = existingPayment.cabinetId;
    const activityType = this.normalizeActivityType(
      updatePaymentDto.activityType ?? existingPayment.activityType,
    );
    const firm = cabinetId
      ? await this.firmService.findOneByIdInCabinet(
          updatePaymentDto.firmId ?? existingPayment.firmId,
          cabinetId,
        )
      : await this.firmService.findOneById(
          updatePaymentDto.firmId ?? existingPayment.firmId,
        );
    this.assertFirmEntityType(activityType, firm?.entityType);
    updatePaymentCore.amount = this.toFiniteNumber(
      updatePaymentDto.amount ?? existingPayment.amount,
    );
    updatePaymentCore.fee = this.toFiniteNumber(
      updatePaymentDto.fee ?? existingPayment.fee,
    );

    const taxWithholdingPayload = await this.resolveTaxWithholdingPayload(
      updatePaymentDto,
      userId,
    );

    const workflowPayload = await this.buildWorkflowPayload(
      {
        ...updatePaymentCore,
        ...taxWithholdingPayload,
        activityType,
        cabinetId,
        convertionRate: normalizedConversionRate,
      },
      existingPayment,
      cabinetId,
    );

    await this.paymentInvoiceEntryService.softDeleteMany(
      existingPayment.invoices.map((entry) => entry.id),
    );
    await this.paymentCreditNoteEntryService.softDeleteMany(
      (existingPayment.creditNotes ?? []).map((entry) => entry.id),
    );

    const uploadPayload = updatePaymentDto.uploads ?? [];
    const existingUploadPayload = uploadPayload.filter(
      (u) => Number(u?.id) > 0,
    );
    const newUploadPayload = uploadPayload.filter(
      (u) => !Number(u?.id) && Number(u?.uploadId) > 0,
    );
    const existingUpdatedUploads = await Promise.all(
      existingUploadPayload.map((u) =>
        this.paymentStorageService.findOneById(u.id),
      ),
    );
    const newUpdatedUploads = newUploadPayload.map(
      (u) =>
        ({
          id: 0,
          paymentId: id,
          uploadId: Number(u.uploadId),
        }) as Pick<PaymentStorageEntity, 'id' | 'paymentId' | 'uploadId'>,
    );
    const updatedUploads = [...existingUpdatedUploads, ...newUpdatedUploads];

    // Handle uploads - manage existing, new, and eliminated uploads
    const {
      keptItems: keptUploads,
      newItems: newUploads,
      eliminatedItems: eliminatedUploads,
    } = await this.paymentRepository.updateAssociations<
      Pick<PaymentStorageEntity, 'id' | 'paymentId' | 'uploadId'>
    >({
      keys: ['paymentId', 'uploadId'],
      updatedItems: updatedUploads,
      existingItems: existingUploads,
      onDelete: (id: number) => this.paymentStorageService.softDelete(id),
      onCreate: (entity: ResponsePaymentUploadDto) =>
        this.paymentStorageService.save(entity.paymentId, entity.uploadId),
    });

    const payment = await this.paymentRepository.save({
      ...existingPayment,
      ...updatePaymentCore,
      ...workflowPayload,
      uploads: [...keptUploads, ...newUploads, ...eliminatedUploads],
    });

    const currency = await this.currencyService.findOneById(payment.currencyId);

    const creditNoteEntries = await this.prepareCreditNoteEntries(
      payment,
      normalizedCreditNotes,
      activityType,
      normalizedConversionRate,
      currency.digitAfterComma,
      userId,
    );
    const adjustedNormalizedInvoices =
      this.normalizeInvoiceAllocationsForWithholdingDecrease(
        payment,
        normalizedInvoices,
        creditNoteEntries,
        this.toFiniteNumber(existingPayment.taxWithholdingAmount),
        currency.digitAfterComma,
      ).filter((entry) => Number(entry?.amount) > 0);

    this.assertCoverageMatchesAllocations(
      payment,
      adjustedNormalizedInvoices,
      creditNoteEntries,
      currency.digitAfterComma,
    );

    const invoiceEntries: PreparedInvoiceEntry[] = await Promise.all(
      adjustedNormalizedInvoices.map(async (entry) => {
        const invoice = await this.invoiceService.findOneById(
          Number(entry.invoiceId),
          userId,
        );
        if (this.normalizeActivityType(invoice.activityType) !== activityType) {
          throw new BadRequestException(
            'Le paiement et la facture doivent appartenir à la même activité',
          );
        }
        return {
          paymentId: payment.id,
          invoiceId: Number(entry.invoiceId),
          amount:
            entry.amount *
            (invoice.currencyId !== payment.currencyId
              ? normalizedConversionRate
              : 1),
          digitAfterComma: currency.digitAfterComma,
        };
      }),
    );

    await this.paymentInvoiceEntryService.saveMany(invoiceEntries);
    await this.paymentCreditNoteEntryService.saveMany(creditNoteEntries);
    const hydratedPayment = await this.hydratePayment(payment.id);
    await this.syncImmediateTreasuryMovement(
      hydratedPayment,
      existingPayment as PaymentEntity,
    );

    return this.hydratePayment(payment.id, userId);
  }

  @Transactional()
  async softDelete(id: number, userId?: string): Promise<PaymentEntity> {
    const existingPayment = await this.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'invoices,creditNotes',
      },
      userId,
    );
    if (!existingPayment) {
      throw new PaymentNotFoundException();
    }
    await this.paymentInvoiceEntryService.softDeleteMany(
      existingPayment.invoices.map((invoice) => invoice.id),
    );
    await this.paymentCreditNoteEntryService.softDeleteMany(
      (existingPayment.creditNotes ?? []).map((creditNote) => creditNote.id),
    );
    await this.clearImmediateTreasuryMovement(existingPayment as PaymentEntity);
    await this.paymentRepository.softDelete(id);
    return existingPayment as PaymentEntity;
  }

  @Transactional()
  async depositInstrument(
    id: number,
    bankAccountId: number,
    userId?: string,
  ): Promise<PaymentEntity> {
    const payment = await this.findWorkflowPaymentById(id, userId);
    const currentStatus = this.getCollectionStatus(payment);

    if (currentStatus !== PAYMENT_COLLECTION_STATUS.PENDING) {
      throw new BadRequestException(
        'Only pending instruments can be deposited.',
      );
    }

    if (!payment.treasuryAccountId) {
      throw new BadRequestException(
        'The instrument must be linked to a treasury account before deposit.',
      );
    }

    const bankAccount = payment.cabinetId
      ? await this.bankAccountService.findOneByIdInCabinet(
          bankAccountId,
          payment.cabinetId,
        )
      : await this.bankAccountService.findOneById(bankAccountId);
    if (bankAccount.type !== BANK_ACCOUNT_TYPE.BANK) {
      throw new BadRequestException(
        'Only bank accounts can receive a deposited instrument.',
      );
    }

    if (!payment.currencyId || !bankAccount.currencyId) {
      throw new BadRequestException(
        'Both the instrument and the bank account must define a currency.',
      );
    }

    if (
      payment.currencyId !== bankAccount.currencyId &&
      !this.getValidConversionRate(payment)
    ) {
      throw new BadRequestException(
        'A valid conversion rate is required when the deposit bank account uses a different currency.',
      );
    }

    await this.paymentRepository.save({
      id: payment.id,
      originTreasuryAccountId: payment.treasuryAccountId,
      treasuryAccountId: bankAccount.id,
      collectionStatus: PAYMENT_COLLECTION_STATUS.DEPOSITED,
      depositedAt: new Date(),
      paidAt: null,
      rejectedAt: null,
      rejectionReason: null,
      encashmentMovementId: null,
    });

    return this.hydratePayment(id, userId);
  }

  @Transactional()
  async markInstrumentPaid(
    id: number,
    userId?: string,
  ): Promise<PaymentEntity> {
    const payment = await this.findWorkflowPaymentById(id, userId);

    if (
      this.getCollectionStatus(payment) !== PAYMENT_COLLECTION_STATUS.DEPOSITED
    ) {
      throw new BadRequestException(
        'Only deposited instruments can be marked as paid.',
      );
    }

    if (!payment.treasuryAccountId || !payment.currencyId) {
      throw new BadRequestException(
        'The deposited instrument must have both a bank account and a currency.',
      );
    }

    const treasuryAccount = payment.cabinetId
      ? await this.bankAccountService.findOneByIdInCabinet(
          payment.treasuryAccountId,
          payment.cabinetId,
        )
      : await this.bankAccountService.findOneById(payment.treasuryAccountId);

    if (!treasuryAccount.currencyId) {
      throw new BadRequestException(
        'The deposited bank account must define a currency.',
      );
    }

    const isCrossCurrencyCollection =
      treasuryAccount.currencyId !== payment.currencyId;
    const conversionRate = this.getValidConversionRate(payment);

    if (isCrossCurrencyCollection && !conversionRate) {
      throw new BadRequestException(
        'A valid conversion rate is required to mark this instrument as paid in a bank account with a different currency.',
      );
    }

    if (!Number.isFinite(payment.amount) || payment.amount <= 0) {
      throw new BadRequestException(
        'The instrument amount must be a positive number.',
      );
    }

    const targetCurrencyDigits =
      treasuryAccount.currency?.digitAfterComma ??
      payment.currency?.digitAfterComma ??
      3;
    const movementAmount = isCrossCurrencyCollection
      ? this.roundAmount(
          payment.amount * (conversionRate as number),
          targetCurrencyDigits,
        )
      : payment.amount;

    const movement = await this.treasuryMovementService.save(
      {
        accountId: payment.treasuryAccountId,
        currencyId: treasuryAccount.currencyId,
        kind:
          payment.activityType === ACTIVITY_TYPE.BUYING
            ? TREASURY_MOVEMENT_KIND.EXPENSE
            : TREASURY_MOVEMENT_KIND.INCOME,
        direction:
          payment.activityType === ACTIVITY_TYPE.BUYING
            ? TREASURY_MOVEMENT_DIRECTION.OUT
            : TREASURY_MOVEMENT_DIRECTION.IN,
        amount: movementAmount,
        label: this.buildEncashmentLabel(payment),
        notes: payment.notes,
        movementDate: new Date().toISOString(),
      },
      undefined,
      payment.cabinetId,
    );

    await this.paymentRepository.save({
      id: payment.id,
      collectionStatus: PAYMENT_COLLECTION_STATUS.PAID,
      paidAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
      encashmentMovementId: movement.id,
    });

    await this.recalculateLinkedSellingInvoices(payment);

    return this.hydratePayment(id, userId);
  }

  @Transactional()
  async rejectInstrument(
    id: number,
    reason?: string,
    userId?: string,
  ): Promise<PaymentEntity> {
    const payment = await this.findWorkflowPaymentById(id, userId);

    if (
      this.getCollectionStatus(payment) !== PAYMENT_COLLECTION_STATUS.DEPOSITED
    ) {
      throw new BadRequestException(
        'Only deposited instruments can be rejected.',
      );
    }

    await this.paymentRepository.save({
      id: payment.id,
      collectionStatus: PAYMENT_COLLECTION_STATUS.REJECTED,
      rejectedAt: new Date(),
      rejectionReason: reason?.trim() || null,
      paidAt: null,
      encashmentMovementId: null,
    });

    await this.recalculateLinkedSellingInvoices(payment);

    return this.hydratePayment(id, userId);
  }

  @Transactional()
  async cancelInstrumentDeposit(
    id: number,
    userId?: string,
  ): Promise<PaymentEntity> {
    const payment = await this.findWorkflowPaymentById(id, userId);
    const currentStatus = this.getCollectionStatus(payment);

    if (
      ![
        PAYMENT_COLLECTION_STATUS.DEPOSITED,
        PAYMENT_COLLECTION_STATUS.PAID,
      ].includes(currentStatus)
    ) {
      throw new BadRequestException(
        'Only deposited or paid instruments can cancel their deposit.',
      );
    }

    const originTreasuryAccountId = payment.originTreasuryAccountId;
    if (!originTreasuryAccountId) {
      throw new BadRequestException(
        'The original treasury account could not be determined.',
      );
    }

    if (
      currentStatus === PAYMENT_COLLECTION_STATUS.PAID &&
      payment.encashmentMovementId
    ) {
      await this.treasuryMovementService.softDelete(
        payment.encashmentMovementId,
        undefined,
        payment.cabinetId,
      );
    }

    await this.paymentRepository.save({
      id: payment.id,
      treasuryAccountId: originTreasuryAccountId,
      originTreasuryAccountId: null,
      collectionStatus: PAYMENT_COLLECTION_STATUS.PENDING,
      depositedAt: null,
      paidAt: null,
      rejectedAt: null,
      rejectionReason: null,
      encashmentMovementId: null,
    });

    await this.recalculateLinkedSellingInvoices(payment);

    const updatedPayment = await this.hydratePayment(id, userId);

    if (
      this.getCollectionStatus(updatedPayment) !==
      PAYMENT_COLLECTION_STATUS.PENDING
    ) {
      throw new BadRequestException(
        'The instrument could not be moved back to pending after cancelling the deposit.',
      );
    }

    return updatedPayment;
  }

  async deleteAll() {
    return this.paymentRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.paymentRepository.getTotalCount();
  }
}
