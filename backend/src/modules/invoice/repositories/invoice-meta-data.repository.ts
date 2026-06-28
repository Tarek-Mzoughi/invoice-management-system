import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { InvoiceMetaDataEntity } from '../entities/invoice-meta-data.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class InvoiceMetaDataRepository extends DatabaseAbstractRepository<InvoiceMetaDataEntity> {
  constructor(
    @InjectRepository(InvoiceMetaDataEntity)
    private readonly invoiceMetaDataRespository: Repository<InvoiceMetaDataEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(invoiceMetaDataRespository, txHost);
  }
}
