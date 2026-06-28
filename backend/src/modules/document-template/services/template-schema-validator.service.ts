import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class TemplateSchemaValidatorService {
  validate(schema?: Record<string, unknown>): void {
    if (!schema) return;
    if (typeof schema !== 'object' || Array.isArray(schema)) {
      throw new BadRequestException('Template schema must be an object');
    }

    const hasPdfmeShape = Array.isArray(schema.schemas) && !!schema.basePdf;
    const hasZcShape = Array.isArray(schema.elements);

    if (!hasPdfmeShape && !hasZcShape) {
      throw new BadRequestException(
        'Template schema must contain elements or a pdfme schema definition',
      );
    }

    if (hasZcShape) {
      this.validateZcElements(schema.elements as unknown[]);
    }
  }

  private validateZcElements(elements: unknown[]): void {
    for (const element of elements) {
      if (!element || typeof element !== 'object' || Array.isArray(element)) {
        throw new BadRequestException('Template elements must be objects');
      }

      const candidate = element as Record<string, unknown>;
      const requiredFields = [
        'id',
        'type',
        'name',
        'position',
        'size',
        'zIndex',
        'visible',
        'locked',
        'pageIndex',
      ];

      for (const field of requiredFields) {
        if (!(field in candidate)) {
          throw new BadRequestException(
            `Template element "${candidate.name || 'unknown'}" is missing ${field}`,
          );
        }
      }
    }
  }
}
