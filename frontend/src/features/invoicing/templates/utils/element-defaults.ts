import {
  createDefaultTableConfig,
  createTemplateElement,
  DOCUMENT_TEMPLATE_ELEMENT_TYPE,
  TemplateElement,
  TemplatePageSettings
} from '@/types';
import { TemplateCanvasPoint, TemplateVariableDefinition } from '../types/template-editor.types';
import { clampElementToPage } from './coordinates';

const defaultSizes: Record<DOCUMENT_TEMPLATE_ELEMENT_TYPE, TemplateElement['size']> = {
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.TEXT]: { width: 70, height: 10 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.DYNAMIC_TEXT]: { width: 70, height: 8 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.IMAGE]: { width: 38, height: 24 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.LOGO]: { width: 34, height: 22 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE]: { width: 174, height: 102 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.LINE]: { width: 70, height: 2 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.RECTANGLE]: { width: 50, height: 24 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.QRCODE]: { width: 24, height: 24 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.BARCODE]: { width: 44, height: 16 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.SIGNATURE]: { width: 38, height: 18 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.STAMP]: { width: 26, height: 26 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.PAGE_NUMBER]: { width: 26, height: 6 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.TOTALS_BLOCK]: { width: 58, height: 32 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.COMPANY_BLOCK]: { width: 70, height: 28 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.CLIENT_BLOCK]: { width: 70, height: 28 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.SUPPLIER_BLOCK]: { width: 70, height: 28 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.PAYMENT_BLOCK]: { width: 70, height: 24 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.TAX_BLOCK]: { width: 58, height: 24 },
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.CUSTOM_BLOCK]: { width: 70, height: 24 }
};

const defaultNames: Partial<Record<DOCUMENT_TEMPLATE_ELEMENT_TYPE, string>> = {
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.TEXT]: 'Text',
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.DYNAMIC_TEXT]: 'Dynamic text',
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.LOGO]: 'Logo',
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.IMAGE]: 'Image',
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.SIGNATURE]: 'Signature',
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.STAMP]: 'Stamp',
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE]: 'Items table'
};

export const createTemplateElementAt = ({
  type,
  point,
  pageSettings,
  zIndex,
  partial = {}
}: {
  type: DOCUMENT_TEMPLATE_ELEMENT_TYPE;
  point: TemplateCanvasPoint;
  pageSettings: TemplatePageSettings;
  zIndex: number;
  partial?: Partial<TemplateElement>;
}) => {
  const element = createTemplateElement(type, {
    ...partial,
    name: partial.name || defaultNames[type],
    position: point,
    size: partial.size || defaultSizes[type],
    zIndex,
    binding:
      partial.binding ||
      (type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE ? { path: 'items' } : undefined),
    tableConfig:
      partial.tableConfig ||
      (type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE ? createDefaultTableConfig() : undefined),
    content:
      partial.content ||
      (type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE
        ? 'Items table'
        : type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.DYNAMIC_TEXT
          ? ''
          : undefined)
  });

  return clampElementToPage(element, pageSettings);
};

export const createVariableElementAt = ({
  variable,
  point,
  pageSettings,
  zIndex
}: {
  variable: TemplateVariableDefinition;
  point: TemplateCanvasPoint;
  pageSettings: TemplatePageSettings;
  zIndex: number;
}) =>
  createTemplateElementAt({
    type: variable.elementType || DOCUMENT_TEMPLATE_ELEMENT_TYPE.DYNAMIC_TEXT,
    point,
    pageSettings,
    zIndex,
    partial: {
      name: variable.label,
      binding: { path: variable.key },
      content: variable.valueType === 'image' ? variable.label : '',
      size:
        variable.valueType === 'image'
          ? undefined
          : { width: Math.max(42, Math.min(90, variable.key.length * 2.4)), height: 8 }
    }
  });
