import { Injectable } from '@nestjs/common';
import { ReturnNoteUploadRepository } from '../repositories/return-note-upload.repository';
import { ReturnNoteStorageEntity } from '../entities/return-note-file.entity';
import { ReturnNoteUploadNotFoundException } from '../errors/return-note-upload.notfound';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { StorageService } from 'src/shared/storage/services/storage.service';

@Injectable()
export class ReturnNoteStorageService {
  constructor(
    private readonly returnNoteUploadRepository: ReturnNoteUploadRepository,
    private readonly uploadService: StorageService,
  ) {}

  async findOneById(id: number): Promise<ReturnNoteStorageEntity> {
    const upload = await this.returnNoteUploadRepository.findOneById(id);
    if (!upload) {
      throw new ReturnNoteUploadNotFoundException();
    }
    return upload;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<ReturnNoteStorageEntity | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const upload = await this.returnNoteUploadRepository.findOne(
      queryOptions as FindOneOptions<ReturnNoteStorageEntity>,
    );
    if (!upload) return null;
    return upload;
  }

  async findAll(query: IQueryObject): Promise<ReturnNoteStorageEntity[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.returnNoteUploadRepository.findAll(
      queryOptions as FindManyOptions<ReturnNoteStorageEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<ReturnNoteStorageEntity>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.returnNoteUploadRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.returnNoteUploadRepository.findAll(
      queryOptions as FindManyOptions<ReturnNoteStorageEntity>,
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
    returnNoteId: number,
    uploadId: number,
  ): Promise<ReturnNoteStorageEntity> {
    return this.returnNoteUploadRepository.save({ returnNoteId, uploadId });
  }

  async duplicate(
    id: number,
    returnNoteId: number,
  ): Promise<ReturnNoteStorageEntity> {
    //Find the original returnNote upload entity
    const originalReturnNoteUpload = await this.findOneById(id);

    //Use the StorageService to duplicate the file
    const duplicatedUpload = await this.uploadService.duplicate(
      originalReturnNoteUpload.uploadId,
    );

    //Save the duplicated ReturnNoteStorageEntity
    const duplicatedReturnNoteUpload =
      await this.returnNoteUploadRepository.save({
        returnNoteId: returnNoteId,
        uploadId: duplicatedUpload.id,
      });

    return duplicatedReturnNoteUpload;
  }

  async duplicateMany(
    ids: number[],
    returnNoteId: number,
  ): Promise<ReturnNoteStorageEntity[]> {
    const duplicatedUploads = [];
    for (const id of ids) {
      const duplicatedUpload = await this.duplicate(id, returnNoteId);
      duplicatedUploads.push(duplicatedUpload);
    }
    return duplicatedUploads;
  }

  async softDelete(id: number): Promise<ReturnNoteStorageEntity> {
    const upload = await this.findOneById(id);
    this.uploadService.delete(upload.uploadId);
    this.returnNoteUploadRepository.softDelete(upload.id);
    return upload;
  }

  async softDeleteMany(
    returnNoteUploadEntities: ReturnNoteStorageEntity[],
  ): Promise<ReturnNoteStorageEntity[]> {
    this.uploadService.deleteMany(
      returnNoteUploadEntities.map((qu) => qu.upload.id),
    );
    return this.returnNoteUploadRepository.softDeleteMany(
      returnNoteUploadEntities.map((qu) => qu.id),
    );
  }

  async deleteAll() {
    return this.returnNoteUploadRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.returnNoteUploadRepository.getTotalCount();
  }
}
