import { Injectable } from '@nestjs/common';
import { CustomerOrderMetaDataEntity } from '../entities/customer-order-meta-data.entity';
import { CustomerOrderMetaDataRepository } from '../repositories/customer-order-meta-data-repository';
import { CustomerOrderMetaDataNotFoundException } from '../errors/customer-order-meta-data.notfound.error';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ResponseCustomerOrderMetaDataDto } from '../dtos/customer-order-meta-data.response.dto';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { CreateCustomerOrderMetaDataDto } from '../dtos/customer-order-meta-data.create.dto';
import { UpdateCustomerOrderMetaDataDto } from '../dtos/customer-order-meta-data.update.dto';

@Injectable()
export class CustomerOrderMetaDataService {
  constructor(
    private readonly customerOrderMetaDataRepository: CustomerOrderMetaDataRepository,
  ) {}

  async findOneById(id: number): Promise<CustomerOrderMetaDataEntity> {
    const data = await this.customerOrderMetaDataRepository.findOneById(id);
    if (!data) {
      throw new CustomerOrderMetaDataNotFoundException();
    }
    return data;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<ResponseCustomerOrderMetaDataDto | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const data = await this.customerOrderMetaDataRepository.findOne(
      queryOptions as FindOneOptions<CustomerOrderMetaDataEntity>,
    );
    if (!data) return null;
    return data;
  }

  async findAll(
    query: IQueryObject,
  ): Promise<ResponseCustomerOrderMetaDataDto[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.customerOrderMetaDataRepository.findAll(
      queryOptions as FindManyOptions<CustomerOrderMetaDataEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<ResponseCustomerOrderMetaDataDto>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.customerOrderMetaDataRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.customerOrderMetaDataRepository.findAll(
      queryOptions as FindManyOptions<CustomerOrderMetaDataEntity>,
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: parseInt(query.page),
        take: parseInt(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async save(
    createCustomerOrderMetaDataDto: CreateCustomerOrderMetaDataDto,
  ): Promise<CustomerOrderMetaDataEntity> {
    return this.customerOrderMetaDataRepository.save(
      createCustomerOrderMetaDataDto,
    );
  }

  async update(
    id: number,
    updateCustomerOrderMetaDataDto: UpdateCustomerOrderMetaDataDto,
  ): Promise<CustomerOrderMetaDataEntity> {
    const data = await this.findOneById(id);
    return this.customerOrderMetaDataRepository.save({
      ...data,
      ...updateCustomerOrderMetaDataDto,
    });
  }

  async duplicate(id: number): Promise<CustomerOrderMetaDataEntity> {
    const existingData = await this.findOneById(id);
    const duplicatedData = { ...existingData, id: undefined };
    return this.customerOrderMetaDataRepository.save(duplicatedData);
  }

  async softDelete(id: number): Promise<CustomerOrderMetaDataEntity> {
    await this.findOneById(id);
    return this.customerOrderMetaDataRepository.softDelete(id);
  }

  async deleteAll() {
    return this.customerOrderMetaDataRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.customerOrderMetaDataRepository.getTotalCount();
  }
}
