import { Injectable } from '@nestjs/common';
import { GoodsIssueNoteUploadRepository } from '../repositories/goods-issue-note-upload.repository';
import { GoodsIssueNoteStorageEntity } from '../entities/goods-issue-note-file.entity';
import { GoodsIssueNoteUploadNotFoundException } from '../errors/goods-issue-note-upload.notfound';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { StorageService } from 'src/shared/storage/services/storage.service';

@Injectable()
export class GoodsIssueNoteStorageService {
  constructor(
    private readonly goodsIssueNoteUploadRepository: GoodsIssueNoteUploadRepository,
    private readonly uploadService: StorageService,
  ) {}

  async findOneById(id: number): Promise<GoodsIssueNoteStorageEntity> {
    const upload = await this.goodsIssueNoteUploadRepository.findOneById(id);
    if (!upload) {
      throw new GoodsIssueNoteUploadNotFoundException();
    }
    return upload;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<GoodsIssueNoteStorageEntity | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const upload = await this.goodsIssueNoteUploadRepository.findOne(
      queryOptions as FindOneOptions<GoodsIssueNoteStorageEntity>,
    );
    if (!upload) return null;
    return upload;
  }

  async findAll(query: IQueryObject): Promise<GoodsIssueNoteStorageEntity[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.goodsIssueNoteUploadRepository.findAll(
      queryOptions as FindManyOptions<GoodsIssueNoteStorageEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<GoodsIssueNoteStorageEntity>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.goodsIssueNoteUploadRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.goodsIssueNoteUploadRepository.findAll(
      queryOptions as FindManyOptions<GoodsIssueNoteStorageEntity>,
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
    goodsIssueNoteId: number,
    uploadId: number,
  ): Promise<GoodsIssueNoteStorageEntity> {
    return this.goodsIssueNoteUploadRepository.save({
      goodsIssueNoteId,
      uploadId,
    });
  }

  async duplicate(
    id: number,
    goodsIssueNoteId: number,
  ): Promise<GoodsIssueNoteStorageEntity> {
    //Find the original goodsIssueNote upload entity
    const originalGoodsIssueNoteUpload = await this.findOneById(id);

    //Use the StorageService to duplicate the file
    const duplicatedUpload = await this.uploadService.duplicate(
      originalGoodsIssueNoteUpload.uploadId,
    );

    //Save the duplicated GoodsIssueNoteStorageEntity
    const duplicatedGoodsIssueNoteUpload =
      await this.goodsIssueNoteUploadRepository.save({
        goodsIssueNoteId: goodsIssueNoteId,
        uploadId: duplicatedUpload.id,
      });

    return duplicatedGoodsIssueNoteUpload;
  }

  async duplicateMany(
    ids: number[],
    goodsIssueNoteId: number,
  ): Promise<GoodsIssueNoteStorageEntity[]> {
    const duplicatedGoodsIssueNoteUploads = await Promise.all(
      ids.map((id) => this.duplicate(id, goodsIssueNoteId)),
    );
    return duplicatedGoodsIssueNoteUploads;
  }

  async softDelete(id: number): Promise<GoodsIssueNoteStorageEntity> {
    const upload = await this.findOneById(id);
    this.uploadService.delete(upload.uploadId);
    this.goodsIssueNoteUploadRepository.softDelete(upload.id);
    return upload;
  }

  async softDeleteMany(
    goodsIssueNoteUploadEntities: GoodsIssueNoteStorageEntity[],
  ): Promise<GoodsIssueNoteStorageEntity[]> {
    this.uploadService.deleteMany(
      goodsIssueNoteUploadEntities.map((qu) => qu.upload.id),
    );
    return this.goodsIssueNoteUploadRepository.softDeleteMany(
      goodsIssueNoteUploadEntities.map((qu) => qu.id),
    );
  }

  async deleteAll() {
    return this.goodsIssueNoteUploadRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.goodsIssueNoteUploadRepository.getTotalCount();
  }
}
