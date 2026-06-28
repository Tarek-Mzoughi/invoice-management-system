import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiAuditService } from './ai-audit.service';
import { AiContextService } from './ai-context.service';
import { AiPermissionService } from './ai-permission.service';
import { AiActionExecutorService } from './ai-action-executor.service';
import { AiNotificationService } from './ai-notification.service';
import { AiChatDto } from '../dto/ai-chat.dto';
import { AiChatResponseDto } from '../dto/ai-chat-response.dto';
import { AiChartRequestDto } from '../dto/ai-chart-request.dto';
import { AiConfirmActionResponseDto } from '../dto/ai-confirm-action.dto';
import { AI_ACTION_STATUS } from '../enums/ai-action-status.enum';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly orchestrator: AiOrchestratorService,
    private readonly auditService: AiAuditService,
    private readonly contextService: AiContextService,
    private readonly permissionService: AiPermissionService,
    private readonly actionExecutor: AiActionExecutorService,
    private readonly notificationService: AiNotificationService,
  ) {}

  async chat(dto: AiChatDto, userSub: string): Promise<AiChatResponseDto> {
    return this.orchestrator.chat(dto, userSub);
  }

  async generateChart(
    dto: AiChartRequestDto,
    userSub: string,
  ): Promise<AiChatResponseDto> {
    return this.orchestrator.generateChart(
      dto.message,
      dto.conversationId,
      userSub,
    );
  }

  async confirmAction(
    actionId: string,
    userSub: string,
    overrides?: Record<string, unknown>,
  ): Promise<AiConfirmActionResponseDto> {
    this.permissionService.assertCanUseAi();

    const userContext = await this.contextService.resolveUserContext(userSub);

    // Find action by ID + owner (regardless of status for idempotency)
    const action = await this.auditService.findActionById(
      actionId,
      userContext.userId,
      userContext.cabinetId,
    );

    if (!action) {
      throw new BadRequestException('Action non trouvée.');
    }

    // Verify cabinet match
    if (action.cabinetId !== userContext.cabinetId) {
      throw new ForbiddenException('Accès non autorisé à cette action.');
    }

    // ── Idempotent: already executed → return existing result ────
    if (action.status === AI_ACTION_STATUS.Executed) {
      return {
        success: true,
        status: 'already_executed',
        message: 'Cette action a déjà été exécutée.',
        entity: action.resultJson ?? undefined,
      };
    }

    // ── In-flight: another request is currently executing this action ──
    if (action.status === AI_ACTION_STATUS.Confirmed) {
      return {
        success: true,
        status: 'confirming',
        message: "Cette action est en cours d'exécution.",
      };
    }

    // ── Already cancelled → cannot re-confirm ────────────────────
    if (action.status === AI_ACTION_STATUS.Cancelled) {
      return {
        success: false,
        status: 'cancelled',
        message: 'Cette action a été annulée.',
      };
    }

    // ── Failed → allow retry (status goes back through confirm flow) ──
    // ── Pending → normal confirm flow ─────────────────────────────────
    if (
      action.status !== AI_ACTION_STATUS.Pending &&
      action.status !== AI_ACTION_STATUS.Failed
    ) {
      return {
        success: false,
        status: action.status,
        message: `Action dans un état inattendu: ${action.status}`,
      };
    }

    // Apply user overrides to payload before execution
    if (overrides && Object.keys(overrides).length > 0) {
      action.payloadJson = { ...(action.payloadJson ?? {}), ...overrides };
      await this.auditService.updateActionPayload(actionId, action.payloadJson);
    }

    // Mark as confirmed (in-flight guard)
    await this.auditService.markActionConfirmed(actionId);

    try {
      // Execute the action
      const result = await this.actionExecutor.executeAction(action, userSub);

      // Mark as executed
      await this.auditService.markActionExecuted(actionId, result);

      // Fire notification
      this.notificationService
        .create({
          userId: userContext.userId,
          cabinetId: userContext.cabinetId,
          type: 'action_executed',
          priority: 'low',
          title: `Action exécutée: ${action.title?.substring(0, 80) || action.actionType}`,
          message: 'Action exécutée avec succès.',
          metadata: { actionId, actionType: action.actionType, result },
        })
        .catch((err) => this.logger.warn('Notification creation failed', err));

      return {
        success: true,
        status: 'executed',
        message: 'Action exécutée avec succès.',
        entity: result,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur lors de l'exécution";

      await this.auditService.markActionFailed(actionId, errorMsg);

      this.logger.error(`Action ${actionId} failed: ${errorMsg}`);

      // Fire failure notification
      this.notificationService
        .create({
          userId: userContext.userId,
          cabinetId: userContext.cabinetId,
          type: 'action_failed',
          priority: 'high',
          title: `Échec: ${action.title?.substring(0, 80) || action.actionType}`,
          message: errorMsg,
          metadata: { actionId, actionType: action.actionType },
        })
        .catch((err) => this.logger.warn('Notification creation failed', err));

      return {
        success: false,
        status: 'failed',
        message: `L'action a échoué: ${errorMsg}`,
      };
    }
  }

  /* ── Conversation History ─────────────────────────────────────── */

  async listConversations(userSub: string, page?: number, limit?: number) {
    const userContext = await this.contextService.resolveUserContext(userSub);
    return this.auditService.listConversations(
      userContext.userId,
      userContext.cabinetId,
      page,
      limit,
    );
  }

  async getConversationMessages(conversationId: string, userSub: string) {
    const userContext = await this.contextService.resolveUserContext(userSub);
    return this.auditService.getConversationMessages(
      conversationId,
      userContext.userId,
      userContext.cabinetId,
    );
  }

  async updateConversationTitle(
    conversationId: string,
    title: string,
    userSub: string,
  ) {
    const userContext = await this.contextService.resolveUserContext(userSub);
    await this.auditService.updateConversationTitle(
      conversationId,
      userContext.userId,
      userContext.cabinetId,
      title,
    );
    return { success: true };
  }

  async deleteConversation(conversationId: string, userSub: string) {
    const userContext = await this.contextService.resolveUserContext(userSub);
    const deleted = await this.auditService.deleteConversation(
      conversationId,
      userContext.userId,
      userContext.cabinetId,
    );
    if (!deleted) {
      throw new BadRequestException('Conversation non trouvée.');
    }
    return { success: true, message: 'Conversation supprimée.' };
  }

  async cancelAction(
    actionId: string,
    userSub: string,
  ): Promise<{ success: boolean; message: string }> {
    const userContext = await this.contextService.resolveUserContext(userSub);

    const action = await this.auditService.findActionById(
      actionId,
      userContext.userId,
      userContext.cabinetId,
    );

    if (!action) {
      throw new BadRequestException('Action non trouvée.');
    }

    // Idempotent: already cancelled
    if (action.status === AI_ACTION_STATUS.Cancelled) {
      return { success: true, message: 'Action déjà annulée.' };
    }

    // Cannot cancel an executed action
    if (action.status === AI_ACTION_STATUS.Executed) {
      return {
        success: false,
        message: "Impossible d'annuler une action déjà exécutée.",
      };
    }

    await this.auditService.markActionCancelled(actionId);

    return { success: true, message: 'Action annulée.' };
  }
}
