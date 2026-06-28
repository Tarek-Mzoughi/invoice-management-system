import { Injectable } from '@nestjs/common';
import { AiNotificationRepository } from '../repositories/ai-notification.repository';
import {
  AiNotificationEntity,
  AiNotificationType,
  AiNotificationPriority,
} from '../entities/ai-notification.entity';

@Injectable()
export class AiNotificationService {
  constructor(private readonly notificationRepo: AiNotificationRepository) {}

  async create(params: {
    userId: string;
    cabinetId: number;
    type: AiNotificationType;
    priority?: AiNotificationPriority;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    actionUrl?: string;
  }): Promise<AiNotificationEntity> {
    return this.notificationRepo.save({
      userId: params.userId,
      cabinetId: params.cabinetId,
      type: params.type,
      priority: params.priority ?? 'medium',
      title: params.title,
      message: params.message,
      metadataJson: params.metadata,
      isRead: false,
      actionUrl: params.actionUrl,
    });
  }

  async listForUser(
    userId: string,
    cabinetId: number,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<{
    data: AiNotificationEntity[];
    total: number;
    unreadCount: number;
  }> {
    const qb = this.notificationRepo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.cabinetId = :cabinetId', { cabinetId });

    if (unreadOnly) {
      qb.andWhere('n.isRead = :isRead', { isRead: false });
    }

    const [data, total] = await qb
      .orderBy('n.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const unreadCount = await this.notificationRepo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.cabinetId = :cabinetId', { cabinetId })
      .andWhere('n.isRead = :isRead', { isRead: false })
      .getCount();

    return { data, total, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepo
      .createQueryBuilder()
      .update()
      .set({ isRead: true, readAt: new Date() } as any)
      .where('id = :id AND userId = :userId', { id: notificationId, userId })
      .execute();
  }

  async markAllAsRead(userId: string, cabinetId: number): Promise<void> {
    await this.notificationRepo
      .createQueryBuilder()
      .update()
      .set({ isRead: true, readAt: new Date() } as any)
      .where('userId = :userId AND cabinetId = :cabinetId AND isRead = false', {
        userId,
        cabinetId,
      })
      .execute();
  }

  async getUnreadCount(userId: string, cabinetId: number): Promise<number> {
    return this.notificationRepo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.cabinetId = :cabinetId', { cabinetId })
      .andWhere('n.isRead = :isRead', { isRead: false })
      .getCount();
  }
}
