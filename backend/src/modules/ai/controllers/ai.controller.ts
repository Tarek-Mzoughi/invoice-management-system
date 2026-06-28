import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiService } from '../services/ai.service';
import { AiNotificationService } from '../services/ai-notification.service';
import { AiReminderService } from '../services/ai-reminder.service';
import { AiContextService } from '../services/ai-context.service';
import { AiChatDto } from '../dto/ai-chat.dto';
import { AiChatResponseDto } from '../dto/ai-chat-response.dto';
import { AiChartRequestDto } from '../dto/ai-chart-request.dto';
import {
  AiConfirmActionBodyDto,
  AiConfirmActionResponseDto,
} from '../dto/ai-confirm-action.dto';
import { AdvancedRequest } from 'src/types';
import { Request } from '@nestjs/common';

@ApiTags('ai')
@Controller({ version: '1', path: '/ai' })
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly notificationService: AiNotificationService,
    private readonly reminderService: AiReminderService,
    private readonly contextService: AiContextService,
  ) {}

  private getAuthenticatedUserId(req: AdvancedRequest): string {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }
    return req.user.sub;
  }

  @Post('/chat')
  async chat(
    @Body() dto: AiChatDto,
    @Request() req: AdvancedRequest,
  ): Promise<AiChatResponseDto> {
    return this.aiService.chat(dto, this.getAuthenticatedUserId(req));
  }

  @Post('/charts/generate')
  async generateChart(
    @Body() dto: AiChartRequestDto,
    @Request() req: AdvancedRequest,
  ): Promise<AiChatResponseDto> {
    return this.aiService.generateChart(dto, this.getAuthenticatedUserId(req));
  }

  @Post('/actions/:id/confirm')
  async confirmAction(
    @Param('id') id: string,
    @Body() body: AiConfirmActionBodyDto,
    @Request() req: AdvancedRequest,
  ): Promise<AiConfirmActionResponseDto> {
    return this.aiService.confirmAction(
      id,
      this.getAuthenticatedUserId(req),
      body.overrides,
    );
  }

  /* ── Conversation History ─────────────────────────────────────── */

  @Get('/conversations')
  async listConversations(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req: AdvancedRequest,
  ) {
    return this.aiService.listConversations(
      this.getAuthenticatedUserId(req),
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('/conversations/:id/messages')
  async getConversationMessages(
    @Param('id') id: string,
    @Request() req: AdvancedRequest,
  ) {
    return this.aiService.getConversationMessages(
      id,
      this.getAuthenticatedUserId(req),
    );
  }

  @Patch('/conversations/:id')
  async updateConversationTitle(
    @Param('id') id: string,
    @Body('title') title: string,
    @Request() req: AdvancedRequest,
  ) {
    return this.aiService.updateConversationTitle(
      id,
      title,
      this.getAuthenticatedUserId(req),
    );
  }

  @Delete('/conversations/:id')
  async deleteConversation(
    @Param('id') id: string,
    @Request() req: AdvancedRequest,
  ) {
    return this.aiService.deleteConversation(
      id,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('/actions/:id/cancel')
  async cancelAction(
    @Param('id') id: string,
    @Request() req: AdvancedRequest,
  ): Promise<{ success: boolean; message: string }> {
    return this.aiService.cancelAction(id, this.getAuthenticatedUserId(req));
  }

  /* ── Notifications ────────────────────────────────────────────── */

  @Get('/notifications')
  async listNotifications(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('unreadOnly') unreadOnly: string,
    @Request() req: AdvancedRequest,
  ) {
    const userContext = await this.contextService.resolveUserContext(
      this.getAuthenticatedUserId(req),
    );
    return this.notificationService.listForUser(
      userContext.userId,
      userContext.cabinetId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      unreadOnly === 'true',
    );
  }

  @Get('/notifications/unread-count')
  async getUnreadCount(@Request() req: AdvancedRequest) {
    const userContext = await this.contextService.resolveUserContext(
      this.getAuthenticatedUserId(req),
    );
    const count = await this.notificationService.getUnreadCount(
      userContext.userId,
      userContext.cabinetId,
    );
    return { count };
  }

  @Patch('/notifications/:id/read')
  async markAsRead(@Param('id') id: string, @Request() req: AdvancedRequest) {
    await this.notificationService.markAsRead(
      id,
      this.getAuthenticatedUserId(req),
    );
    return { success: true };
  }

  @Post('/notifications/read-all')
  async markAllAsRead(@Request() req: AdvancedRequest) {
    const userContext = await this.contextService.resolveUserContext(
      this.getAuthenticatedUserId(req),
    );
    await this.notificationService.markAllAsRead(
      userContext.userId,
      userContext.cabinetId,
    );
    return { success: true };
  }

  /* ── Reminders ────────────────────────────────────────────────── */

  @Post('/reminders')
  async createReminder(
    @Body()
    body: {
      type: string;
      title: string;
      message: string;
      scheduledAt: string;
      entityId?: number;
      entityType?: string;
    },
    @Request() req: AdvancedRequest,
  ) {
    const userContext = await this.contextService.resolveUserContext(
      this.getAuthenticatedUserId(req),
    );
    return this.reminderService.create({
      userId: userContext.userId,
      cabinetId: userContext.cabinetId,
      type: body.type as any,
      title: body.title,
      message: body.message,
      scheduledAt: new Date(body.scheduledAt),
      entityId: body.entityId,
      entityType: body.entityType,
    });
  }

  @Get('/reminders')
  async listReminders(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req: AdvancedRequest,
  ) {
    const userContext = await this.contextService.resolveUserContext(
      this.getAuthenticatedUserId(req),
    );
    return this.reminderService.listForUser(
      userContext.userId,
      userContext.cabinetId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post('/reminders/:id/cancel')
  async cancelReminder(
    @Param('id') id: string,
    @Request() req: AdvancedRequest,
  ) {
    const cancelled = await this.reminderService.cancel(
      id,
      this.getAuthenticatedUserId(req),
    );
    return { success: cancelled };
  }
}
