import { BadRequestException, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { FindOneOptions } from 'typeorm';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { CreditNoteService } from 'src/modules/credit-note/services/credit-note.service';
import { CREDIT_NOTE_STATUS } from 'src/modules/credit-note/enums/credit-note-status.enum';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { ciel } from 'src/utils/number.utils';
import { CreatePaymentCreditNoteEntryDto } from '../dtos/payment-credit-note-entry.create.dto';
import { UpdatePaymentCreditNoteEntryDto } from '../dtos/payment-credit-note-entry.update.dto';
import { PaymentCreditNoteEntryEntity } from '../entities/payment-credit-note-entry.entity';
import { PaymentCreditNoteEntryRepository } from '../repositories/payment-credit-note-entry.repository';

@Injectable()
export class PaymentCreditNoteEntryService {
  constructor(
    private readonly paymentCreditNoteEntryRepository: PaymentCreditNoteEntryRepository,
    private readonly creditNoteService: CreditNoteService,
  ) {}

  private roundAmount(value: number, digitsAfterComma = 3) {
    return ciel(value || 0, digitsAfterComma);
  }

  private async recalculateCreditNoteStatus(
    creditNoteId: number,
  ): Promise<void> {
    const creditNote = await this.creditNoteService.findOneByCondition({
      filter: `id||$eq||${creditNoteId}`,
      join: 'currency',
    });

    if (!creditNote) {
      return;
    }

    const entries = await this.paymentCreditNoteEntryRepository.findAll({
      where: { creditNoteId },
    });
    const digitsAfterComma = creditNote.currency?.digitAfterComma || 3;
    const amountPaid = this.roundAmount(
      entries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
      digitsAfterComma,
    );
    const total = this.roundAmount(creditNote.total || 0, digitsAfterComma);
    const status =
      amountPaid <= 0
        ? CREDIT_NOTE_STATUS.Unpaid
        : amountPaid >= total
          ? CREDIT_NOTE_STATUS.Paid
          : CREDIT_NOTE_STATUS.PartiallyPaid;

    await this.creditNoteService.updateFields(creditNote.id, {
      id: creditNote.id,
      amountPaid,
      status,
    });
  }

  async assertCreditNoteCanBeUsed(
    creditNoteId: number,
    amount: number,
    activityType: ACTIVITY_TYPE,
    firmId?: number,
  ) {
    const creditNote = await this.creditNoteService.findOneByCondition({
      filter: `id||$eq||${creditNoteId}`,
      join: 'currency',
    });

    if (!creditNote) {
      throw new BadRequestException('Credit note not found.');
    }

    if (creditNote.activityType !== activityType) {
      throw new BadRequestException(
        'Le paiement et l’avoir doivent appartenir à la même activité.',
      );
    }

    if (firmId && creditNote.firmId !== firmId) {
      throw new BadRequestException(
        'Le paiement et l’avoir doivent appartenir au même partenaire.',
      );
    }

    if (
      ![
        CREDIT_NOTE_STATUS.Unpaid,
        CREDIT_NOTE_STATUS.PartiallyPaid,
        CREDIT_NOTE_STATUS.Validated,
        CREDIT_NOTE_STATUS.Sent,
      ].includes(creditNote.status)
    ) {
      throw new BadRequestException('Only available credit notes can be used.');
    }

    const availableAmount = this.roundAmount(
      (creditNote.total || 0) - (creditNote.amountPaid || 0),
      creditNote.currency?.digitAfterComma || 3,
    );

    if (amount <= 0 || amount > availableAmount + 0.000001) {
      throw new BadRequestException(
        'The used credit note amount exceeds the available credit.',
      );
    }

    return creditNote;
  }

  async assertCreditNoteEntriesCanBeUsed(
    entries: Pick<CreatePaymentCreditNoteEntryDto, 'creditNoteId' | 'amount'>[],
    activityType: ACTIVITY_TYPE,
    firmId?: number,
  ) {
    const usageByCreditNoteId = new Map<number, number>();

    for (const entry of entries) {
      const creditNoteId = Number(entry.creditNoteId);
      const amount = Number(entry.amount || 0);

      if (!creditNoteId || amount <= 0) {
        throw new BadRequestException(
          'Credit note usage entries must reference a credit note and a positive amount.',
        );
      }

      usageByCreditNoteId.set(
        creditNoteId,
        (usageByCreditNoteId.get(creditNoteId) || 0) + amount,
      );
    }

    for (const [creditNoteId, amount] of usageByCreditNoteId.entries()) {
      await this.assertCreditNoteCanBeUsed(
        creditNoteId,
        amount,
        activityType,
        firmId,
      );
    }
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<PaymentCreditNoteEntryEntity | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const entry = await this.paymentCreditNoteEntryRepository.findOne(
      queryOptions as FindOneOptions<PaymentCreditNoteEntryEntity>,
    );
    if (!entry) return null;
    return entry;
  }

  async findOneById(id: number): Promise<PaymentCreditNoteEntryEntity> {
    const entry = await this.paymentCreditNoteEntryRepository.findOneById(id);
    if (!entry) {
      throw new BadRequestException('Payment credit note entry not found.');
    }
    return entry;
  }

  @Transactional()
  async save(
    createPaymentCreditNoteEntryDto: CreatePaymentCreditNoteEntryDto & {
      paymentId: number;
    },
  ): Promise<PaymentCreditNoteEntryEntity> {
    const savedEntry = await this.paymentCreditNoteEntryRepository.save(
      createPaymentCreditNoteEntryDto,
    );

    await this.recalculateCreditNoteStatus(savedEntry.creditNoteId);

    return savedEntry;
  }

  @Transactional()
  async saveMany(
    createPaymentCreditNoteEntryDtos: (CreatePaymentCreditNoteEntryDto & {
      paymentId: number;
    })[],
  ): Promise<PaymentCreditNoteEntryEntity[]> {
    const savedEntries = [];
    for (const dto of createPaymentCreditNoteEntryDtos) {
      const savedEntry = await this.save(dto);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  @Transactional()
  async update(
    id: number,
    updatePaymentCreditNoteEntryDto: UpdatePaymentCreditNoteEntryDto,
  ): Promise<PaymentCreditNoteEntryEntity> {
    const existingEntry = await this.findOneById(id);
    const updatedEntry = await this.paymentCreditNoteEntryRepository.save({
      ...existingEntry,
      ...updatePaymentCreditNoteEntryDto,
    });

    await this.recalculateCreditNoteStatus(existingEntry.creditNoteId);
    await this.recalculateCreditNoteStatus(updatedEntry.creditNoteId);

    return updatedEntry;
  }

  @Transactional()
  async softDelete(id: number): Promise<PaymentCreditNoteEntryEntity> {
    const existingEntry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
    });
    const deletedEntry =
      await this.paymentCreditNoteEntryRepository.softDelete(id);

    if (existingEntry?.creditNoteId) {
      await this.recalculateCreditNoteStatus(existingEntry.creditNoteId);
    }

    return deletedEntry;
  }

  @Transactional()
  async softDeleteMany(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.softDelete(id);
    }
  }
}
