import { Injectable } from '@nestjs/common';
import { AiActionLogRepository } from '../repositories/ai-action-log.repository';
import { AiConversationRepository } from '../repositories/ai-conversation.repository';
import { AiMessageRepository } from '../repositories/ai-message.repository';
import { AiActionLogEntity } from '../entities/ai-action-log.entity';
import { AiConversationEntity } from '../entities/ai-conversation.entity';
import { AiMessageEntity } from '../entities/ai-message.entity';
import { AI_ACTION_STATUS } from '../enums/ai-action-status.enum';
import { AI_INTENT } from '../enums/ai-intent.enum';
import { AI_MESSAGE_ROLE } from '../enums/ai-message-role.enum';

@Injectable()
export class AiAuditService {
  constructor(
    private readonly actionLogRepo: AiActionLogRepository,
    private readonly conversationRepo: AiConversationRepository,
    private readonly messageRepo: AiMessageRepository,
  ) {}

  async getOrCreateConversation(
    conversationId: string | undefined,
    userId: string,
    cabinetId: number,
    title?: string,
  ): Promise<AiConversationEntity> {
    if (conversationId) {
      const existing = await this.conversationRepo.findOne({
        where: { id: conversationId, userId, cabinetId },
      });
      if (existing) return existing;
    }

    return this.conversationRepo.save({
      userId,
      cabinetId,
      title: title ?? 'Nouvelle conversation',
      status: 'OPEN',
    });
  }

  async saveMessage(
    conversationId: string,
    cabinetId: number,
    userId: string,
    role: AI_MESSAGE_ROLE,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<AiMessageEntity> {
    return this.messageRepo.save({
      conversationId,
      cabinetId,
      userId,
      role,
      content,
      provider: (metadata?.provider as string) ?? 'gemini',
      intent: metadata?.intent as string,
      confidence: metadata?.confidence as number,
      metadataJson: metadata,
    });
  }

  async createPendingAction(params: {
    userId: string;
    cabinetId: number;
    conversationId?: string;
    intent: AI_INTENT;
    inputMessage: string;
    extractedArguments: Record<string, unknown>;
    previewPayload: Record<string, unknown>;
  }): Promise<AiActionLogEntity> {
    return this.actionLogRepo.save({
      userId: params.userId,
      cabinetId: params.cabinetId,
      conversationId: params.conversationId,
      actionType: params.intent,
      status: AI_ACTION_STATUS.Pending,
      riskLevel: 'MEDIUM',
      title: params.inputMessage.substring(0, 255),
      summary: params.inputMessage,
      payloadJson: {
        ...params.extractedArguments,
        ...params.previewPayload,
      },
    });
  }

  async findPendingAction(
    actionId: string,
    userId: string,
    cabinetId: number,
  ): Promise<AiActionLogEntity | null> {
    return this.actionLogRepo.findOne({
      where: {
        id: actionId,
        userId,
        cabinetId,
        status: AI_ACTION_STATUS.Pending,
      },
    });
  }

  /** Find an action by ID + owner regardless of status (for idempotent confirm) */
  async findActionById(
    actionId: string,
    userId: string,
    cabinetId: number,
  ): Promise<AiActionLogEntity | null> {
    return this.actionLogRepo.findOne({
      where: {
        id: actionId,
        userId,
        cabinetId,
      },
    });
  }

  async updateActionPayload(
    actionId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.actionLogRepo.update(actionId, {
      payloadJson: payload,
    } as any);
  }

  async markActionConfirmed(actionId: string): Promise<void> {
    await this.actionLogRepo.update(actionId, {
      status: AI_ACTION_STATUS.Confirmed,
      confirmedAt: new Date(),
    } as any);
  }

  async markActionExecuted(
    actionId: string,
    result: Record<string, unknown>,
  ): Promise<void> {
    await this.actionLogRepo.update(actionId, {
      status: AI_ACTION_STATUS.Executed,
      resultJson: result,
      executedAt: new Date(),
    } as any);
  }

  async markActionFailed(
    actionId: string,
    errorMessage: string,
  ): Promise<void> {
    await this.actionLogRepo.update(actionId, {
      status: AI_ACTION_STATUS.Failed,
      errorMessage,
    } as any);
  }

  async markActionCancelled(actionId: string): Promise<void> {
    await this.actionLogRepo.update(actionId, {
      status: AI_ACTION_STATUS.Cancelled,
    } as any);
  }

  /* ── Conversation History ─────────────────────────────────────── */

  async listConversations(
    userId: string,
    cabinetId: number,
    page = 1,
    limit = 20,
  ): Promise<{ data: AiConversationEntity[]; total: number }> {
    const [data, total] = await this.conversationRepo
      .createQueryBuilder('c')
      .where('c.userId = :userId', { userId })
      .andWhere('c.cabinetId = :cabinetId', { cabinetId })
      .orderBy('c.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    cabinetId: number,
  ): Promise<AiMessageEntity[]> {
    return this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversationId = :conversationId', { conversationId })
      .andWhere('m.cabinetId = :cabinetId', { cabinetId })
      .andWhere('m.userId = :userId', { userId })
      .orderBy('m.createdAt', 'ASC')
      .getMany();
  }

  async updateConversationTitle(
    conversationId: string,
    userId: string,
    cabinetId: number,
    title: string,
  ): Promise<void> {
    await this.conversationRepo
      .createQueryBuilder()
      .update()
      .set({ title } as any)
      .where('id = :id AND userId = :userId AND cabinetId = :cabinetId', {
        id: conversationId,
        userId,
        cabinetId,
      })
      .execute();
  }

  async deleteConversation(
    conversationId: string,
    userId: string,
    cabinetId: number,
  ): Promise<boolean> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, userId, cabinetId },
    });
    if (!conversation) return false;
    await this.conversationRepo
      .createQueryBuilder()
      .softDelete()
      .where('id = :id', { id: conversationId })
      .execute();
    return true;
  }
}
