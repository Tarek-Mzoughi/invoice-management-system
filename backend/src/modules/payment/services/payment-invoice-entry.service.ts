import { Injectable } from '@nestjs/common';
import { PaymentInvoiceEntryRepository } from '../repositories/payment-invoice-entry.repository';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ResponsePaymentInvoiceEntryDto } from '../dtos/payment-invoice-entry.response.dto';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindOneOptions } from 'typeorm';
import { PaymentInvoiceEntryNotFoundException } from '../errors/payment-invoice-entry.notfound.error';
import { CreatePaymentInvoiceEntryDto } from '../dtos/payment-invoice-entry.create.dto';
import { UpdatePaymentInvoiceEntryDto } from '../dtos/payment-invoice-entry.update.dto';
import { InvoiceService } from 'src/modules/invoice/services/invoice.service';
import { Transactional } from '@nestjs-cls/transactional';
import { INVOICE_STATUS } from 'src/modules/invoice/enums/invoice-status.enum';
import {
  createDineroAmountFromFloatWithDynamicCurrency,
  normalizeDineroPrecision,
} from 'src/utils/money.utils';
import * as dinero from 'dinero.js';
import { PaymentInvoiceEntryEntity } from '../entities/payment-invoice-entry.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { PAYMENT_COLLECTION_STATUS } from '../enums/payment-collection-status.enum';
import { PAYMENT_MODE } from '../enums/payment-mode.enum';
import { PaymentEntity } from '../entities/payment.entity';

@Injectable()
export class PaymentInvoiceEntryService {
  constructor(
    private readonly paymentInvoiceEntryRepository: PaymentInvoiceEntryRepository,
    private readonly invoiceService: InvoiceService,
  ) {}

