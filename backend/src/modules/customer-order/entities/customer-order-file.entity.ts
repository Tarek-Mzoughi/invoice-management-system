import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { CustomerOrderEntity } from './customer-order.entity';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';

@Entity('customer-order-upload')
export class CustomerOrderStorageEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CustomerOrderEntity)
  @JoinColumn({ name: 'customerOrderId' })
  customerOrder: CustomerOrderEntity;

  @Column({ type: 'int' })
  customerOrderId: number;

  @ManyToOne(() => StorageEntity)
  @JoinColumn({ name: 'uploadId' })
  upload: StorageEntity;

  @Column({ type: 'int' })
  uploadId: number;
}
