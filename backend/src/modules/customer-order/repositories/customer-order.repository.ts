import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerOrderEntity } from '../entities/customer-order.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class CustomerOrderRepository extends DatabaseAbstractRepository<CustomerOrderEntity> {
  constructor(
    @InjectRepository(CustomerOrderEntity)
    private readonly customerOrderRepository: Repository<CustomerOrderEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(customerOrderRepository, txHost);
  }
}
