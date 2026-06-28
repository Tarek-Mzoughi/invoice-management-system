import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryNoteEntity } from '../entities/delivery-note.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class DeliveryNoteRepository extends DatabaseAbstractRepository<DeliveryNoteEntity> {
  constructor(
    @InjectRepository(DeliveryNoteEntity)
    private readonly deliveryNoteRepository: Repository<DeliveryNoteEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(deliveryNoteRepository, txHost);
  }
}
