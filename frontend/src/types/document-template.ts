import { DatabaseEntity } from './response/DatabaseEntity';
import { PagedResponse } from './response';

export enum DOCUMENT_TEMPLATE_DOCUMENT_TYPE {
  INVOICE = 'INVOICE',
  QUOTE = 'QUOTE',
  CUSTOMER_ORDER = 'CUSTOMER_ORDER',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  GOODS_ISSUE_NOTE = 'GOODS_ISSUE_NOTE',
  CREDIT_NOTE = 'CREDIT_NOTE',
  RETURN_NOTE = 'RETURN_NOTE',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  SUPPLIER_INVOICE = 'SUPPLIER_INVOICE',
  SUPPLIER_CREDIT_NOTE = 'SUPPLIER_CREDIT_NOTE',
  RECEIPT = 'RECEIPT',
  CUSTOM_DOCUMENT = 'CUSTOM_DOCUMENT'
}

export enum DOCUMENT_TEMPLATE_STATUS {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum DOCUMENT_TEMPLATE_ELEMENT_TYPE {
  TEXT = 'text',
  DYNAMIC_TEXT = 'dynamic_text',
  IMAGE = 'image',
  LOGO = 'logo',
  TABLE = 'table',
  LINE = 'line',
  RECTANGLE = 'rectangle',
  QRCODE = 'qrcode',
  BARCODE = 'barcode',
  SIGNATURE = 'signature',
  STAMP = 'stamp',
  PAGE_NUMBER = 'page_number',
  TOTALS_BLOCK = 'totals_block',
  COMPANY_BLOCK = 'company_block',
  CLIENT_BLOCK = 'client_block',
  SUPPLIER_BLOCK = 'supplier_block',
  PAYMENT_BLOCK = 'payment_block',
  TAX_BLOCK = 'tax_block',
  CUSTOM_BLOCK = 'custom_block'
}

export type TemplateUnit = 'mm' | 'px' | 'pt';
export type TemplatePreset = 'classic' | 'modern' | 'minimal';

export interface TemplatePageSettings {
  format: 'A4' | string;
  orientation: 'portrait' | 'landscape';
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  width: number;
  height: number;
  unit: TemplateUnit;
}

export type TemplateTableColumnFormat = 'currency' | 'percent' | 'number' | 'date' | 'text';

export interface TemplateTableColumn {
  key: string;
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  format?: TemplateTableColumnFormat;
  visible?: boolean;
}

export interface TemplateTableConfig {
  binding: string;
  columns: TemplateTableColumn[];
  headerStyle: {
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
    fontWeight?: string;
  };
  rowStyle: {
    fontSize?: number;
    color?: string;
    alternateBackgroundColor?: string;
    minHeight?: number;
  };
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  rowHeight?: number;
  maxRows?: number;
  currency?: string;
  locale?: string;
}

export interface TemplateElementFormatting {
  type?: 'currency' | 'percentage' | 'date' | 'number' | 'text' | 'amountInWords';
  currency?: string;
  locale?: string;
  precision?: number;
  fallback?: string;
}

export interface TemplateElement {
  id: string;
  type: DOCUMENT_TEMPLATE_ELEMENT_TYPE;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    lineHeight?: number;
  };
  content?: string;
  binding?: { path?: string; fallback?: string };
  formatting?: TemplateElementFormatting;
  tableConfig?: TemplateTableConfig;
  blockConfig?: Record<string, unknown>;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  pageIndex: number;
  conditions?: Record<string, unknown>[];
}

export interface TemplateSchema {
  metadata: {
    id?: string;
    name: string;
    documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;
    version: number;
    locale: string;
    direction: 'ltr' | 'rtl';
    currency: string;
    defaultFont: string;
    createdAt?: string;
    updatedAt?: string;
  };
  pageSettings: TemplatePageSettings;
  variables: Record<string, unknown>;
  elements: TemplateElement[];
  styles: Record<string, unknown>;
}

export interface DocumentTemplate extends DatabaseEntity {
  id: number;
  name: string;
  slug: string;
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;
  status: DOCUMENT_TEMPLATE_STATUS;
  isDefault: boolean;
  versionNumber: number;
  templateSchema: TemplateSchema;
  pageSettings?: TemplatePageSettings;
  variablesConfig?: Record<string, unknown>;
  thumbnailUrl?: string;
  thumbnailStorageId?: number;
  categoryId?: number;
  cabinetId: number;
  createdById?: string;
  updatedById?: string;
}

