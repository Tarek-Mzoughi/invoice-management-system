import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThanOrEqual } from 'typeorm';
import { AiReminderRepository } from '../repositories/ai-reminder.repository';
import { AiNotificationService } from './ai-notification.service';
import {
  AiReminderEntity,
  AiReminderType,
} from '../entities/ai-reminder.entity';

@Injectable()
export class AiReminderService {
  private readonly logger = new Logger(AiReminderService.name);

  constructor(
    private readonly reminderRepo: AiReminderRepository,
    private readonly notificationService: AiNotificationService,
  ) {}

  async create(params: {
    userId: string;
    cabinetId: number;
    type: AiReminderType;
    title: string;
    message: string;
    scheduledAt: Date;
    entityId?: number;
    entityType?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AiReminderEntity> {
    return this.reminderRepo.save({
      userId: params.userId,
      cabinetId: params.cabinetId,
      type: params.type,
      status: 'pending',
      title: params.title,
      message: params.message,
      scheduledAt: params.scheduledAt,
      entityId: params.entityId,
      entityType: params.entityType,
      metadataJson: params.metadata,
    });
  }

  async listForUser(
    userId: string,
    cabinetId: number,
    page = 1,
    limit = 20,
  ): Promise<{ data: AiReminderEntity[]; total: number }> {
    const [data, total] = await this.reminderRepo
      .createQueryBuilder('r')
      .where('r.userId = :userId', { userId })
      .andWhere('r.cabinetId = :cabinetId', { cabinetId })
      .andWhere('r.status != :cancelled', { cancelled: 'cancelled' })
      .orderBy('r.scheduledAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async cancel(reminderId: string, userId: string): Promise<boolean> {
    const result = await this.reminderRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'cancelled' } as any)
      .where('id = :id AND userId = :userId AND status = :status', {
        id: reminderId,
        userId,
        status: 'pending',
      })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  /**
   * Cron job: check for due reminders every minute and convert them to notifications.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processDueReminders(): Promise<void> {
    const now = new Date();

    const dueReminders = await this.reminderRepo.findAll({
      where: {
        status: 'pending' as any,
        scheduledAt: LessThanOrEqual(now),
      },
    });

    if (!dueReminders.length) return;

    this.logger.log(`Processing ${dueReminders.length} due reminder(s)`);

    for (const reminder of dueReminders) {
      try {
        await this.notificationService.create({
          userId: reminder.userId,
          cabinetId: reminder.cabinetId,
          type: 'reminder',
          priority: 'medium',
          title: reminder.title,
          message: reminder.message,
          metadata: {
            reminderId: reminder.id,
            reminderType: reminder.type,
            entityId: reminder.entityId,
            entityType: reminder.entityType,
            ...reminder.metadataJson,
          },
        });

        await this.reminderRepo
          .createQueryBuilder()
          .update()
          .set({ status: 'sent', sentAt: now } as any)
          .where('id = :id', { id: reminder.id })
          .execute();
      } catch (err) {
        this.logger.error(
          `Failed to process reminder ${reminder.id}`,
          (err as Error).stack,
        );
        await this.reminderRepo
          .createQueryBuilder()
          .update()
          .set({ status: 'failed' } as any)
          .where('id = :id', { id: reminder.id })
          .execute();
      }
    }
  }
}
