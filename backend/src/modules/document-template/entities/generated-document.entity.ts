import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../enums/document-template-document-type.enum';
import { GENERATED_DOCUMENT_STATUS } from '../enums/generated-document-status.enum';
import { DocumentTemplateEntity } from './document-template.entity';
import { DocumentTemplateVersionEntity } from './document-template-version.entity';

@Entity('generated_documents')
export class GeneratedDocumentEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => DocumentTemplateEntity,
    (template) => template.generatedDocuments,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'templateId' })
  template?: DocumentTemplateEntity;

  @Column({ type: 'int', nullable: true })
  templateId?: number;

  @ManyToOne(() => DocumentTemplateVersionEntity, { nullable: true })
  @JoinColumn({ name: 'templateVersionId' })
  templateVersion?: DocumentTemplateVersionEntity;

  @Column({ type: 'int', nullable: true })
  templateVersionId?: number;

  @Column({
    type: 'enum',
    enum: DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
  })
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;

  @Column({ type: 'int', nullable: true })
  sourceDocumentId?: number;

  @ManyToOne(() => CabinetEntity, { nullable: true })
  @JoinColumn({ name: 'cabinetId' })
  cabinet?: CabinetEntity;

  @Column({ type: 'int' })
  cabinetId: number;

  @ManyToOne(() => StorageEntity, { nullable: true })
  @JoinColumn({ name: 'storageId' })
  storage?: StorageEntity;

  @Column({ type: 'int', nullable: true })
  storageId?: number;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 128, default: 'application/pdf' })
  mimeType: string;

  @Column({
    type: 'enum',
    enum: GENERATED_DOCUMENT_STATUS,
    default: GENERATED_DOCUMENT_STATUS.GENERATED,
  })
  status: GENERATED_DOCUMENT_STATUS;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  generatedById?: string;
}
