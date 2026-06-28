import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { UserEntity } from 'src/modules/user-management/entities/user.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { AiMessageEntity } from './ai-message.entity';

@Entity('ai_conversations')
export class AiConversationEntity extends EntityHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 30, default: 'OPEN' })
  status: string;

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

  @Column({ type: 'json', nullable: true })
  metadataJson: Record<string, unknown>;

  @OneToMany(() => AiMessageEntity, (message) => message.conversation)
  messages: AiMessageEntity[];
}
