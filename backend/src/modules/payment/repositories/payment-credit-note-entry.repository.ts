import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { PaymentCreditNoteEntryEntity } from '../entities/payment-credit-note-entry.entity';

@Injectable()
export class PaymentCreditNoteEntryRepository extends DatabaseAbstractRepository<PaymentCreditNoteEntryEntity> {
  constructor(
    @InjectRepository(PaymentCreditNoteEntryEntity)
    private readonly paymentCreditNoteEntryRepository: Repository<PaymentCreditNoteEntryEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(paymentCreditNoteEntryRepository, txHost);
  }
}
