import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../enums/document-template-document-type.enum';
import { DOCUMENT_TEMPLATE_STATUS } from '../enums/document-template-status.enum';
import { DocumentTemplateAssetEntity } from './document-template-asset.entity';
import { DocumentTemplateCategoryEntity } from './document-template-category.entity';
import { DocumentTemplateVersionEntity } from './document-template-version.entity';
import { GeneratedDocumentEntity } from './generated-document.entity';

@Entity('document_templates')
export class DocumentTemplateEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({
    type: 'enum',
    enum: DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
  })
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;

  @Column({
    type: 'enum',
    enum: DOCUMENT_TEMPLATE_STATUS,
    default: DOCUMENT_TEMPLATE_STATUS.DRAFT,
  })
  status: DOCUMENT_TEMPLATE_STATUS;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'int' })
  versionNumber: number;

  @Column({ type: 'json', nullable: true })
  templateSchema?: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  pageSettings?: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  variablesConfig?: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @ManyToOne(() => StorageEntity, { nullable: true })
  @JoinColumn({ name: 'thumbnailStorageId' })
  thumbnailStorage?: StorageEntity;

  @Column({ type: 'int', nullable: true })
  thumbnailStorageId?: number;

  @ManyToOne(
    () => DocumentTemplateCategoryEntity,
    (category) => category.templates,
    { nullable: true },
  )
  @JoinColumn({ name: 'categoryId' })
  category?: DocumentTemplateCategoryEntity;

  @Column({ type: 'int', nullable: true })
  categoryId?: number;

  @ManyToOne(() => CabinetEntity, { nullable: true })
  @JoinColumn({ name: 'cabinetId' })
  cabinet?: CabinetEntity;

  @Column({ type: 'int' })
  cabinetId: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  createdById?: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  updatedById?: string;

  @OneToMany(() => DocumentTemplateVersionEntity, (version) => version.template)
  versions: DocumentTemplateVersionEntity[];

  @OneToMany(() => DocumentTemplateAssetEntity, (asset) => asset.template)
  assets: DocumentTemplateAssetEntity[];

  @OneToMany(
    () => GeneratedDocumentEntity,
    (generatedDocument) => generatedDocument.template,
  )
  generatedDocuments: GeneratedDocumentEntity[];
}
