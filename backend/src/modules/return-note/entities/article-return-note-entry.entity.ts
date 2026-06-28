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
import { ArticleReturnNoteEntryTaxEntity } from './article-return-note-entry-tax.entity';
import { ReturnNoteEntity } from './return-note.entity';

@Entity('article_return_note_entry')
export class ArticleReturnNoteEntryEntity extends EntityHelper {
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

  @ManyToOne(() => ReturnNoteEntity)
  @JoinColumn({ name: 'returnNoteId' })
  returnNote: ReturnNoteEntity;

  @Column({ type: 'int', nullable: true })
  returnNoteId: number;

  @OneToMany(
    () => ArticleReturnNoteEntryTaxEntity,
    (articleReturnNoteEntryTax) =>
      articleReturnNoteEntryTax.articleReturnNoteEntry,
  )
  articleReturnNoteEntryTaxes: ArticleReturnNoteEntryTaxEntity[];
}
