import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_INTENT } from '../enums/ai-intent.enum';
import { AiPermissionService } from './ai-permission.service';

describe('AiPermissionService', () => {
  const configService = {
    get: jest.fn().mockReturnValue(true),
  } as unknown as ConfigService;

  let service: AiPermissionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiPermissionService(configService);
  });

  it('allows supplier invoice analysis intent', () => {
    expect(() =>
      service.assertCanExecuteIntent(AI_INTENT.ANALYZE_SUPPLIER_INVOICE),
    ).not.toThrow();
    expect(
      service.getRequiredPermissions(AI_INTENT.ANALYZE_SUPPLIER_INVOICE),
    ).toEqual(['ai:use']);
  });

  it('rejects unknown action intents', () => {
    expect(() =>
      service.assertCanExecuteIntent('NOT_REAL' as AI_INTENT),
    ).toThrow(ForbiddenException);
  });
});
