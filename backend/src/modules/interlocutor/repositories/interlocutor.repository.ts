import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { InterlocutorEntity } from '../entities/interlocutor.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class InterlocutorRepository extends DatabaseAbstractRepository<InterlocutorEntity> {
  constructor(
    @InjectRepository(InterlocutorEntity)
    private readonly interlocutorRepository: Repository<InterlocutorEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(interlocutorRepository, txHost);
  }
}
