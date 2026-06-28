import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { QuotationEntity } from './quotation.entity';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';

@Entity('quotation-upload')
export class QuotationStorageEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => QuotationEntity)
  @JoinColumn({ name: 'quotationId' })
  quotation: QuotationEntity;

  @Column({ type: 'int' })
  quotationId: number;

  @ManyToOne(() => StorageEntity)
  @JoinColumn({ name: 'uploadId' })
  upload: StorageEntity;

  @Column({ type: 'int' })
  uploadId: number;
}
