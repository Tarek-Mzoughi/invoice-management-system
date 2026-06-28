import { Injectable } from '@nestjs/common';
import { DeliveryNoteUploadRepository } from '../repositories/delivery-note-upload.repository';
import { DeliveryNoteStorageEntity } from '../entities/delivery-note-file.entity';
import { DeliveryNoteUploadNotFoundException } from '../errors/delivery-note-upload.notfound';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { StorageService } from 'src/shared/storage/services/storage.service';

@Injectable()
export class DeliveryNoteStorageService {
  constructor(
    private readonly deliveryNoteUploadRepository: DeliveryNoteUploadRepository,
    private readonly uploadService: StorageService,
  ) {}

  async findOneById(id: number): Promise<DeliveryNoteStorageEntity> {
    const upload = await this.deliveryNoteUploadRepository.findOneById(id);
    if (!upload) {
      throw new DeliveryNoteUploadNotFoundException();
    }
    return upload;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<DeliveryNoteStorageEntity | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const upload = await this.deliveryNoteUploadRepository.findOne(
      queryOptions as FindOneOptions<DeliveryNoteStorageEntity>,
    );
    if (!upload) return null;
    return upload;
  }

  async findAll(query: IQueryObject): Promise<DeliveryNoteStorageEntity[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.deliveryNoteUploadRepository.findAll(
      queryOptions as FindManyOptions<DeliveryNoteStorageEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<DeliveryNoteStorageEntity>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.deliveryNoteUploadRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.deliveryNoteUploadRepository.findAll(
      queryOptions as FindManyOptions<DeliveryNoteStorageEntity>,
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
    deliveryNoteId: number,
    uploadId: number,
  ): Promise<DeliveryNoteStorageEntity> {
    return this.deliveryNoteUploadRepository.save({ deliveryNoteId, uploadId });
  }

  async duplicate(
    id: number,
    deliveryNoteId: number,
  ): Promise<DeliveryNoteStorageEntity> {
    //Find the original deliveryNote upload entity
    const originalDeliveryNoteUpload = await this.findOneById(id);

    //Use the StorageService to duplicate the file
    const duplicatedUpload = await this.uploadService.duplicate(
      originalDeliveryNoteUpload.uploadId,
    );

    //Save the duplicated DeliveryNoteStorageEntity
    const duplicatedDeliveryNoteUpload =
      await this.deliveryNoteUploadRepository.save({
        deliveryNoteId: deliveryNoteId,
        uploadId: duplicatedUpload.id,
      });

    return duplicatedDeliveryNoteUpload;
  }

  async duplicateMany(
    ids: number[],
    deliveryNoteId: number,
  ): Promise<DeliveryNoteStorageEntity[]> {
    const duplicatedDeliveryNoteUploads = await Promise.all(
      ids.map((id) => this.duplicate(id, deliveryNoteId)),
    );
    return duplicatedDeliveryNoteUploads;
  }

  async softDelete(id: number): Promise<DeliveryNoteStorageEntity> {
    const upload = await this.findOneById(id);
    this.uploadService.delete(upload.uploadId);
    this.deliveryNoteUploadRepository.softDelete(upload.id);
    return upload;
  }

  async softDeleteMany(
    deliveryNoteUploadEntities: DeliveryNoteStorageEntity[],
  ): Promise<DeliveryNoteStorageEntity[]> {
    this.uploadService.deleteMany(
      deliveryNoteUploadEntities.map((qu) => qu.upload.id),
    );
    return this.deliveryNoteUploadRepository.softDeleteMany(
      deliveryNoteUploadEntities.map((qu) => qu.id),
    );
  }

  async deleteAll() {
    return this.deliveryNoteUploadRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.deliveryNoteUploadRepository.getTotalCount();
  }
}
