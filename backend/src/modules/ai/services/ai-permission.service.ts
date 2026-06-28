import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_INTENT } from '../enums/ai-intent.enum';

const INTENT_PERMISSION_MAP: Record<string, string[]> = {
  [AI_INTENT.ANSWER_BUSINESS_QUESTION]: ['ai:use'],
  [AI_INTENT.GENERATE_CHART]: ['ai:use', 'dashboard:read'],
  [AI_INTENT.CREATE_INVOICE_DRAFT]: ['ai:use', 'ai:execute-action'],
  [AI_INTENT.CREATE_QUOTE_DRAFT]: ['ai:use', 'ai:execute-action'],
  [AI_INTENT.CREATE_CUSTOMER]: ['ai:use', 'ai:execute-action'],
  [AI_INTENT.CREATE_PAYMENT]: ['ai:use', 'ai:execute-action'],
  [AI_INTENT.TRANSFORM_QUOTE_TO_INVOICE]: ['ai:use', 'ai:execute-action'],
  [AI_INTENT.ANALYZE_SUPPLIER_INVOICE]: ['ai:use'],
  [AI_INTENT.SUMMARIZE_DASHBOARD]: ['ai:use', 'dashboard:read'],
  [AI_INTENT.EXPLAIN_ENTITY]: ['ai:use'],
  [AI_INTENT.UNKNOWN_INTENT]: ['ai:use'],
};

@Injectable()
export class AiPermissionService {
  constructor(private readonly configService: ConfigService) {}

  assertAiEnabled(): void {
    const enabled = this.configService.get<boolean>('ai.enabled', false);
    if (!enabled) {
      throw new ForbiddenException(
        "Le module IA n'est pas activé sur cette instance.",
      );
    }
  }

  assertCanUseAi(): void {
    this.assertAiEnabled();
    // In a production implementation, check user permissions from the database.
    // For now, if AI is enabled and user is authenticated, they can use AI.
  }

  assertCanExecuteIntent(intent: AI_INTENT): void {
    this.assertAiEnabled();
    // Verify the intent requires valid permission keys
    const requiredPermissions = INTENT_PERMISSION_MAP[intent];
    if (!requiredPermissions) {
      throw new ForbiddenException(`Action IA non reconnue: ${intent}`);
    }
    // In production: check user.permissions against requiredPermissions
  }

  getRequiredPermissions(intent: AI_INTENT): string[] {
    return INTENT_PERMISSION_MAP[intent] ?? ['ai:use'];
  }
}
