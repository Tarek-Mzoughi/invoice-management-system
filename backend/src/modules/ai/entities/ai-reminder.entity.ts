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

export type AiReminderStatus = 'pending' | 'sent' | 'cancelled' | 'failed';
export type AiReminderType =
  | 'invoice_followup'
  | 'payment_due'
  | 'quote_followup'
  | 'client_contact'
  | 'custom';

@Entity('ai_reminders')
export class AiReminderEntity extends EntityHelper {
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
  type: AiReminderType;

  @Column({ type: 'varchar', length: 40, default: 'pending' })
  status: AiReminderStatus;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'datetime' })
  scheduledAt: Date;

  @Column({ type: 'datetime', nullable: true })
  sentAt: Date;

  @Column({ type: 'int', nullable: true })
  entityId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  entityType: string;

  @Column({ type: 'json', nullable: true })
  metadataJson: Record<string, unknown>;
}
