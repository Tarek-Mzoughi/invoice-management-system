import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DOCUMENT_TEMPLATE_ASSET_TYPE } from '../enums/document-template-asset-type.enum';
import { DocumentTemplateEntity } from './document-template.entity';

@Entity('document_template_assets')
export class DocumentTemplateAssetEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DocumentTemplateEntity, (template) => template.assets, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'templateId' })
  template?: DocumentTemplateEntity;

  @Column({ type: 'int', nullable: true })
  templateId?: number;

  @ManyToOne(() => StorageEntity)
  @JoinColumn({ name: 'storageId' })
  storage: StorageEntity;

  @Column({ type: 'int' })
  storageId: number;

  @Column({
    type: 'enum',
    enum: DOCUMENT_TEMPLATE_ASSET_TYPE,
    default: DOCUMENT_TEMPLATE_ASSET_TYPE.IMAGE,
  })
  assetType: DOCUMENT_TEMPLATE_ASSET_TYPE;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;
}
