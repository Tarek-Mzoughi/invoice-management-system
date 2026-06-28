import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Repository } from 'typeorm';
import { DocumentTemplateEntity } from '../entities/document-template.entity';

@Injectable()
export class DocumentTemplateRepository extends DatabaseAbstractRepository<DocumentTemplateEntity> {
  constructor(
    @InjectRepository(DocumentTemplateEntity)
    private readonly documentTemplateRepository: Repository<DocumentTemplateEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(documentTemplateRepository, txHost);
  }
}
