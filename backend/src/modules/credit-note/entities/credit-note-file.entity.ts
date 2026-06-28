import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { CreditNoteEntity } from './credit-note.entity';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';

@Entity('credit-note-upload')
export class CreditNoteStorageEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CreditNoteEntity)
  @JoinColumn({ name: 'creditNoteId' })
  creditNote: CreditNoteEntity;

  @Column({ type: 'int' })
  creditNoteId: number;

  @ManyToOne(() => StorageEntity)
  @JoinColumn({ name: 'uploadId' })
  upload: StorageEntity;

  @Column({ type: 'int' })
  uploadId: number;
}
