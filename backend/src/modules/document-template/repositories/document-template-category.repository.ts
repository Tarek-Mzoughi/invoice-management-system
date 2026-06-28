import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Repository } from 'typeorm';
import { DocumentTemplateCategoryEntity } from '../entities/document-template-category.entity';

@Injectable()
export class DocumentTemplateCategoryRepository extends DatabaseAbstractRepository<DocumentTemplateCategoryEntity> {
  constructor(
    @InjectRepository(DocumentTemplateCategoryEntity)
    private readonly documentTemplateCategoryRepository: Repository<DocumentTemplateCategoryEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(documentTemplateCategoryRepository, txHost);
  }
}
