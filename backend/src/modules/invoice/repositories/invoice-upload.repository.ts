import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { InvoiceStorageEntity } from '../entities/invoice-file.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class InvoiceUploadRepository extends DatabaseAbstractRepository<InvoiceStorageEntity> {
  constructor(
    @InjectRepository(InvoiceStorageEntity)
    private readonly invoiceUploadRespository: Repository<InvoiceStorageEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(invoiceUploadRespository, txHost);
  }
}