export interface DocumentTemplateVersion extends DatabaseEntity {
  id: number;
  templateId: number;
  versionNumber: number;
  name: string;
  status: DOCUMENT_TEMPLATE_STATUS;
  templateSchema: TemplateSchema;
  pageSettings?: TemplatePageSettings;
  variablesConfig?: Record<string, unknown>;
  changeDescription?: string;
}

export interface DocumentTemplateAsset extends DatabaseEntity {
  id: number;
  templateId?: number;
  storageId: number;
  assetType: 'IMAGE' | 'LOGO' | 'FONT' | 'THUMBNAIL' | 'ATTACHMENT';
  name: string;
  metadata?: Record<string, unknown>;
}

export type PagedDocumentTemplate = PagedResponse<DocumentTemplate>;

export const DEFAULT_INVOICE_TABLE_COLUMNS: TemplateTableColumn[] = [
  { key: 'index', label: '#', width: 8, align: 'center', format: 'number' },
  { key: 'name', label: 'Nom & Description', width: 62, align: 'left', format: 'text' },
  { key: 'quantity', label: 'Quantite', width: 18, align: 'right', format: 'number' },
  { key: 'unitPrice', label: 'P.U', width: 24, align: 'right', format: 'currency' },
  { key: 'discount', label: 'Remise', width: 18, align: 'right', format: 'percent' },
  { key: 'taxRate', label: 'Taxes', width: 18, align: 'right', format: 'percent' },
  { key: 'totalHT', label: 'HT', width: 24, align: 'right', format: 'currency' },
  { key: 'totalTTC', label: 'TTC', width: 28, align: 'right', format: 'currency' }
];

export const createDefaultTableConfig = (
  overrides: Partial<TemplateTableConfig> = {}
): TemplateTableConfig => {
  const defaults: TemplateTableConfig = {
    binding: 'items',
    columns: DEFAULT_INVOICE_TABLE_COLUMNS.map((column) => ({
      ...column,
      visible: column.visible ?? true
    })),
    headerStyle: {
      backgroundColor: '#111827',
      color: '#ffffff',
      fontSize: 7,
      fontWeight: '700'
    },
    rowStyle: {
      fontSize: 7,
      color: '#111827',
      alternateBackgroundColor: '#f8fafc',
      minHeight: 9
    },
    borderColor: '#d4d4d8',
    borderWidth: 0.25,
    padding: 1.6,
    rowHeight: 10,
    maxRows: 10,
    currency: 'TND',
    locale: 'fr-TN'
  };

  return {
    ...defaults,
    ...overrides,
    headerStyle: {
      ...defaults.headerStyle,
      ...(overrides.headerStyle || {})
    },
    rowStyle: {
      ...defaults.rowStyle,
      ...(overrides.rowStyle || {})
    },
    columns: overrides.columns || defaults.columns
  };
};

const templatePresetThemes: Record<
  TemplatePreset,
  {
    primary: string;
    surface: string;
    muted: string;
    border: string;
    tableHeaderBackground: string;
    tableHeaderColor: string;
    alternateRow: string;
  }
> = {
  classic: {
    primary: '#111827',
    surface: '#f8fafc',
    muted: '#52525b',
    border: '#d4d4d8',
    tableHeaderBackground: '#111827',
    tableHeaderColor: '#ffffff',
    alternateRow: '#f8fafc'
  },
  modern: {
    primary: '#1d4ed8',
    surface: '#eff6ff',
    muted: '#475569',
    border: '#bfdbfe',
    tableHeaderBackground: '#1d4ed8',
    tableHeaderColor: '#ffffff',
    alternateRow: '#eff6ff'
  },
  minimal: {
    primary: '#18181b',
    surface: '#ffffff',
    muted: '#52525b',
    border: '#d4d4d8',
    tableHeaderBackground: '#f4f4f5',
    tableHeaderColor: '#18181b',
    alternateRow: '#ffffff'
  }
};

export interface CreateDocumentTemplateDto {
  name: string;
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;
  status?: DOCUMENT_TEMPLATE_STATUS;
  isDefault?: boolean;
  templateSchema?: TemplateSchema;
  pageSettings?: TemplatePageSettings;
  variablesConfig?: Record<string, unknown>;
  thumbnailUrl?: string;
  thumbnailStorageId?: number;
  categoryId?: number;
  cabinetId?: number;
}

export type UpdateDocumentTemplateDto = Partial<CreateDocumentTemplateDto>;

