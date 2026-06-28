import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReturnNoteStorageEntity } from '../entities/return-note-file.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class ReturnNoteUploadRepository extends DatabaseAbstractRepository<ReturnNoteStorageEntity> {
  constructor(
    @InjectRepository(ReturnNoteStorageEntity)
    private readonly returnNoteUploadRepository: Repository<ReturnNoteStorageEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(returnNoteUploadRepository, txHost);
  }
}
