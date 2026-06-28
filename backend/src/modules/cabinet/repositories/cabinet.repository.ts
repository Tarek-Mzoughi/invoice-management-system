import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { CabinetEntity } from '../entities/cabinet.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class CabinetRepository extends DatabaseAbstractRepository<CabinetEntity> {
  constructor(
    @InjectRepository(CabinetEntity)
    private readonly cabinetRepository: Repository<CabinetEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(cabinetRepository, txHost);
  }
}
