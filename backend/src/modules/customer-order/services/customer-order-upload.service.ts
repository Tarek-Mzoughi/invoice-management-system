import { Injectable } from '@nestjs/common';
import { CustomerOrderUploadRepository } from '../repositories/customer-order-upload.repository';
import { CustomerOrderStorageEntity } from '../entities/customer-order-file.entity';
import { CustomerOrderUploadNotFoundException } from '../errors/customer-order-upload.notfound';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { StorageService } from 'src/shared/storage/services/storage.service';

@Injectable()
export class CustomerOrderStorageService {
  constructor(
    private readonly customerOrderUploadRepository: CustomerOrderUploadRepository,
    private readonly uploadService: StorageService,
  ) {}

  async findOneById(id: number): Promise<CustomerOrderStorageEntity> {
    const upload = await this.customerOrderUploadRepository.findOneById(id);
    if (!upload) {
      throw new CustomerOrderUploadNotFoundException();
    }
    return upload;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<CustomerOrderStorageEntity | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const upload = await this.customerOrderUploadRepository.findOne(
      queryOptions as FindOneOptions<CustomerOrderStorageEntity>,
    );
    if (!upload) return null;
    return upload;
  }

  async findAll(query: IQueryObject): Promise<CustomerOrderStorageEntity[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.customerOrderUploadRepository.findAll(
      queryOptions as FindManyOptions<CustomerOrderStorageEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<CustomerOrderStorageEntity>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.customerOrderUploadRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.customerOrderUploadRepository.findAll(
      queryOptions as FindManyOptions<CustomerOrderStorageEntity>,
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
    customerOrderId: number,
    uploadId: number,
  ): Promise<CustomerOrderStorageEntity> {
    return this.customerOrderUploadRepository.save({
      customerOrderId,
      uploadId,
    });
  }

  async duplicate(
    id: number,
    customerOrderId: number,
  ): Promise<CustomerOrderStorageEntity> {
    //Find the original customerOrder upload entity
    const originalCustomerOrderUpload = await this.findOneById(id);

    //Use the StorageService to duplicate the file
    const duplicatedUpload = await this.uploadService.duplicate(
      originalCustomerOrderUpload.uploadId,
    );

    //Save the duplicated CustomerOrderStorageEntity
    const duplicatedCustomerOrderUpload =
      await this.customerOrderUploadRepository.save({
        customerOrderId: customerOrderId,
        uploadId: duplicatedUpload.id,
      });

    return duplicatedCustomerOrderUpload;
  }

  async duplicateMany(
    ids: number[],
    customerOrderId: number,
  ): Promise<CustomerOrderStorageEntity[]> {
    const duplicatedCustomerOrderUploads = await Promise.all(
      ids.map((id) => this.duplicate(id, customerOrderId)),
    );
    return duplicatedCustomerOrderUploads;
  }

  async softDelete(id: number): Promise<CustomerOrderStorageEntity> {
    const upload = await this.findOneById(id);
    this.uploadService.delete(upload.uploadId);
    this.customerOrderUploadRepository.softDelete(upload.id);
    return upload;
  }

  async softDeleteMany(
    customerOrderUploadEntities: CustomerOrderStorageEntity[],
  ): Promise<CustomerOrderStorageEntity[]> {
    this.uploadService.deleteMany(
      customerOrderUploadEntities.map((qu) => qu.upload.id),
    );
    return this.customerOrderUploadRepository.softDeleteMany(
      customerOrderUploadEntities.map((qu) => qu.id),
    );
  }

  async deleteAll() {
    return this.customerOrderUploadRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.customerOrderUploadRepository.getTotalCount();
  }
}
