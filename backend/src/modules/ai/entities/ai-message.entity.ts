import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { AiConversationEntity } from './ai-conversation.entity';
import { AI_MESSAGE_ROLE } from '../enums/ai-message-role.enum';

@Entity('ai_messages')
export class AiMessageEntity extends EntityHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AiConversationEntity, (conv) => conv.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: AiConversationEntity;

  @Column({ type: 'varchar', length: 36 })
  conversationId: string;

  @Column({ type: 'int' })
  cabinetId: number;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  role: AI_MESSAGE_ROLE;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  provider: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  intent: string;

  @Column({ type: 'float', nullable: true })
  confidence: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  riskLevel: string;

  @Column({ type: 'json', nullable: true })
  metadataJson: Record<string, unknown>;
}
