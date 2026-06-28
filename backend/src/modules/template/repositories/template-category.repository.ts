import { Injectable } from '@nestjs/common';
import { TemplateCategoryEntity } from '../entities/template-category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class TemplateCategoryRepository extends DatabaseAbstractRepository<TemplateCategoryEntity> {
  constructor(
    @InjectRepository(TemplateCategoryEntity)
    private readonly templateCategoryRepository: Repository<TemplateCategoryEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(templateCategoryRepository, txHost);
  }
}
