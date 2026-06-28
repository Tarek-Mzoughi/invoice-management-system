import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReturnNoteMetaDataEntity } from '../entities/return-note-meta-data.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class ReturnNoteMetaDataRepository extends DatabaseAbstractRepository<ReturnNoteMetaDataEntity> {
  constructor(
    @InjectRepository(ReturnNoteMetaDataEntity)
    private readonly returnNoteMetaDataRepository: Repository<ReturnNoteMetaDataEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(returnNoteMetaDataRepository, txHost);
  }
}
