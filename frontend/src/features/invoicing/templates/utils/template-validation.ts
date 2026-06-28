import {
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
  DOCUMENT_TEMPLATE_ELEMENT_TYPE,
  TemplateSchema
} from '@/types';
import { TemplateValidationResult } from '../types/template-editor.types';

const itemDocumentTypes = new Set<DOCUMENT_TEMPLATE_DOCUMENT_TYPE>([
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.INVOICE,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.QUOTE,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CUSTOMER_ORDER,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.DELIVERY_NOTE,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.GOODS_ISSUE_NOTE,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CREDIT_NOTE,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RETURN_NOTE,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.PURCHASE_ORDER,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_INVOICE,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_CREDIT_NOTE
]);

const supplierDocumentTypes = new Set<DOCUMENT_TEMPLATE_DOCUMENT_TYPE>([
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.PURCHASE_ORDER,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_INVOICE,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_CREDIT_NOTE
]);

export const validateTemplateForPublish = ({
  name,
  documentType,
  schema
}: {
  name: string;
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;
  schema?: TemplateSchema | null;
}): TemplateValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!name.trim()) errors.push('Template name is required.');
  if (!documentType) errors.push('Document type is required.');
  if (!schema) errors.push('Template schema is not loaded.');

  if (!schema) return { errors, warnings };

  if (!schema.pageSettings?.width || !schema.pageSettings?.height) {
    errors.push('Page settings must define width and height.');
  }

  if (!Array.isArray(schema.elements)) {
    errors.push('Template schema must contain elements.');
  } else if (schema.elements.length === 0) {
    warnings.push('The template has no elements.');
  }

  const boundVariables = new Set(
    schema.elements.map((element) => element.binding?.path).filter((path): path is string => !!path)
  );

  const requiredVariables = [
    'company.name',
    'document.number',
    'document.date',
    supplierDocumentTypes.has(documentType) ? 'supplier.name' : 'client.name'
  ];

  if (itemDocumentTypes.has(documentType)) {
    requiredVariables.push('items');

    const itemTables = schema.elements.filter(
      (element) =>
        element.type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE &&
        (element.binding?.path === 'items' || element.tableConfig?.binding === 'items')
    );

    if (itemTables.length === 0) {
      warnings.push('Missing recommended line items table.');
    }

    itemTables.forEach((table) => {
      const visibleColumnKeys = new Set(
        (table.tableConfig?.columns || [])
          .filter((column) => column.visible !== false)
          .map((column) => column.key)
      );
      ['name', 'quantity', 'unitPrice', 'totalTTC'].forEach((columnKey) => {
        if (!visibleColumnKeys.has(columnKey)) {
          warnings.push(`Line items table is missing recommended column: ${columnKey}`);
        }
      });
    });
  }

  requiredVariables.forEach((variable) => {
    if (!boundVariables.has(variable)) {
      warnings.push(`Missing recommended variable: ${variable}`);
    }
  });

  return { errors, warnings };
};
