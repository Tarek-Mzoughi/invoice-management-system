import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryNoteMetaDataEntity } from '../entities/delivery-note-meta-data.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class DeliveryNoteMetaDataRepository extends DatabaseAbstractRepository<DeliveryNoteMetaDataEntity> {
  constructor(
    @InjectRepository(DeliveryNoteMetaDataEntity)
    private readonly deliveryNoteMetaDataRespository: Repository<DeliveryNoteMetaDataEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(deliveryNoteMetaDataRespository, txHost);
  }
}
