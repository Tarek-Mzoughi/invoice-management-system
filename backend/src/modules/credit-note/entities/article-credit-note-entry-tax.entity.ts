import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { TaxEntity } from 'src/modules/tax/entities/tax.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { ArticleCreditNoteEntryEntity } from './article-credit-note-entry.entity';

@Entity('article_credit_note_entry_tax')
export class ArticleCreditNoteEntryTaxEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ArticleCreditNoteEntryEntity)
  @JoinColumn({ name: 'articleCreditNoteEntryId' })
  articleCreditNoteEntry: ArticleCreditNoteEntryEntity;

  @Column({ type: 'int' })
  articleCreditNoteEntryId: number;

  @ManyToOne(() => TaxEntity)
  @JoinColumn({ name: 'taxId' })
  tax: TaxEntity;

  @Column({ type: 'int' })
  taxId: number;
}
