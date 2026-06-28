import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerOrderStorageEntity } from '../entities/customer-order-file.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class CustomerOrderUploadRepository extends DatabaseAbstractRepository<CustomerOrderStorageEntity> {
  constructor(
    @InjectRepository(CustomerOrderStorageEntity)
    private readonly customerOrderUploadRespository: Repository<CustomerOrderStorageEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(customerOrderUploadRespository, txHost);
  }
}
