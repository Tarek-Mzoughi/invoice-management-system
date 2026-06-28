import { Injectable } from '@nestjs/common';
import { GoodsIssueNoteMetaDataEntity } from '../entities/goods-issue-note-meta-data.entity';
import { GoodsIssueNoteMetaDataRepository } from '../repositories/goods-issue-note-meta-data-repository';
import { GoodsIssueNoteMetaDataNotFoundException } from '../errors/quoation-meta-data.notfound.error';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ResponseGoodsIssueNoteMetaDataDto } from '../dtos/goods-issue-note-meta-data.response.dto';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { CreateGoodsIssueNoteMetaDataDto } from '../dtos/goods-issue-note-meta-data.create.dto';
import { UpdateGoodsIssueNoteMetaDataDto } from '../dtos/goods-issue-note-meta-data.update.dto';

@Injectable()
export class GoodsIssueNoteMetaDataService {
  constructor(
    private readonly goodsIssueNoteMetaDataRepository: GoodsIssueNoteMetaDataRepository,
  ) {}

  async findOneById(id: number): Promise<GoodsIssueNoteMetaDataEntity> {
    const data = await this.goodsIssueNoteMetaDataRepository.findOneById(id);
    if (!data) {
      throw new GoodsIssueNoteMetaDataNotFoundException();
    }
    return data;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<ResponseGoodsIssueNoteMetaDataDto | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const data = await this.goodsIssueNoteMetaDataRepository.findOne(
      queryOptions as FindOneOptions<GoodsIssueNoteMetaDataEntity>,
    );
    if (!data) return null;
    return data;
  }

  async findAll(
    query: IQueryObject,
  ): Promise<ResponseGoodsIssueNoteMetaDataDto[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.goodsIssueNoteMetaDataRepository.findAll(
      queryOptions as FindManyOptions<GoodsIssueNoteMetaDataEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<ResponseGoodsIssueNoteMetaDataDto>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.goodsIssueNoteMetaDataRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.goodsIssueNoteMetaDataRepository.findAll(
      queryOptions as FindManyOptions<GoodsIssueNoteMetaDataEntity>,
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
    createGoodsIssueNoteMetaDataDto: CreateGoodsIssueNoteMetaDataDto,
  ): Promise<GoodsIssueNoteMetaDataEntity> {
    return this.goodsIssueNoteMetaDataRepository.save(
      createGoodsIssueNoteMetaDataDto,
    );
  }

  async update(
    id: number,
    updateGoodsIssueNoteMetaDataDto: UpdateGoodsIssueNoteMetaDataDto,
  ): Promise<GoodsIssueNoteMetaDataEntity> {
    const data = await this.findOneById(id);
    return this.goodsIssueNoteMetaDataRepository.save({
      ...data,
      ...updateGoodsIssueNoteMetaDataDto,
    });
  }

  async duplicate(id: number): Promise<GoodsIssueNoteMetaDataEntity> {
    const existingData = await this.findOneById(id);
    const duplicatedData = { ...existingData, id: undefined };
    return this.goodsIssueNoteMetaDataRepository.save(duplicatedData);
  }

  async softDelete(id: number): Promise<GoodsIssueNoteMetaDataEntity> {
    await this.findOneById(id);
    return this.goodsIssueNoteMetaDataRepository.softDelete(id);
  }

  async deleteAll() {
    return this.goodsIssueNoteMetaDataRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.goodsIssueNoteMetaDataRepository.getTotalCount();
  }
}
