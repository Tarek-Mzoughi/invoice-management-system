import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { UserEntity } from 'src/modules/user-management/entities/user.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';

export type AiNotificationType =
  | 'action_executed'
  | 'action_failed'
  | 'invoice_overdue'
  | 'payment_received'
  | 'reminder'
  | 'insight'
  | 'info';

export type AiNotificationPriority = 'low' | 'medium' | 'high';

@Entity('ai_notifications')
export class AiNotificationEntity extends EntityHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => CabinetEntity, { nullable: true })
  @JoinColumn({ name: 'cabinetId' })
  cabinet: CabinetEntity;

  @Column({ type: 'int' })
  cabinetId: number;

  @Column({ type: 'varchar', length: 50 })
  type: AiNotificationType;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  priority: AiNotificationPriority;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'json', nullable: true })
  metadataJson: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  actionUrl: string;
}
