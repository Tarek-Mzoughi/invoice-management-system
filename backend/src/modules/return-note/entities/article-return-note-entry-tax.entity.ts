import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { ArticleReturnNoteEntryEntity } from './article-return-note-entry.entity';
import { TaxEntity } from 'src/modules/tax/entities/tax.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';

@Entity('article_return_note_entry_tax')
export class ArticleReturnNoteEntryTaxEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ArticleReturnNoteEntryEntity)
  @JoinColumn({ name: 'articleReturnNoteEntryId' })
  articleReturnNoteEntry: ArticleReturnNoteEntryEntity;

  @Column({ type: 'int' })
  articleReturnNoteEntryId: number;

  @ManyToOne(() => TaxEntity)
  @JoinColumn({ name: 'taxId' })
  tax: TaxEntity;

  @Column({ type: 'int' })
  taxId: number;
}
