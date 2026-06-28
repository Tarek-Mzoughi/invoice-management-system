import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { ReturnNoteEntity } from './return-note.entity';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';

@Entity('return-note-upload')
export class ReturnNoteStorageEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ReturnNoteEntity)
  @JoinColumn({ name: 'returnNoteId' })
  returnNote: ReturnNoteEntity;

  @Column({ type: 'int' })
  returnNoteId: number;

  @ManyToOne(() => StorageEntity)
  @JoinColumn({ name: 'uploadId' })
  upload: StorageEntity;

  @Column({ type: 'int' })
  uploadId: number;
}
