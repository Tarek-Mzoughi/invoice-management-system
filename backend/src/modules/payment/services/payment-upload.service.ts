import { Injectable } from '@nestjs/common';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { PaymentUploadRepository } from '../repositories/payment.repository';
import { PaymentUploadNotFoundException } from '../errors/payment-upload.notfound.error';
import { PaymentStorageEntity } from '../entities/payment-file.entity';
import { StorageService } from 'src/shared/storage/services/storage.service';

@Injectable()
export class PaymentStorageService {
  constructor(
    private readonly paymentUploadRepository: PaymentUploadRepository,
    private readonly uploadService: StorageService,
  ) {}

  async findOneById(id: number): Promise<PaymentStorageEntity> {
    const upload = await this.paymentUploadRepository.findOneById(id);
    if (!upload) {
      throw new PaymentUploadNotFoundException();
    }
    return upload;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<PaymentStorageEntity | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const upload = await this.paymentUploadRepository.findOne(
      queryOptions as FindOneOptions<PaymentStorageEntity>,
    );
    if (!upload) return null;
    return upload;
  }

  async findAll(query: IQueryObject): Promise<PaymentStorageEntity[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return await this.paymentUploadRepository.findAll(
      queryOptions as FindManyOptions<PaymentStorageEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<PaymentStorageEntity>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const count = await this.paymentUploadRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.paymentUploadRepository.findAll(
      queryOptions as FindManyOptions<PaymentStorageEntity>,
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
    paymentId: number,
    uploadId: number,
  ): Promise<PaymentStorageEntity> {
    return this.paymentUploadRepository.save({ paymentId, uploadId });
  }

  async duplicate(
    id: number,
    paymentId: number,
  ): Promise<PaymentStorageEntity> {
    //Find the original payment upload entity
    const originalPaymentUpload = await this.findOneById(id);

    //Use the StorageService to duplicate the file
    const duplicatedUpload = await this.uploadService.duplicate(
      originalPaymentUpload.uploadId,
    );

    //Save the duplicated PaymentStorageEntity
    const duplicatedPaymentUpload = await this.paymentUploadRepository.save({
      paymentId,
      uploadId: duplicatedUpload.id,
    });

    return duplicatedPaymentUpload;
  }

  async duplicateMany(
    ids: number[],
    paymentId: number,
  ): Promise<PaymentStorageEntity[]> {
    const duplicatedPaymentUploads = await Promise.all(
      ids.map((id) => this.duplicate(id, paymentId)),
    );
    return duplicatedPaymentUploads;
  }

  async softDelete(id: number): Promise<PaymentStorageEntity> {
    const upload = await this.findOneById(id);
    this.uploadService.delete(upload.uploadId);
    this.paymentUploadRepository.softDelete(upload.id);
    return upload;
  }

  async softDeleteMany(
    quotationUploadEntities: PaymentStorageEntity[],
  ): Promise<PaymentStorageEntity[]> {
    this.uploadService.deleteMany(
      quotationUploadEntities.map((qu) => qu.upload.id),
    );
    return this.paymentUploadRepository.softDeleteMany(
      quotationUploadEntities.map((qu) => qu.id),
    );
  }

  async deleteAll() {
    return this.paymentUploadRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.paymentUploadRepository.getTotalCount();
  }
}
