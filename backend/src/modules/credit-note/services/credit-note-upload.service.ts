import { Injectable } from '@nestjs/common';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { CreditNoteUploadRepository } from '../repositories/credit-note-upload.repository';
import { CreditNoteStorageEntity } from '../entities/credit-note-file.entity';
import { CreditNoteUploadNotFoundException } from '../errors/credit-note-upload.notfound';
import { StorageService } from 'src/shared/storage/services/storage.service';

@Injectable()
export class CreditNoteStorageService {
  constructor(
    private readonly creditNoteUploadRepository: CreditNoteUploadRepository,
    private readonly uploadService: StorageService,
  ) {}

  async findOneById(id: number): Promise<CreditNoteStorageEntity> {
    const upload = await this.creditNoteUploadRepository.findOneById(id);
    if (!upload) {
      throw new CreditNoteUploadNotFoundException();
    }
    return upload;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<CreditNoteStorageEntity | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const upload = await this.creditNoteUploadRepository.findOne(
      queryOptions as FindOneOptions<CreditNoteStorageEntity>,
    );
    if (!upload) return null;
    return upload;
  }

  async findAll(query: IQueryObject): Promise<CreditNoteStorageEntity[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.creditNoteUploadRepository.findAll(
      queryOptions as FindManyOptions<CreditNoteStorageEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<CreditNoteStorageEntity>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.creditNoteUploadRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.creditNoteUploadRepository.findAll(
      queryOptions as FindManyOptions<CreditNoteStorageEntity>,
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
    creditNoteId: number,
    uploadId: number,
  ): Promise<CreditNoteStorageEntity> {
    return this.creditNoteUploadRepository.save({ creditNoteId, uploadId });
  }

  async duplicate(
    id: number,
    creditNoteId: number,
  ): Promise<CreditNoteStorageEntity> {
    //Find the original creditNote upload entity
    const originalCreditNoteUpload = await this.findOneById(id);

    //Use the StorageService to duplicate the file
    const duplicatedUpload = await this.uploadService.duplicate(
      originalCreditNoteUpload.uploadId,
    );

    //Save the duplicated CreditNoteStorageEntity
    const duplicatedCreditNoteUpload =
      await this.creditNoteUploadRepository.save({
        creditNoteId: creditNoteId,
        uploadId: duplicatedUpload.id,
      });

    return duplicatedCreditNoteUpload;
  }

  async duplicateMany(
    ids: number[],
    creditNoteId: number,
  ): Promise<CreditNoteStorageEntity[]> {
    const duplicatedCreditNoteUploads = await Promise.all(
      ids.map((id) => this.duplicate(id, creditNoteId)),
    );
    return duplicatedCreditNoteUploads;
  }

  async softDelete(id: number): Promise<CreditNoteStorageEntity> {
    const upload = await this.findOneById(id);
    this.uploadService.delete(upload.uploadId);
    this.creditNoteUploadRepository.softDelete(upload.id);
    return upload;
  }

  async softDeleteMany(
    creditNoteUploadEntities: CreditNoteStorageEntity[],
  ): Promise<CreditNoteStorageEntity[]> {
    this.uploadService.deleteMany(
      creditNoteUploadEntities.map((qu) => qu.upload.id),
    );
    return this.creditNoteUploadRepository.softDeleteMany(
      creditNoteUploadEntities.map((qu) => qu.id),
    );
  }

  async deleteAll() {
    return this.creditNoteUploadRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.creditNoteUploadRepository.getTotalCount();
  }
}
