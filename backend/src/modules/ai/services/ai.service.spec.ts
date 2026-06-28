import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiAuditService } from './ai-audit.service';
import { AiContextService } from './ai-context.service';
import { AiPermissionService } from './ai-permission.service';
import { AiActionExecutorService } from './ai-action-executor.service';
import { AiNotificationService } from './ai-notification.service';
import { AI_ACTION_STATUS } from '../enums/ai-action-status.enum';
import { AI_INTENT } from '../enums/ai-intent.enum';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('AiService', () => {
  let service: AiService;
  let orchestrator: jest.Mocked<AiOrchestratorService>;
  let auditService: jest.Mocked<AiAuditService>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let contextService: jest.Mocked<AiContextService>;
  let permissionService: jest.Mocked<AiPermissionService>;
  let actionExecutor: jest.Mocked<AiActionExecutorService>;

  const mockUserContext = {
    userId: '1',
    email: 'test@test.com',
    userName: 'Test User',
    cabinetId: 1,
    cabinetName: 'Test Cabinet',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: AiOrchestratorService,
          useValue: {
            chat: jest.fn(),
            generateChart: jest.fn(),
          },
        },
        {
          provide: AiAuditService,
          useValue: {
            findPendingAction: jest.fn(),
            findActionById: jest.fn(),
            updateActionPayload: jest.fn(),
            markActionConfirmed: jest.fn(),
            markActionExecuted: jest.fn(),
            markActionFailed: jest.fn(),
            markActionCancelled: jest.fn(),
            listConversations: jest
              .fn()
              .mockResolvedValue({ data: [], total: 0 }),
            getConversationMessages: jest.fn().mockResolvedValue([]),
            updateConversationTitle: jest.fn(),
            deleteConversation: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: AiContextService,
          useValue: {
            resolveUserContext: jest.fn().mockResolvedValue(mockUserContext),
          },
        },
        {
          provide: AiPermissionService,
          useValue: {
            assertCanUseAi: jest.fn(),
          },
        },
        {
          provide: AiActionExecutorService,
          useValue: {
            executeAction: jest.fn(),
          },
        },
        {
          provide: AiNotificationService,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    orchestrator = module.get(AiOrchestratorService);
    auditService = module.get(AiAuditService);
    contextService = module.get(AiContextService);
    permissionService = module.get(AiPermissionService);
    actionExecutor = module.get(AiActionExecutorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    it('should delegate to orchestrator', async () => {
      const dto = { message: 'Hello' };
      const expected = { type: 'text' as const, message: 'Hi!' };
      orchestrator.chat.mockResolvedValue(expected);

      const result = await service.chat(dto, '1');

      expect(orchestrator.chat).toHaveBeenCalledWith(dto, '1');
      expect(result).toEqual(expected);
    });
  });

  describe('generateChart', () => {
    it('should delegate to orchestrator', async () => {
      const dto = { message: 'chart', conversationId: undefined };
      const expected = { type: 'chart' as const, message: 'Chart generated' };
      orchestrator.generateChart.mockResolvedValue(expected);

      const result = await service.generateChart(dto, '1');

      expect(orchestrator.generateChart).toHaveBeenCalledWith(
        'chart',
        undefined,
        '1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('confirmAction', () => {
    it('should execute a pending action successfully', async () => {
      const mockAction = {
        id: '1',
        status: AI_ACTION_STATUS.Pending,
        cabinetId: 1,
        actionType: AI_INTENT.CREATE_INVOICE_DRAFT,
        payloadJson: {},
        title: 'Test action',
      } as any;

      auditService.findActionById.mockResolvedValue(mockAction);
      actionExecutor.executeAction.mockResolvedValue({
        id: 10,
        sequential: 'FAC-001',
      });

      const result = await service.confirmAction('1', '1');

      expect(permissionService.assertCanUseAi).toHaveBeenCalled();
      expect(auditService.markActionConfirmed).toHaveBeenCalledWith('1');
      expect(actionExecutor.executeAction).toHaveBeenCalledWith(
        mockAction,
        '1',
      );
      expect(auditService.markActionExecuted).toHaveBeenCalledWith('1', {
        id: 10,
        sequential: 'FAC-001',
      });
      expect(result.success).toBe(true);
    });

    it('should throw if action not found', async () => {
      auditService.findActionById.mockResolvedValue(null);

      await expect(service.confirmAction('1', '1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return already_executed for executed actions', async () => {
      const mockAction = {
        id: '1',
        status: AI_ACTION_STATUS.Executed,
        cabinetId: 1,
        resultJson: { id: 10 },
      } as any;

      auditService.findActionById.mockResolvedValue(mockAction);

      const result = await service.confirmAction('1', '1');

      expect(result.success).toBe(true);
      expect(result.status).toBe('already_executed');
    });

    it('should throw if cabinet mismatch', async () => {
      const mockAction = {
        id: '1',
        status: AI_ACTION_STATUS.Pending,
        cabinetId: 999,
      } as any;

      auditService.findActionById.mockResolvedValue(mockAction);

      await expect(service.confirmAction('1', '1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle execution failure gracefully', async () => {
      const mockAction = {
        id: '1',
        status: AI_ACTION_STATUS.Pending,
        cabinetId: 1,
        actionType: AI_INTENT.CREATE_INVOICE_DRAFT,
        payloadJson: {},
        title: 'Test action',
      } as any;

      auditService.findActionById.mockResolvedValue(mockAction);
      actionExecutor.executeAction.mockRejectedValue(new Error('DB error'));

      const result = await service.confirmAction('1', '1');

      expect(result.success).toBe(false);
      expect(auditService.markActionFailed).toHaveBeenCalledWith(
        '1',
        'DB error',
      );
    });
  });

  describe('cancelAction', () => {
    it('should cancel a pending action', async () => {
      const mockAction = {
        id: '1',
        status: AI_ACTION_STATUS.Pending,
        cabinetId: 1,
      } as any;

      auditService.findActionById.mockResolvedValue(mockAction);

      const result = await service.cancelAction('1', '1');

      expect(auditService.markActionCancelled).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });

    it('should throw if action not found', async () => {
      auditService.findActionById.mockResolvedValue(null);

      await expect(service.cancelAction('1', '1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
