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
import { AI_ACTION_STATUS } from '../enums/ai-action-status.enum';

@Entity('ai_action_logs')
export class AiActionLogEntity extends EntityHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  conversationId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  messageId: string;

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

  @Column({ type: 'varchar', length: 80 })
  actionType: string;

  @Column({ type: 'varchar', length: 40 })
  status: AI_ACTION_STATUS;

  @Column({ type: 'varchar', length: 20 })
  riskLevel: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'json', nullable: true })
  payloadJson: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  validationJson: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  resultJson: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'datetime', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  executedAt: Date;
}
