import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { PaymentStorageEntity } from '../entities/payment-file.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class PaymentUploadRepository extends DatabaseAbstractRepository<PaymentStorageEntity> {
  constructor(
    @InjectRepository(PaymentStorageEntity)
    private readonly paymentUploadRepository: Repository<PaymentStorageEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(paymentUploadRepository, txHost);
  }
}