  private toDinero(value: number, digitAfterComma?: number | string | null) {
    const precision = normalizeDineroPrecision(digitAfterComma);

    return dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(value, precision),
      precision,
    });
  }

  private isNegotiableMode(mode?: PAYMENT_MODE | null): boolean {
    return [PAYMENT_MODE.Check, PAYMENT_MODE.BillOfExchange].includes(
      mode as PAYMENT_MODE,
    );
  }

  private getEffectiveCollectionStatus(
    payment?: PaymentEntity | null,
  ): PAYMENT_COLLECTION_STATUS | null {
    if (!payment || !this.isNegotiableMode(payment.mode)) {
      return null;
    }

    return payment.collectionStatus ?? PAYMENT_COLLECTION_STATUS.PENDING;
  }

  private async recalculateInvoiceStatus(invoiceId: number): Promise<void> {
    const existingInvoice = await this.invoiceService.findOneByCondition({
      filter: `id||$eq||${invoiceId}`,
      join: 'currency',
    });

    if (!existingInvoice) {
      return;
    }

    const entries = await this.paymentInvoiceEntryRepository.findAll({
      where: { invoiceId },
      relations: ['payment'],
    });

    const zero = this.toDinero(0, existingInvoice.currency?.digitAfterComma);
    let amountPaid = zero;
    let amountSettled = zero;

    for (const entry of entries) {
      const amount = this.toDinero(
        entry.amount,
        existingInvoice.currency?.digitAfterComma,
      );
      const collectionStatus = this.getEffectiveCollectionStatus(entry.payment);

      if (!collectionStatus) {
        amountPaid = amountPaid.add(amount);
        continue;
      }

      if (
        [
          PAYMENT_COLLECTION_STATUS.PENDING,
          PAYMENT_COLLECTION_STATUS.DEPOSITED,
        ].includes(collectionStatus)
      ) {
        amountSettled = amountSettled.add(amount);
        continue;
      }

      if (collectionStatus === PAYMENT_COLLECTION_STATUS.PAID) {
        amountPaid = amountPaid.add(amount);
      }
    }

    const taxWithholdingAmount = this.toDinero(
      existingInvoice.taxWithholdingAmount,
      existingInvoice.currency?.digitAfterComma,
    );
    const invoiceTotal = this.toDinero(
      existingInvoice.total,
      existingInvoice.currency?.digitAfterComma,
    );

    let newInvoiceStatus: INVOICE_STATUS;
    if (existingInvoice.activityType !== ACTIVITY_TYPE.SELLING) {
      const totalCovered = amountPaid.add(taxWithholdingAmount);
      newInvoiceStatus = amountPaid.isZero()
        ? INVOICE_STATUS.Unpaid
        : totalCovered.greaterThanOrEqual(invoiceTotal)
          ? INVOICE_STATUS.Paid
          : INVOICE_STATUS.PartiallyPaid;
    } else if (amountSettled.greaterThan(zero)) {
      const totalCovered = amountPaid
        .add(amountSettled)
        .add(taxWithholdingAmount);
      newInvoiceStatus = totalCovered.greaterThanOrEqual(invoiceTotal)
        ? INVOICE_STATUS.Settled
        : INVOICE_STATUS.PartiallySettled;
    } else {
      const totalCovered = amountPaid.add(taxWithholdingAmount);
      newInvoiceStatus = amountPaid.isZero()
        ? INVOICE_STATUS.Unpaid
        : totalCovered.greaterThanOrEqual(invoiceTotal)
          ? INVOICE_STATUS.Paid
          : INVOICE_STATUS.PartiallyPaid;
    }

    await this.invoiceService.updateFields(existingInvoice.id, {
      amountPaid: amountPaid.toUnit(),
      amountSettled: amountSettled.toUnit(),
      status: newInvoiceStatus,
    });
  }

  async recalculateInvoiceStatuses(invoiceIds: number[]): Promise<void> {
    const uniqueInvoiceIds = Array.from(
      new Set(invoiceIds.filter((invoiceId) => Number(invoiceId) > 0)),
    );

    for (const invoiceId of uniqueInvoiceIds) {
      await this.recalculateInvoiceStatus(invoiceId);
    }
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<PaymentInvoiceEntryEntity | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const entry = await this.paymentInvoiceEntryRepository.findOne(
      queryOptions as FindOneOptions<PaymentInvoiceEntryEntity>,
    );
    if (!entry) return null;
    return entry;
  }

  async findOneById(id: number): Promise<ResponsePaymentInvoiceEntryDto> {
    const entry = await this.paymentInvoiceEntryRepository.findOneById(id);
    if (!entry) {
      throw new PaymentInvoiceEntryNotFoundException();
    }
    return entry;
  }

  @Transactional()
  async save(
    createPaymentInvoiceEntryDto: CreatePaymentInvoiceEntryDto,
  ): Promise<PaymentInvoiceEntryEntity> {
    const savedEntry = await this.paymentInvoiceEntryRepository.save(
      createPaymentInvoiceEntryDto,
    );

    await this.recalculateInvoiceStatus(savedEntry.invoiceId);

    return savedEntry;
  }

  @Transactional()
  async saveMany(
    createPaymentInvoiceEntryDtos: CreatePaymentInvoiceEntryDto[],
  ): Promise<PaymentInvoiceEntryEntity[]> {
    const savedEntries = [];
    for (const dto of createPaymentInvoiceEntryDtos) {
      const savedEntry = await this.save(dto);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  @Transactional()
  async update(
    id: number,
    updatePaymentInvoiceEntryDto: UpdatePaymentInvoiceEntryDto,
  ): Promise<PaymentInvoiceEntryEntity> {
    const existingEntry = await this.findOneById(id);
    const updatedEntry = await this.paymentInvoiceEntryRepository.save({
      ...existingEntry,
      ...updatePaymentInvoiceEntryDto,
    });

    await this.recalculateInvoiceStatuses([
      existingEntry.invoiceId,
      updatedEntry.invoiceId,
    ]);

    return updatedEntry;
  }

  @Transactional()
  async softDelete(id: number): Promise<PaymentInvoiceEntryEntity> {
    const existingEntry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
      join: 'payment',
    });
    const deletedEntry =
      await this.paymentInvoiceEntryRepository.softDelete(id);

    await this.recalculateInvoiceStatus(existingEntry.invoiceId);

    return deletedEntry;
  }

  @Transactional()
  async softDeleteMany(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.softDelete(id);
    }
  }
}
