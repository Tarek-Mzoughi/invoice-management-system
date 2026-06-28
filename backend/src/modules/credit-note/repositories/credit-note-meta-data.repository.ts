import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { CreditNoteMetaDataEntity } from '../entities/credit-note-meta-data.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class CreditNoteMetaDataRepository extends DatabaseAbstractRepository<CreditNoteMetaDataEntity> {
  constructor(
    @InjectRepository(CreditNoteMetaDataEntity)
    private readonly creditNoteMetaDataRespository: Repository<CreditNoteMetaDataEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(creditNoteMetaDataRespository, txHost);
  }
}
