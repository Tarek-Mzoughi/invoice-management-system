import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FirmEntity } from '../entities/firm.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class FirmRepository extends DatabaseAbstractRepository<FirmEntity> {
  constructor(
    @InjectRepository(FirmEntity)
    private readonly firmRepository: Repository<FirmEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(firmRepository, txHost);
  }
}
