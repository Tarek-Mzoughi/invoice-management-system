import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryNoteStorageEntity } from '../entities/delivery-note-file.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class DeliveryNoteUploadRepository extends DatabaseAbstractRepository<DeliveryNoteStorageEntity> {
  constructor(
    @InjectRepository(DeliveryNoteStorageEntity)
    private readonly deliveryNoteUploadRespository: Repository<DeliveryNoteStorageEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(deliveryNoteUploadRespository, txHost);
  }
}
