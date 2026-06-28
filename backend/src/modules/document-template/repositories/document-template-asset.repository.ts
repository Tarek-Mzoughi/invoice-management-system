import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Repository } from 'typeorm';
import { DocumentTemplateAssetEntity } from '../entities/document-template-asset.entity';

@Injectable()
export class DocumentTemplateAssetRepository extends DatabaseAbstractRepository<DocumentTemplateAssetEntity> {
  constructor(
    @InjectRepository(DocumentTemplateAssetEntity)
    private readonly documentTemplateAssetRepository: Repository<DocumentTemplateAssetEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(documentTemplateAssetRepository, txHost);
  }
}
