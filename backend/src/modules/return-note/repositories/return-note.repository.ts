import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReturnNoteEntity } from '../entities/return-note.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class ReturnNoteRepository extends DatabaseAbstractRepository<ReturnNoteEntity> {
  constructor(
    @InjectRepository(ReturnNoteEntity)
    private readonly returnNoteRepository: Repository<ReturnNoteEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(returnNoteRepository, txHost);
  }
}
