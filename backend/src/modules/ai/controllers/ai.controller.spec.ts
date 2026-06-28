import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from '../services/ai.service';
import { AiNotificationService } from '../services/ai-notification.service';
import { AiReminderService } from '../services/ai-reminder.service';
import { AiContextService } from '../services/ai-context.service';
import { ForbiddenException } from '@nestjs/common';

const mockUserContext = {
  userId: '1',
  email: 'test@test.com',
  userName: 'Test User',
  cabinetId: 1,
  cabinetName: 'Test Cabinet',
};

describe('AiController', () => {
  let controller: AiController;
  let aiService: jest.Mocked<AiService>;

  const mockUser = { sub: '1', email: 'test@test.com' };
  const mockRequest = { user: mockUser } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: {
            chat: jest.fn(),
            generateChart: jest.fn(),
            confirmAction: jest.fn(),
            cancelAction: jest.fn(),
            listConversations: jest
              .fn()
              .mockResolvedValue({ data: [], total: 0 }),
            getConversationMessages: jest.fn().mockResolvedValue([]),
            updateConversationTitle: jest
              .fn()
              .mockResolvedValue({ success: true }),
            deleteConversation: jest.fn().mockResolvedValue({
              success: true,
              message: 'Conversation supprimée.',
            }),
          },
        },
        {
          provide: AiNotificationService,
          useValue: {
            listForUser: jest.fn().mockResolvedValue({ data: [], total: 0 }),
            getUnreadCount: jest.fn().mockResolvedValue(0),
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
          },
        },
        {
          provide: AiReminderService,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
            listForUser: jest.fn().mockResolvedValue({ data: [], total: 0 }),
            cancel: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: AiContextService,
          useValue: {
            resolveUserContext: jest.fn().mockResolvedValue(mockUserContext),
          },
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    aiService = module.get(AiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /ai/chat', () => {
    it('should call aiService.chat with user sub', async () => {
      const dto = { message: 'Hello AI' };
      const expectedResponse = {
        type: 'text' as const,
        message: 'Hello!',
      };
      aiService.chat.mockResolvedValue(expectedResponse);

      const result = await controller.chat(dto, mockRequest);

      expect(aiService.chat).toHaveBeenCalledWith(dto, '1');
      expect(result).toEqual(expectedResponse);
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      const dto = { message: 'Hello AI' };
      const unauthenticatedReq = { user: null } as any;

      await expect(controller.chat(dto, unauthenticatedReq)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('POST /ai/charts/generate', () => {
    it('should call aiService.generateChart with user sub', async () => {
      const dto = { message: 'Revenue by month', conversationId: undefined };
      const expectedResponse = {
        type: 'chart' as const,
        message: 'Here is your chart',
      };
      aiService.generateChart.mockResolvedValue(expectedResponse);

      const result = await controller.generateChart(dto, mockRequest);

      expect(aiService.generateChart).toHaveBeenCalledWith(dto, '1');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('POST /ai/actions/:id/confirm', () => {
    it('should confirm an action', async () => {
      const expectedResponse = {
        success: true,
        message: 'Action exécutée avec succès.',
      };
      aiService.confirmAction.mockResolvedValue(expectedResponse);

      const result = await controller.confirmAction('1', {}, mockRequest);

      expect(aiService.confirmAction).toHaveBeenCalledWith('1', '1', undefined);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('POST /ai/actions/:id/cancel', () => {
    it('should cancel an action', async () => {
      const expectedResponse = { success: true, message: 'Action annulée.' };
      aiService.cancelAction.mockResolvedValue(expectedResponse);

      const result = await controller.cancelAction('1', mockRequest);

      expect(aiService.cancelAction).toHaveBeenCalledWith('1', '1');
      expect(result).toEqual(expectedResponse);
    });
  });
});
