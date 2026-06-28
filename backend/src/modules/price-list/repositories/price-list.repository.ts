import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { PriceListEntity } from '../entities/price-list.entity';

@Injectable()
export class PriceListRepository extends DatabaseAbstractRepository<PriceListEntity> {
  constructor(
    @InjectRepository(PriceListEntity)
    private readonly priceListRepository: Repository<PriceListEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(priceListRepository, txHost);
  }
}
