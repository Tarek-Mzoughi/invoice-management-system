import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReturnNoteEntity } from './return-note.entity';
import { RETURN_NOTE_STOCK_MOVEMENT_DIRECTION } from '../enums/return-note-stock-movement-direction.enum';

@Entity('return-note_stock_movement')
export class ReturnNoteStockMovementEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ReturnNoteEntity, { nullable: false })
  @JoinColumn({ name: 'returnNoteId' })
  returnNote: ReturnNoteEntity;

  @Column({ type: 'int' })
  returnNoteId: number;

  @ManyToOne(() => ArticleEntity, { nullable: false })
  @JoinColumn({ name: 'articleId' })
  article: ArticleEntity;

  @Column({ type: 'int' })
  articleId: number;

  @Column({ type: 'float', default: 0 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: RETURN_NOTE_STOCK_MOVEMENT_DIRECTION,
  })
  direction: RETURN_NOTE_STOCK_MOVEMENT_DIRECTION;
}
