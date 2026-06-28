import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GoodsIssueNoteEntity } from './goods-issue-note.entity';
import { GOODS_ISSUE_NOTE_STOCK_MOVEMENT_DIRECTION } from '../enums/goods-issue-note-stock-movement-direction.enum';

@Entity('goodsIssueNote_stock_movement')
export class GoodsIssueNoteStockMovementEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => GoodsIssueNoteEntity, { nullable: false })
  @JoinColumn({ name: 'goodsIssueNoteId' })
  goodsIssueNote: GoodsIssueNoteEntity;

  @Column({ type: 'int' })
  goodsIssueNoteId: number;

  @ManyToOne(() => ArticleEntity, { nullable: false })
  @JoinColumn({ name: 'articleId' })
  article: ArticleEntity;

  @Column({ type: 'int' })
  articleId: number;

  @Column({ type: 'float', default: 0 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: GOODS_ISSUE_NOTE_STOCK_MOVEMENT_DIRECTION,
  })
  direction: GOODS_ISSUE_NOTE_STOCK_MOVEMENT_DIRECTION;
}
