import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { GoodsIssueNoteEntity } from './goods-issue-note.entity';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';

@Entity('goods-issue-note-upload')
export class GoodsIssueNoteStorageEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => GoodsIssueNoteEntity)
  @JoinColumn({ name: 'goodsIssueNoteId' })
  goodsIssueNote: GoodsIssueNoteEntity;

  @Column({ type: 'int' })
  goodsIssueNoteId: number;

  @ManyToOne(() => StorageEntity)
  @JoinColumn({ name: 'uploadId' })
  upload: StorageEntity;

  @Column({ type: 'int' })
  uploadId: number;
}
