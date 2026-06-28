import { Test, TestingModule } from '@nestjs/testing';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { GeminiProvider } from '../providers/gemini.provider';
import { AiContextService } from './ai-context.service';
import { AiPermissionService } from './ai-permission.service';
import { AiAuditService } from './ai-audit.service';
import { AiToolRegistryService } from '../tools/ai-tool-registry.service';
import { ChartToolsService } from '../tools/chart-tools.service';
import { AI_INTENT } from '../enums/ai-intent.enum';

describe('AiOrchestratorService', () => {
  let service: AiOrchestratorService;
  let geminiProvider: jest.Mocked<GeminiProvider>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let contextService: jest.Mocked<AiContextService>;
  let permissionService: jest.Mocked<AiPermissionService>;
  let auditService: jest.Mocked<AiAuditService>;
  let toolRegistry: jest.Mocked<AiToolRegistryService>;

  const mockUserContext = {
    userId: 1,
    email: 'test@test.com',
    userName: 'Test User',
    cabinetId: 1,
    cabinetName: 'Test Cabinet',
  };

  const mockConversation = {
    id: 1,
    userId: 1,
    cabinetId: 1,
    title: 'Test',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiOrchestratorService,
        {
          provide: GeminiProvider,
          useValue: {
            generateText: jest.fn(),
            generateStructured: jest.fn(),
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
            assertCanExecuteIntent: jest.fn(),
          },
        },
        {
          provide: AiAuditService,
          useValue: {
            getOrCreateConversation: jest
              .fn()
              .mockResolvedValue(mockConversation),
            saveMessage: jest.fn().mockResolvedValue({ id: 1 }),
            createPendingAction: jest.fn().mockResolvedValue({
              id: 1,
              intent: AI_INTENT.CREATE_INVOICE_DRAFT,
            }),
          },
        },
        {
          provide: AiToolRegistryService,
          useValue: {
            executeToolCalls: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ChartToolsService,
          useValue: {
            buildChartFromData: jest.fn().mockResolvedValue({
              echartsOption: {},
              sourceData: [],
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiOrchestratorService>(AiOrchestratorService);
    geminiProvider = module.get(GeminiProvider);
    contextService = module.get(AiContextService);
    permissionService = module.get(AiPermissionService);
    auditService = module.get(AiAuditService);
    toolRegistry = module.get(AiToolRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat - business question', () => {
    it('should handle "Quelles factures sont en retard ?"', async () => {
      geminiProvider.generateStructured.mockResolvedValue({
        intent: AI_INTENT.ANSWER_BUSINESS_QUESTION,
        confidence: 0.95,
        language: 'fr',
        requiresAction: false,
        requiresConfirmation: false,
        toolCalls: [{ tool: 'getOverdueInvoices', arguments: {} }],
        arguments: {},
        missingFields: [],
        userMessage: 'Vous avez des factures en retard.',
      });

      toolRegistry.executeToolCalls.mockResolvedValue([
        {
          tool: 'getOverdueInvoices',
          success: true,
          data: [
            {
              id: 1,
              sequential: 'FAC-001',
              total: 500,
              status: 'unpaid',
              currency: 'TND',
            },
          ],
        },
      ]);

      const result = await service.chat(
        { message: 'Quelles factures sont en retard ?' },
        '1',
      );

      expect(result.type).toBe('table');
      expect(result.conversationId).toBe(1);
      expect(result.table).toBeDefined();
      expect(result.table.rows).toHaveLength(1);
      expect(permissionService.assertCanUseAi).toHaveBeenCalled();
    });

    it('should handle "Quels sont les paiements par chèque ?"', async () => {
      geminiProvider.generateStructured.mockResolvedValue({
        intent: AI_INTENT.ANSWER_BUSINESS_QUESTION,
        confidence: 0.9,
        language: 'fr',
        requiresAction: false,
        requiresConfirmation: false,
        toolCalls: [{ tool: 'getPaymentsByMethod', arguments: {} }],
        arguments: {},
        missingFields: [],
        userMessage: 'Voici les paiements par méthode.',
      });

      toolRegistry.executeToolCalls.mockResolvedValue([
        {
          tool: 'getPaymentsByMethod',
          success: true,
          data: [{ method: 'check', total: 1500, count: 3 }],
        },
      ]);

      const result = await service.chat(
        { message: 'Quels sont les paiements par chèque ?' },
        '1',
      );

      expect(result.type).toBe('table');
      expect(result.table).toBeDefined();
      expect(result.table.rows).toHaveLength(1);
    });
  });

  describe('chat - action intent', () => {
    it('should create pending action for invoice creation', async () => {
      geminiProvider.generateStructured.mockResolvedValue({
        intent: AI_INTENT.CREATE_INVOICE_DRAFT,
        confidence: 0.92,
        language: 'fr',
        requiresAction: true,
        requiresConfirmation: true,
        toolCalls: [],
        arguments: {
          customerName: 'Ahmed',
          items: [{ title: 'test', quantity: 2, unitPrice: 150 }],
        },
        missingFields: [],
        userMessage:
          'Je peux créer cette facture en brouillon. Client: Ahmed, 2x test à 150 TND = 300 TND. Confirmer ?',
      });

      const result = await service.chat(
        {
          message:
            'Crée une facture pour Ahmed avec article test quantité 2 prix 150',
        },
        '1',
      );

      expect(result.type).toBe('action_preview');
      expect(result.action).toBeDefined();
      expect(result.action.actionId).toBe(1);
      expect(result.action.entityType).toBe('invoice');
      expect(result.action.title).toBe('Création de facture');
      expect(result.action.preview).toBeDefined();
      expect(auditService.createPendingAction).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: AI_INTENT.CREATE_INVOICE_DRAFT,
          cabinetId: 1,
        }),
      );
    });

    it('should ask for missing fields', async () => {
      geminiProvider.generateStructured.mockResolvedValue({
        intent: AI_INTENT.CREATE_INVOICE_DRAFT,
        confidence: 0.78,
        language: 'fr',
        requiresAction: true,
        requiresConfirmation: true,
        toolCalls: [],
        arguments: {},
        missingFields: ['customerName'],
        userMessage: "Pour créer la facture, j'ai besoin du nom du client.",
      });

      const result = await service.chat({ message: 'Crée une facture' }, '1');

      expect(result.type).toBe('clarification');
      expect(result.message).toContain('nom du client');
    });
  });

  describe('chat - permission denied', () => {
    it('should fail when AI is disabled', async () => {
      permissionService.assertCanUseAi.mockImplementation(() => {
        throw new Error("Le module IA n'est pas activé");
      });

      await expect(service.chat({ message: 'test' }, '1')).rejects.toThrow();
    });
  });

  describe('chat - error handling', () => {
    it('should handle Gemini API failure gracefully', async () => {
      geminiProvider.generateStructured.mockRejectedValue(
        new Error(
          'Le service IA est temporairement indisponible. Veuillez réessayer.',
        ),
      );

      const result = await service.chat({ message: 'test' }, '1');

      expect(result.type).toBe('error');
      expect(result.message).toContain('indisponible');
    });
  });
});
