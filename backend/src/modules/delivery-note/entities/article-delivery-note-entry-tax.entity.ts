import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { ArticleDeliveryNoteEntryEntity } from './article-delivery-note-entry.entity';
import { TaxEntity } from 'src/modules/tax/entities/tax.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';

@Entity('article-delivery-note-entry-tax')
export class ArticleDeliveryNoteEntryTaxEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ArticleDeliveryNoteEntryEntity)
  @JoinColumn({ name: 'articleDeliveryNoteEntryId' })
  articleDeliveryNoteEntry: ArticleDeliveryNoteEntryEntity;

  @Column({ type: 'int' })
  articleDeliveryNoteEntryId: number;

  @ManyToOne(() => TaxEntity)
  @JoinColumn({ name: 'taxId' })
  tax: TaxEntity;

  @Column({ type: 'int' })
  taxId: number;
}
