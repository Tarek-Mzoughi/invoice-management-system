import { DISCOUNT_TYPES } from 'src/app/enums/discount-types.enum';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ArticleGoodsIssueNoteEntryTaxEntity } from './article-goods-issue-note-entry-tax.entity';
import { GoodsIssueNoteEntity } from './goods-issue-note.entity';

@Entity('article-goods-issue-note-entry')
export class ArticleGoodsIssueNoteEntryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float', nullable: true })
  unit_price: number;

  @Column({ type: 'float', nullable: true })
  quantity: number;

  @Column({ type: 'float', nullable: true })
  discount: number;

  @Column({ type: 'enum', enum: DISCOUNT_TYPES, nullable: true })
  discount_type: DISCOUNT_TYPES;

  @Column({ type: 'float', nullable: true })
  subTotal: number;

  @Column({ type: 'float', nullable: true })
  total: number;

  @ManyToOne(() => ArticleEntity)
  @JoinColumn({ name: 'articleId' })
  article: ArticleEntity;

  @Column({ type: 'int', nullable: true })
  articleId: number;

  @ManyToOne(() => GoodsIssueNoteEntity)
  @JoinColumn({ name: 'goodsIssueNoteId' })
  goodsIssueNote: GoodsIssueNoteEntity;

  @Column({ type: 'int', nullable: true })
  goodsIssueNoteId: number;

  @OneToMany(
    () => ArticleGoodsIssueNoteEntryTaxEntity,
    (articleGoodsIssueNoteEntryTax) =>
      articleGoodsIssueNoteEntryTax.articleGoodsIssueNoteEntry,
  )
  articleGoodsIssueNoteEntryTaxes: ArticleGoodsIssueNoteEntryTaxEntity[];
}