export interface DocumentTemplatePreviewDto {
  sampleData?: Record<string, unknown>;
  templateSchema?: TemplateSchema;
  documentId?: number;
  cabinetId?: number;
  persist?: boolean;
}

export interface DocumentTemplateDocumentRenderDto {
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;
  documentId: number;
  templateId?: number;
  cabinetId?: number;
  storeGeneratedDocument?: boolean;
}

export const createTemplateElement = (
  type: DOCUMENT_TEMPLATE_ELEMENT_TYPE,
  partial: Partial<TemplateElement> = {}
): TemplateElement => {
  const id = partial.id || `element_${Date.now()}_${Math.round(Math.random() * 1000)}`;

  return {
    id,
    type,
    name: partial.name || type.replace(/_/g, ' '),
    position: partial.position || { x: 20, y: 30 },
    size:
      partial.size ||
      (type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE
        ? { width: 174, height: 102 }
        : type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.IMAGE ||
            type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.LOGO
          ? { width: 38, height: 24 }
          : { width: 80, height: 12 }),
    style: {
      fontSize: 10,
      color: '#111827',
      textAlign: 'left',
      ...(partial.style || {})
    },
    content:
      partial.content ||
      (type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.DYNAMIC_TEXT
        ? ''
        : type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE
          ? 'Items table'
          : 'Text'),
    binding:
      partial.binding || (type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE ? { path: 'items' } : {}),
    formatting: partial.formatting,
    tableConfig:
      partial.tableConfig ||
      (type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE ? createDefaultTableConfig() : undefined),
    blockConfig: partial.blockConfig,
    zIndex: partial.zIndex ?? 1,
    visible: partial.visible ?? true,
    locked: partial.locked ?? false,
    pageIndex: partial.pageIndex ?? 0,
    conditions: partial.conditions || []
  };
};

