import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { CabinetTaxConfigurationEntity } from '../entities/cabinet-tax-configuration.entity';

@Injectable()
export class CabinetTaxConfigurationRepository extends DatabaseAbstractRepository<CabinetTaxConfigurationEntity> {
  constructor(
    @InjectRepository(CabinetTaxConfigurationEntity)
    private readonly cabinetTaxConfigurationRepository: Repository<CabinetTaxConfigurationEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(cabinetTaxConfigurationRepository, txHost);
  }

  private getScopedRepository(): Repository<CabinetTaxConfigurationEntity> {
    return (
      this.txHost?.tx?.getRepository(CabinetTaxConfigurationEntity) ||
      this.cabinetTaxConfigurationRepository
    );
  }

  async findByCabinetAndTax(
    cabinetId: number,
    taxId: number,
  ): Promise<CabinetTaxConfigurationEntity | null> {
    return this.getScopedRepository().findOne({
      where: { cabinetId, taxId },
    });
  }

  async findByCabinetAndTaxIds(
    cabinetId: number,
    taxIds: number[],
  ): Promise<CabinetTaxConfigurationEntity[]> {
    if (taxIds.length === 0) {
      return [];
    }

    return this.getScopedRepository()
      .createQueryBuilder('configuration')
      .where('configuration.cabinetId = :cabinetId', { cabinetId })
      .andWhere('configuration.taxId IN (:...taxIds)', { taxIds })
      .getMany();
  }

  async upsertByCabinetAndTax(
    data: QueryDeepPartialEntity<CabinetTaxConfigurationEntity>,
  ) {
    return this.getScopedRepository()
      .createQueryBuilder()
      .insert()
      .into(CabinetTaxConfigurationEntity)
      .values(data)
      .updateEntity(false)
      .orUpdate(['isActive'], ['cabinetId', 'taxId'])
      .execute();
  }

  async upsertManyByCabinetAndTax(
    data: QueryDeepPartialEntity<CabinetTaxConfigurationEntity>[],
    updateExisting: boolean,
  ) {
    if (data.length === 0) {
      return null;
    }

    const query = this.getScopedRepository()
      .createQueryBuilder()
      .insert()
      .into(CabinetTaxConfigurationEntity)
      .values(data)
      .updateEntity(false);

    if (updateExisting) {
      return query.orUpdate(['isActive'], ['cabinetId', 'taxId']).execute();
    }

    return query.orIgnore().execute();
  }
}
