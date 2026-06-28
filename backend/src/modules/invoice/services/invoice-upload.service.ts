import { Injectable } from '@nestjs/common';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { InvoiceUploadRepository } from '../repositories/invoice-upload.repository';
import { InvoiceStorageEntity } from '../entities/invoice-file.entity';
import { InvoiceUploadNotFoundException } from '../errors/invoice-upload.notfound';
import { StorageService } from 'src/shared/storage/services/storage.service';

@Injectable()
export class InvoiceStorageService {
  constructor(
    private readonly invoiceUploadRepository: InvoiceUploadRepository,
    private readonly uploadService: StorageService,
  ) {}

  async findOneById(id: number): Promise<InvoiceStorageEntity> {
    const upload = await this.invoiceUploadRepository.findOneById(id);
    if (!upload) {
      throw new InvoiceUploadNotFoundException();
    }
    return upload;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<InvoiceStorageEntity | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const upload = await this.invoiceUploadRepository.findOne(
      queryOptions as FindOneOptions<InvoiceStorageEntity>,
    );
    if (!upload) return null;
    return upload;
  }

  async findAll(query: IQueryObject): Promise<InvoiceStorageEntity[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.invoiceUploadRepository.findAll(
      queryOptions as FindManyOptions<InvoiceStorageEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<InvoiceStorageEntity>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.invoiceUploadRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.invoiceUploadRepository.findAll(
      queryOptions as FindManyOptions<InvoiceStorageEntity>,
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
    invoiceId: number,
    uploadId: number,
  ): Promise<InvoiceStorageEntity> {
    return this.invoiceUploadRepository.save({ invoiceId, uploadId });
  }

  async duplicate(
    id: number,
    invoiceId: number,
  ): Promise<InvoiceStorageEntity> {
    //Find the original invoice upload entity
    const originalInvoiceUpload = await this.findOneById(id);

    //Use the StorageService to duplicate the file
    const duplicatedUpload = await this.uploadService.duplicate(
      originalInvoiceUpload.uploadId,
    );

    //Save the duplicated InvoiceStorageEntity
    const duplicatedInvoiceUpload = await this.invoiceUploadRepository.save({
      invoiceId: invoiceId,
      uploadId: duplicatedUpload.id,
    });

    return duplicatedInvoiceUpload;
  }

  async duplicateMany(
    ids: number[],
    invoiceId: number,
  ): Promise<InvoiceStorageEntity[]> {
    const duplicatedInvoiceUploads = await Promise.all(
      ids.map((id) => this.duplicate(id, invoiceId)),
    );
    return duplicatedInvoiceUploads;
  }

  async softDelete(id: number): Promise<InvoiceStorageEntity> {
    const upload = await this.findOneById(id);
    this.uploadService.delete(upload.uploadId);
    this.invoiceUploadRepository.softDelete(upload.id);
    return upload;
  }

  async softDeleteMany(
    invoiceUploadEntities: InvoiceStorageEntity[],
  ): Promise<InvoiceStorageEntity[]> {
    this.uploadService.deleteMany(
      invoiceUploadEntities.map((qu) => qu.upload.id),
    );
    return this.invoiceUploadRepository.softDeleteMany(
      invoiceUploadEntities.map((qu) => qu.id),
    );
  }

  async deleteAll() {
    return this.invoiceUploadRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.invoiceUploadRepository.getTotalCount();
  }
}