export const createDefaultTemplateSchema = (
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
  name: string,
  preset: TemplatePreset = 'classic'
): TemplateSchema => {
  const documentTitle = getDocumentTemplateTitle(documentType, name);

  return {
    metadata: {
      name,
      documentType,
      version: 1,
      locale: 'fr',
      direction: 'ltr',
      currency: 'TND',
      defaultFont: 'Helvetica',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    pageSettings: {
      format: 'A4',
      orientation: 'portrait',
      unit: 'mm',
      width: 210,
      height: 297,
      margin: { top: 12, right: 12, bottom: 12, left: 12 }
    },
    variables: {},
    elements: buildClassicInvoicePreset(documentTitle, documentType, preset),
    styles: {}
  };
};

const getDocumentTemplateTitle = (
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
  fallback: string
) => {
  const titles: Partial<Record<DOCUMENT_TEMPLATE_DOCUMENT_TYPE, string>> = {
    [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.INVOICE]: 'FACTURE',
    [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.QUOTE]: 'DEVIS',
    [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CUSTOMER_ORDER]: 'COMMANDE CLIENT',
    [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.DELIVERY_NOTE]: 'BON DE LIVRAISON',
    [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.GOODS_ISSUE_NOTE]: 'BON DE SORTIE',
    [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CREDIT_NOTE]: 'AVOIR',
    [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RETURN_NOTE]: 'BON DE RETOUR',
    [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.PURCHASE_ORDER]: 'COMMANDE FOURNISSEUR',
    [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_INVOICE]: 'FACTURE FOURNISSEUR',
    [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_CREDIT_NOTE]: 'AVOIR FOURNISSEUR',
    [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RECEIPT]: 'RECU'
  };

  return titles[documentType] || fallback || 'DOCUMENT';
};

const dynamicText = (
  name: string,
  path: string,
  position: TemplateElement['position'],
  size: TemplateElement['size'],
  style: TemplateElement['style'] = {},
  formatting?: TemplateElementFormatting
) =>
  createTemplateElement(DOCUMENT_TEMPLATE_ELEMENT_TYPE.DYNAMIC_TEXT, {
    name,
    binding: { path },
    position,
    size,
    style,
    formatting
  });

const staticText = (
  name: string,
  content: string,
  position: TemplateElement['position'],
  size: TemplateElement['size'],
  style: TemplateElement['style'] = {}
) =>
  createTemplateElement(DOCUMENT_TEMPLATE_ELEMENT_TYPE.TEXT, {
    name,
    content,
    position,
    size,
    style
  });

const supplierPresetTypes = new Set<DOCUMENT_TEMPLATE_DOCUMENT_TYPE>([
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.PURCHASE_ORDER,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_INVOICE,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_CREDIT_NOTE
]);

const buildClassicInvoicePreset = (
  documentTitle: string,
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
  preset: TemplatePreset
): TemplateElement[] => {
  const partnerKey = supplierPresetTypes.has(documentType) ? 'supplier' : 'client';
  const partnerLabel = partnerKey === 'supplier' ? 'Fournisseur' : 'Client';
  const partnerAddressPath =
    partnerKey === 'supplier' ? 'supplier.address' : 'client.billingAddress';
  const theme = templatePresetThemes[preset] || templatePresetThemes.classic;
  const tableConfig = createDefaultTableConfig({
    headerStyle: {
      backgroundColor: theme.tableHeaderBackground,
      color: theme.tableHeaderColor
    },
    rowStyle: {
      alternateBackgroundColor: theme.alternateRow,
      color: theme.primary
    },
    borderColor: theme.border
  });

  return [
    createTemplateElement(DOCUMENT_TEMPLATE_ELEMENT_TYPE.LOGO, {
      name: 'Company logo',
      binding: { path: 'company.logo' },
      position: { x: 18, y: 16 },
      size: { width: 34, height: 22 },
      style: { borderColor: '#e5e7eb', borderWidth: 0.2 }
    }),
    dynamicText(
      'Company name',
      'company.name',
      { x: 18, y: 42 },
      { width: 78, height: 7 },
      {
        fontSize: 10,
        fontWeight: '700',
        color: theme.primary
      }
    ),
    dynamicText(
      'Company address',
      'company.address',
      { x: 18, y: 50 },
      { width: 78, height: 13 },
      {
        fontSize: 7,
        color: theme.muted
      }
    ),
    dynamicText(
      'Company contact',
      'company.phone',
      { x: 18, y: 64 },
      { width: 78, height: 6 },
      {
        fontSize: 7,
        color: theme.muted
      }
    ),
    dynamicText(
      'Company email',
      'company.email',
      { x: 18, y: 71 },
      { width: 78, height: 6 },
      {
        fontSize: 7,
        color: theme.muted
      }
    ),
    dynamicText(
      'Company tax number',
      'company.taxNumber',
      { x: 18, y: 78 },
      { width: 78, height: 6 },
      {
        fontSize: 7,
        color: theme.muted
      }
    ),

    staticText(
      'Document title',
      documentTitle,
      { x: 118, y: 18 },
      { width: 74, height: 12 },
      {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'right',
        color: theme.primary
      }
    ),
    dynamicText(
      'Document number',
      'document.number',
      { x: 128, y: 34 },
      { width: 64, height: 7 },
      {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'right',
        color: '#111827'
      }
    ),
    staticText(
      'Date',
      'Date',
      { x: 118, y: 45 },
      { width: 24, height: 6 },
      {
        fontSize: 7,
        color: '#71717a',
        textAlign: 'right'
      }
    ),
    dynamicText(
      'Document date',
      'document.date',
      { x: 146, y: 45 },
      { width: 46, height: 6 },
      {
        fontSize: 8,
        textAlign: 'right'
      }
    ),
    staticText(
      'Due date label',
      'Echeance',
      { x: 118, y: 53 },
      { width: 24, height: 6 },
      {
        fontSize: 7,
        color: '#71717a',
        textAlign: 'right'
      }
    ),
    dynamicText(
      'Due date',
      'document.dueDate',
      { x: 146, y: 53 },
      { width: 46, height: 6 },
      {
        fontSize: 8,
        textAlign: 'right'
      }
    ),

    createTemplateElement(DOCUMENT_TEMPLATE_ELEMENT_TYPE.RECTANGLE, {
      name: 'Client card background',
      position: { x: 118, y: 68 },
      size: { width: 74, height: 28 },
      style: {
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 0.25,
        borderRadius: 2
      },
      locked: true,
      zIndex: 0
    }),
    staticText(
      'Partner label',
      partnerLabel,
      { x: 122, y: 72 },
      { width: 64, height: 5 },
      {
        fontSize: 7,
        fontWeight: '700',
        color: '#71717a'
      }
    ),
    dynamicText(
      'Partner name',
      `${partnerKey}.name`,
      { x: 122, y: 79 },
      { width: 64, height: 6 },
      {
        fontSize: 9,
        fontWeight: '700'
      }
    ),
    dynamicText(
      'Partner address',
      partnerAddressPath,
      { x: 122, y: 86 },
      { width: 64, height: 8 },
      {
        fontSize: 7,
        color: theme.muted
      }
    ),

    staticText(
      'Object label',
      'Objet',
      { x: 18, y: 92 },
      { width: 18, height: 6 },
      {
        fontSize: 7,
        fontWeight: '700',
        color: '#71717a'
      }
    ),
    dynamicText(
      'Document object',
      'document.object',
      { x: 38, y: 92 },
      { width: 154, height: 7 },
      {
        fontSize: 8,
        color: theme.primary
      }
    ),

    createTemplateElement(DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE, {
      name: 'Items table',
      binding: { path: 'items' },
      position: { x: 18, y: 106 },
      size: { width: 174, height: 102 },
      zIndex: 2,
      tableConfig
    }),

    staticText(
      'Total HT label',
      'Total HT',
      { x: 116, y: 218 },
      { width: 38, height: 7 },
      {
        fontSize: 8,
        color: '#52525b',
        textAlign: 'right'
      }
    ),
    dynamicText(
      'Total HT',
      'totals.totalHT',
      { x: 156, y: 218 },
      { width: 36, height: 7 },
      {
        fontSize: 8,
        textAlign: 'right'
      },
      { type: 'currency' }
    ),
    staticText(
      'Discount label',
      'Remise',
      { x: 116, y: 227 },
      { width: 38, height: 7 },
      {
        fontSize: 8,
        color: '#52525b',
        textAlign: 'right'
      }
    ),
    dynamicText(
      'Discount',
      'totals.discount',
      { x: 156, y: 227 },
      { width: 36, height: 7 },
      {
        fontSize: 8,
        textAlign: 'right'
      },
      { type: 'currency' }
    ),
    staticText(
      'TVA label',
      'Total TVA',
      { x: 116, y: 236 },
      { width: 38, height: 7 },
      {
        fontSize: 8,
        color: '#52525b',
        textAlign: 'right'
      }
    ),
    dynamicText(
      'Total TVA',
      'totals.totalTVA',
      { x: 156, y: 236 },
      { width: 36, height: 7 },
      {
        fontSize: 8,
        textAlign: 'right'
      },
      { type: 'currency' }
    ),
    createTemplateElement(DOCUMENT_TEMPLATE_ELEMENT_TYPE.RECTANGLE, {
      name: 'Total TTC background',
      position: { x: 116, y: 246 },
      size: { width: 76, height: 12 },
      style: { backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 0.25 },
      locked: true,
      zIndex: 0
    }),
    staticText(
      'Total TTC label',
      'Total TTC',
      { x: 120, y: 249 },
      { width: 34, height: 6 },
      {
        fontSize: 8,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'right'
      }
    ),
    dynamicText(
      'Total TTC',
      'totals.totalTTC',
      { x: 156, y: 249 },
      { width: 32, height: 6 },
      {
        fontSize: 9,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'right'
      },
      { type: 'currency' }
    ),
    dynamicText(
      'Amount in words',
      'totals.amountInWords',
      { x: 18, y: 218 },
      { width: 86, height: 12 },
      {
        fontSize: 7,
        color: '#52525b'
      }
    ),

    staticText(
      'Bank label',
      'Coordonnees bancaires',
      { x: 18, y: 242 },
      { width: 72, height: 6 },
      {
        fontSize: 7,
        fontWeight: '700',
        color: '#71717a'
      }
    ),
    dynamicText(
      'Bank name',
      'bank.name',
      { x: 18, y: 250 },
      { width: 78, height: 6 },
      {
        fontSize: 7,
        color: '#52525b'
      }
    ),
    dynamicText(
      'Bank rib',
      'bank.rib',
      { x: 18, y: 258 },
      { width: 78, height: 6 },
      {
        fontSize: 7,
        color: '#52525b'
      }
    ),
    dynamicText(
      'Bank iban',
      'bank.iban',
      { x: 18, y: 266 },
      { width: 78, height: 6 },
      {
        fontSize: 7,
        color: '#52525b'
      }
    ),

    staticText(
      'Signature label',
      'Cachet & Signature',
      { x: 126, y: 270 },
      { width: 66, height: 7 },
      {
        fontSize: 8,
        fontWeight: '700',
        textAlign: 'center',
        color: '#52525b'
      }
    ),
    createTemplateElement(DOCUMENT_TEMPLATE_ELEMENT_TYPE.RECTANGLE, {
      name: 'Signature area',
      position: { x: 126, y: 278 },
      size: { width: 66, height: 14 },
      style: { backgroundColor: '#ffffff', borderColor: '#d4d4d8', borderWidth: 0.25 },
      locked: true,
      zIndex: 0
    })
  ];
};
