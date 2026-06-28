import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerOrderMetaDataEntity } from '../entities/customer-order-meta-data.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class CustomerOrderMetaDataRepository extends DatabaseAbstractRepository<CustomerOrderMetaDataEntity> {
  constructor(
    @InjectRepository(CustomerOrderMetaDataEntity)
    private readonly customerOrderMetaDataRespository: Repository<CustomerOrderMetaDataEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(customerOrderMetaDataRespository, txHost);
  }
}
