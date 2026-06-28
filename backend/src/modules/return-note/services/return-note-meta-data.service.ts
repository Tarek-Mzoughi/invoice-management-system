import { Injectable } from '@nestjs/common';
import { ReturnNoteMetaDataEntity } from '../entities/return-note-meta-data.entity';
import { ReturnNoteMetaDataRepository } from '../repositories/return-note-meta-data-repository';
import { ReturnNoteMetaDataNotFoundException } from '../errors/quoation-meta-data.notfound.error';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ResponseReturnNoteMetaDataDto } from '../dtos/return-note-meta-data.response.dto';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { CreateReturnNoteMetaDataDto } from '../dtos/return-note-meta-data.create.dto';
import { UpdateReturnNoteMetaDataDto } from '../dtos/return-note-meta-data.update.dto';

@Injectable()
export class ReturnNoteMetaDataService {
  constructor(
    private readonly returnNoteMetaDataRepository: ReturnNoteMetaDataRepository,
  ) {}

  async findOneById(id: number): Promise<ReturnNoteMetaDataEntity> {
    const data = await this.returnNoteMetaDataRepository.findOneById(id);
    if (!data) {
      throw new ReturnNoteMetaDataNotFoundException();
    }
    return data;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<ResponseReturnNoteMetaDataDto | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const data = await this.returnNoteMetaDataRepository.findOne(
      queryOptions as FindOneOptions<ReturnNoteMetaDataEntity>,
    );
    if (!data) return null;
    return data;
  }

  async findAll(query: IQueryObject): Promise<ResponseReturnNoteMetaDataDto[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.returnNoteMetaDataRepository.findAll(
      queryOptions as FindManyOptions<ReturnNoteMetaDataEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<ResponseReturnNoteMetaDataDto>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.returnNoteMetaDataRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.returnNoteMetaDataRepository.findAll(
      queryOptions as FindManyOptions<ReturnNoteMetaDataEntity>,
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
    createReturnNoteMetaDataDto: CreateReturnNoteMetaDataDto,
  ): Promise<ReturnNoteMetaDataEntity> {
    return this.returnNoteMetaDataRepository.save(createReturnNoteMetaDataDto);
  }

  async update(
    id: number,
    updateReturnNoteMetaDataDto: UpdateReturnNoteMetaDataDto,
  ): Promise<ReturnNoteMetaDataEntity> {
    const data = await this.findOneById(id);
    return this.returnNoteMetaDataRepository.save({
      ...data,
      ...updateReturnNoteMetaDataDto,
    });
  }

  async duplicate(id: number): Promise<ReturnNoteMetaDataEntity> {
    const existingData = await this.findOneById(id);
    const duplicatedData = { ...existingData, id: undefined };
    return this.returnNoteMetaDataRepository.save(duplicatedData);
  }

  async softDelete(id: number): Promise<ReturnNoteMetaDataEntity> {
    await this.findOneById(id);
    return this.returnNoteMetaDataRepository.softDelete(id);
  }

  async deleteAll() {
    return this.returnNoteMetaDataRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.returnNoteMetaDataRepository.getTotalCount();
  }
}
