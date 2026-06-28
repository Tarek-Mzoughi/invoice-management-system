import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { CreditNoteStorageEntity } from '../entities/credit-note-file.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class CreditNoteUploadRepository extends DatabaseAbstractRepository<CreditNoteStorageEntity> {
  constructor(
    @InjectRepository(CreditNoteStorageEntity)
    private readonly creditNoteUploadRespository: Repository<CreditNoteStorageEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(creditNoteUploadRespository, txHost);
  }
}
