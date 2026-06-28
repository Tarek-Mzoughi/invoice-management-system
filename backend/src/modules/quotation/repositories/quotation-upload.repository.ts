import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuotationStorageEntity } from '../entities/quotation-file.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class QuotationUploadRepository extends DatabaseAbstractRepository<QuotationStorageEntity> {
  constructor(
    @InjectRepository(QuotationStorageEntity)
    private readonly quotationUploadRespository: Repository<QuotationStorageEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(quotationUploadRespository, txHost);
  }
}
