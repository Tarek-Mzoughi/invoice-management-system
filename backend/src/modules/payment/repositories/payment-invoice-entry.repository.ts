import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { PaymentInvoiceEntryEntity } from '../entities/payment-invoice-entry.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class PaymentInvoiceEntryRepository extends DatabaseAbstractRepository<PaymentInvoiceEntryEntity> {
  constructor(
    @InjectRepository(PaymentInvoiceEntryEntity)
    private readonly paymentInvoiceEntryRepository: Repository<PaymentInvoiceEntryEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(paymentInvoiceEntryRepository, txHost);
  }
}
