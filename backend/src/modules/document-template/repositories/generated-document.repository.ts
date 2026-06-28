import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Repository } from 'typeorm';
import { GeneratedDocumentEntity } from '../entities/generated-document.entity';

@Injectable()
export class GeneratedDocumentRepository extends DatabaseAbstractRepository<GeneratedDocumentEntity> {
  constructor(
    @InjectRepository(GeneratedDocumentEntity)
    private readonly generatedDocumentRepository: Repository<GeneratedDocumentEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(generatedDocumentRepository, txHost);
  }
}
