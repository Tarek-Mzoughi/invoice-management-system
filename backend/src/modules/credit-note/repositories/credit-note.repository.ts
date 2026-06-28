import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { CreditNoteEntity } from '../entities/credit-note.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class CreditNoteRepository extends DatabaseAbstractRepository<CreditNoteEntity> {
  constructor(
    @InjectRepository(CreditNoteEntity)
    private readonly creditNoteRepository: Repository<CreditNoteEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(creditNoteRepository, txHost);
  }
}
