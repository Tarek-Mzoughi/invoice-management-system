import { Injectable } from '@nestjs/common';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { CreditNoteMetaDataRepository } from '../repositories/credit-note-meta-data.repository';
import { CreditNoteMetaDataEntity } from '../entities/credit-note-meta-data.entity';
import { CreditNoteMetaDataNotFoundException } from '../errors/credit-note-meta-data.notfound.error';
import { ResponseCreditNoteMetaDataDto } from '../dtos/credit-note-meta-data.response.dto';
import { CreateCreditNoteMetaDataDto } from '../dtos/credit-note-meta-data.create.dto';
import { UpdateCreditNoteMetaDataDto } from '../dtos/credit-note-meta-data.update.dto';

@Injectable()
export class CreditNoteMetaDataService {
  constructor(
    private readonly creditNoteMetaDataRepository: CreditNoteMetaDataRepository,
  ) {}

  async findOneById(id: number): Promise<CreditNoteMetaDataEntity> {
    const data = await this.creditNoteMetaDataRepository.findOneById(id);
    if (!data) {
      throw new CreditNoteMetaDataNotFoundException();
    }
    return data;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<ResponseCreditNoteMetaDataDto | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const data = await this.creditNoteMetaDataRepository.findOne(
      queryOptions as FindOneOptions<CreditNoteMetaDataEntity>,
    );
    if (!data) return null;
    return data;
  }

  async findAll(query: IQueryObject): Promise<ResponseCreditNoteMetaDataDto[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.creditNoteMetaDataRepository.findAll(
      queryOptions as FindManyOptions<CreditNoteMetaDataEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<ResponseCreditNoteMetaDataDto>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.creditNoteMetaDataRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.creditNoteMetaDataRepository.findAll(
      queryOptions as FindManyOptions<CreditNoteMetaDataEntity>,
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
    createCreditNoteMetaDataDto: CreateCreditNoteMetaDataDto,
  ): Promise<CreditNoteMetaDataEntity> {
    return this.creditNoteMetaDataRepository.save(createCreditNoteMetaDataDto);
  }

  async update(
    id: number,
    updateCreditNoteMetaDataDto: UpdateCreditNoteMetaDataDto,
  ): Promise<CreditNoteMetaDataEntity> {
    const data = await this.findOneById(id);
    return this.creditNoteMetaDataRepository.save({
      ...data,
      ...updateCreditNoteMetaDataDto,
    });
  }

  async duplicate(id: number): Promise<CreditNoteMetaDataEntity> {
    const existingData = await this.findOneById(id);
    const duplicatedData = { ...existingData, id: undefined };
    return this.creditNoteMetaDataRepository.save(duplicatedData);
  }

  async softDelete(id: number): Promise<CreditNoteMetaDataEntity> {
    await this.findOneById(id);
    return this.creditNoteMetaDataRepository.softDelete(id);
  }

  async deleteAll() {
    return this.creditNoteMetaDataRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.creditNoteMetaDataRepository.getTotalCount();
  }
}
