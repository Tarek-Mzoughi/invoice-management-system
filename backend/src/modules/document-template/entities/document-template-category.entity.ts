import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../enums/document-template-document-type.enum';
import { DocumentTemplateEntity } from './document-template.entity';

@Entity('document_template_categories')
export class DocumentTemplateCategoryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
    nullable: true,
  })
  documentType?: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;

  @ManyToOne(() => CabinetEntity, { nullable: true })
  @JoinColumn({ name: 'cabinetId' })
  cabinet?: CabinetEntity;

  @Column({ type: 'int' })
  cabinetId: number;

  @OneToMany(() => DocumentTemplateEntity, (template) => template.category)
  templates: DocumentTemplateEntity[];
}
