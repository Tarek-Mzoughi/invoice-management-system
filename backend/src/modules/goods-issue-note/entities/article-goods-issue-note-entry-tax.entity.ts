import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { ArticleGoodsIssueNoteEntryEntity } from './article-goods-issue-note-entry.entity';
import { TaxEntity } from 'src/modules/tax/entities/tax.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';

@Entity('article-goods-issue-note-entry-tax')
export class ArticleGoodsIssueNoteEntryTaxEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ArticleGoodsIssueNoteEntryEntity)
  @JoinColumn({ name: 'articleGoodsIssueNoteEntryId' })
  articleGoodsIssueNoteEntry: ArticleGoodsIssueNoteEntryEntity;

  @Column({ type: 'int' })
  articleGoodsIssueNoteEntryId: number;

  @ManyToOne(() => TaxEntity)
  @JoinColumn({ name: 'taxId' })
  tax: TaxEntity;

  @Column({ type: 'int' })
  taxId: number;
}
