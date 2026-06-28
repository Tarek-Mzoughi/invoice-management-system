import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { DeliveryNoteEntity } from './delivery-note.entity';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';

@Entity('delivery-note-upload')
export class DeliveryNoteStorageEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DeliveryNoteEntity)
  @JoinColumn({ name: 'deliveryNoteId' })
  deliveryNote: DeliveryNoteEntity;

  @Column({ type: 'int' })
  deliveryNoteId: number;

  @ManyToOne(() => StorageEntity)
  @JoinColumn({ name: 'uploadId' })
  upload: StorageEntity;

  @Column({ type: 'int' })
  uploadId: number;
}
