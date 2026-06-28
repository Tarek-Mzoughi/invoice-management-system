import {
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
  DOCUMENT_TEMPLATE_ELEMENT_TYPE,
  TemplateElement,
  TemplatePageSettings
} from '@/types';

export const TEMPLATE_PAGE_DROPPABLE_ID = 'template-editor-page';

export type TemplateRightTab = 'properties' | 'variables' | 'layers' | 'versions';

export type TemplateDragData =
  | {
      kind: 'element';
      elementType: DOCUMENT_TEMPLATE_ELEMENT_TYPE;
      label: string;
    }
  | {
      kind: 'variable';
      variable: TemplateVariableDefinition;
      label: string;
    };

export interface TemplateCanvasPoint {
  x: number;
  y: number;
}

export interface TemplateSelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplateVariableDefinition {
  key: string;
  label: string;
  example: string;
  valueType?: 'text' | 'image';
  elementType?: DOCUMENT_TEMPLATE_ELEMENT_TYPE;
  documentTypes?: DOCUMENT_TEMPLATE_DOCUMENT_TYPE[];
}

export interface TemplateVariableGroup {
  label: string;
  variables: TemplateVariableDefinition[];
}

export interface TemplateValidationResult {
  errors: string[];
  warnings: string[];
}

export interface TemplateElementInteraction {
  type: 'move' | 'resize' | 'group-move';
  element: TemplateElement;
  elements?: TemplateElement[];
  startClientX: number;
  startClientY: number;
  startPosition: TemplateElement['position'];
  startSize: TemplateElement['size'];
  pageSettings: TemplatePageSettings;
}
