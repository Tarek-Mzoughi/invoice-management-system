import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DOCUMENT_TEMPLATE_STATUS } from '../enums/document-template-status.enum';
import { DocumentTemplateEntity } from './document-template.entity';

@Entity('document_template_versions')
export class DocumentTemplateVersionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DocumentTemplateEntity, (template) => template.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'templateId' })
  template: DocumentTemplateEntity;

  @Column({ type: 'int' })
  templateId: number;

  @Column({ type: 'int' })
  versionNumber: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: DOCUMENT_TEMPLATE_STATUS,
    default: DOCUMENT_TEMPLATE_STATUS.DRAFT,
  })
  status: DOCUMENT_TEMPLATE_STATUS;

  @Column({ type: 'json', nullable: true })
  templateSchema?: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  pageSettings?: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  variablesConfig?: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  changeDescription?: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  createdById?: string;
}
