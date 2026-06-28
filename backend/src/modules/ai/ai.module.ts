import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { AiConversationEntity } from './entities/ai-conversation.entity';
import { AiMessageEntity } from './entities/ai-message.entity';
import { AiActionLogEntity } from './entities/ai-action-log.entity';
import { AiNotificationEntity } from './entities/ai-notification.entity';
import { AiReminderEntity } from './entities/ai-reminder.entity';

// Repositories
import { AiConversationRepository } from './repositories/ai-conversation.repository';
import { AiMessageRepository } from './repositories/ai-message.repository';
import { AiActionLogRepository } from './repositories/ai-action-log.repository';
import { AiNotificationRepository } from './repositories/ai-notification.repository';
import { AiReminderRepository } from './repositories/ai-reminder.repository';

// Providers
import { GeminiProvider } from './providers/gemini.provider';

// Services
import { AiService } from './services/ai.service';
import { AiOrchestratorService } from './services/ai-orchestrator.service';
import { AiContextService } from './services/ai-context.service';
import { AiPermissionService } from './services/ai-permission.service';
import { AiAuditService } from './services/ai-audit.service';
import { AiActionExecutorService } from './services/ai-action-executor.service';
import { AiNotificationService } from './services/ai-notification.service';
import { AiReminderService } from './services/ai-reminder.service';

// Tools
import { AiToolRegistryService } from './tools/ai-tool-registry.service';
import { AnalyticsToolsService } from './tools/analytics-tools.service';
import { ChartToolsService } from './tools/chart-tools.service';

// Config
import AiConfig from './config/ai.config';

// External modules
import { InvoiceModule } from '../invoice/invoice.module';
import { QuotationModule } from '../quotation/quotation.module';
import { PaymentModule } from '../payment/payment.module';
import { InterlocutorModule } from '../interlocutor/Interlocutor.module';
import { FirmModule } from '../firm/firm.module';
import { UserManagementModule } from '../user-management/user-management.module';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { InvoiceEntity } from '../invoice/entities/invoice.entity';
import { PaymentEntity } from '../payment/entities/payment.entity';
import { QuotationEntity } from '../quotation/entities/quotation.entity';
import { FirmEntity } from '../firm/entities/firm.entity';
import { ArticleEntity } from '../article/entities/article.entity';
import { CustomerOrderEntity } from '../customer-order/entities/customer-order.entity';
import { DeliveryNoteEntity } from '../delivery-note/entities/delivery-note.entity';
import { CreditNoteEntity } from '../credit-note/entities/credit-note.entity';
import { ArticleModule } from '../article/article.module';

@Module({
  controllers: [],
  providers: [
    // Repositories
    AiConversationRepository,
    AiMessageRepository,
    AiActionLogRepository,
    AiNotificationRepository,
    AiReminderRepository,

    // Provider
    GeminiProvider,

    // Services
    AiService,
    AiOrchestratorService,
    AiContextService,
    AiPermissionService,
    AiAuditService,
    AiActionExecutorService,
    AiNotificationService,
    AiReminderService,

    // Tools
    AiToolRegistryService,
    AnalyticsToolsService,
    ChartToolsService,
  ],
  exports: [
    AiService,
    AiContextService,
    AiNotificationService,
    AiReminderService,
  ],
  imports: [
    ConfigModule.forFeature(AiConfig),
    TypeOrmModule.forFeature([
      AiConversationEntity,
      AiMessageEntity,
      AiActionLogEntity,
      AiNotificationEntity,
      AiReminderEntity,
      InvoiceEntity,
      PaymentEntity,
      QuotationEntity,
      FirmEntity,
      ArticleEntity,
      CustomerOrderEntity,
      DeliveryNoteEntity,
      CreditNoteEntity,
    ]),
    InvoiceModule,
    QuotationModule,
    PaymentModule,
    InterlocutorModule,
    FirmModule,
    ArticleModule,
    UserManagementModule,
    TenantContextModule,
  ],
})
export class AiModule {}
