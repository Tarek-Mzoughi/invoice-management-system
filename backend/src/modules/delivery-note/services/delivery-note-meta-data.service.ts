import { Injectable } from '@nestjs/common';
import { DeliveryNoteMetaDataEntity } from '../entities/delivery-note-meta-data.entity';
import { DeliveryNoteMetaDataRepository } from '../repositories/delivery-note-meta-data-repository';
import { DeliveryNoteMetaDataNotFoundException } from '../errors/quoation-meta-data.notfound.error';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ResponseDeliveryNoteMetaDataDto } from '../dtos/delivery-note-meta-data.response.dto';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { CreateDeliveryNoteMetaDataDto } from '../dtos/delivery-note-meta-data.create.dto';
import { UpdateDeliveryNoteMetaDataDto } from '../dtos/delivery-note-meta-data.update.dto';

@Injectable()
export class DeliveryNoteMetaDataService {
  constructor(
    private readonly deliveryNoteMetaDataRepository: DeliveryNoteMetaDataRepository,
  ) {}

  async findOneById(id: number): Promise<DeliveryNoteMetaDataEntity> {
    const data = await this.deliveryNoteMetaDataRepository.findOneById(id);
    if (!data) {
      throw new DeliveryNoteMetaDataNotFoundException();
    }
    return data;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<ResponseDeliveryNoteMetaDataDto | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const data = await this.deliveryNoteMetaDataRepository.findOne(
      queryOptions as FindOneOptions<DeliveryNoteMetaDataEntity>,
    );
    if (!data) return null;
    return data;
  }

  async findAll(
    query: IQueryObject,
  ): Promise<ResponseDeliveryNoteMetaDataDto[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.deliveryNoteMetaDataRepository.findAll(
      queryOptions as FindManyOptions<DeliveryNoteMetaDataEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<ResponseDeliveryNoteMetaDataDto>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.deliveryNoteMetaDataRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.deliveryNoteMetaDataRepository.findAll(
      queryOptions as FindManyOptions<DeliveryNoteMetaDataEntity>,
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
    createDeliveryNoteMetaDataDto: CreateDeliveryNoteMetaDataDto,
  ): Promise<DeliveryNoteMetaDataEntity> {
    return this.deliveryNoteMetaDataRepository.save(
      createDeliveryNoteMetaDataDto,
    );
  }

  async update(
    id: number,
    updateDeliveryNoteMetaDataDto: UpdateDeliveryNoteMetaDataDto,
  ): Promise<DeliveryNoteMetaDataEntity> {
    const data = await this.findOneById(id);
    return this.deliveryNoteMetaDataRepository.save({
      ...data,
      ...updateDeliveryNoteMetaDataDto,
    });
  }

  async duplicate(id: number): Promise<DeliveryNoteMetaDataEntity> {
    const existingData = await this.findOneById(id);
    const duplicatedData = { ...existingData, id: undefined };
    return this.deliveryNoteMetaDataRepository.save(duplicatedData);
  }

  async softDelete(id: number): Promise<DeliveryNoteMetaDataEntity> {
    await this.findOneById(id);
    return this.deliveryNoteMetaDataRepository.softDelete(id);
  }

  async deleteAll() {
    return this.deliveryNoteMetaDataRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.deliveryNoteMetaDataRepository.getTotalCount();
  }
}
