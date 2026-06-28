import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Repository } from 'typeorm';
import { DocumentTemplateVersionEntity } from '../entities/document-template-version.entity';

@Injectable()
export class DocumentTemplateVersionRepository extends DatabaseAbstractRepository<DocumentTemplateVersionEntity> {
  constructor(
    @InjectRepository(DocumentTemplateVersionEntity)
    private readonly documentTemplateVersionRepository: Repository<DocumentTemplateVersionEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(documentTemplateVersionRepository, txHost);
  }
}
