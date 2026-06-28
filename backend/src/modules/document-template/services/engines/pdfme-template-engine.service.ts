import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { Template } from '@pdfme/common';
import { generate } from '@pdfme/generator';
import { image, line, rectangle, table, text } from '@pdfme/schemas';
import {
  GenericDocumentTemplateData,
  TemplateEngineService,
  TemplateRenderOptions,
} from '../../interfaces/template-engine.interface';
import { TemplateSchemaValidatorService } from '../template-schema-validator.service';

type TemplateElement = {
  id: string;
  type: string;
  name: string;
  position?: { x?: number; y?: number };
  size?: { width?: number; height?: number };
  style?: Record<string, unknown>;
  content?: unknown;
  binding?: { path?: string; fallback?: string };
  formatting?: TemplateFormatting;
  tableConfig?: TemplateTableConfig;
  blockConfig?: Record<string, unknown>;
  zIndex?: number;
  visible?: boolean;
  locked?: boolean;
  pageIndex?: number;
};

type TemplateSource = 'ZC_BUILDER_SCHEMA' | 'NATIVE_PDFME_SCHEMA';

type NormalizedPageSettings = {
  width: number;
  height: number;
  padding: [number, number, number, number];
  unit: TemplateUnit;
};

type TemplateUnit = 'mm' | 'px' | 'pt';

type NormalizedTemplateElement = TemplateElement & {
  normalizedPosition: { x: number; y: number };
  normalizedSize: { width: number; height: number };
  normalizedPageIndex: number;
  originalIndex: number;
};

type ConversionWarning = {
  elementId?: string;
  elementType?: string;
  reason: string;
};

type ElementConversionReport = {
  elementId: string;
  elementType: string;
  pageIndex: number;
  schemaCount: number;
  schemaNames: string[];
  resolvedContent?: string;
  warning?: string;
};

type TemplateFormatting = {
  type?:
    | 'currency'
    | 'percentage'
    | 'date'
    | 'number'
    | 'text'
    | 'amountInWords';
  currency?: string;
  locale?: string;
  precision?: number;
  fallback?: string;
};

type TemplateTableColumn = {
  key: string;
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'percent' | 'number' | 'date' | 'text';
  visible?: boolean;
};

type TemplateTableConfig = {
  binding?: string;
  columns?: TemplateTableColumn[];
  headerStyle?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
    fontWeight?: string;
  };
  rowStyle?: {
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
};

const DEFAULT_TABLE_COLUMNS: TemplateTableColumn[] = [
  { key: 'index', label: '#', width: 8, align: 'center', format: 'number' },
  {
    key: 'name',
    label: 'Nom & Description',
    width: 62,
    align: 'left',
    format: 'text',
  },
  {
    key: 'quantity',
    label: 'Quantite',
    width: 18,
    align: 'right',
    format: 'number',
  },
  {
    key: 'unitPrice',
    label: 'P.U',
    width: 24,
    align: 'right',
    format: 'currency',
  },
  {
    key: 'discount',
    label: 'Remise',
    width: 18,
    align: 'right',
    format: 'percent',
  },
  {
    key: 'taxRate',
    label: 'Taxes',
    width: 18,
    align: 'right',
    format: 'percent',
  },
  {
    key: 'totalHT',
    label: 'HT',
    width: 24,
    align: 'right',
    format: 'currency',
  },
  {
    key: 'totalTTC',
    label: 'TTC',
    width: 28,
    align: 'right',
    format: 'currency',
  },
];

const A4_PORTRAIT_WIDTH_MM = 210;
const A4_PORTRAIT_HEIGHT_MM = 297;
const PX_PER_INCH = 96;
const MM_PER_INCH = 25.4;
const PT_PER_INCH = 72;

@Injectable()
export class PdfmeTemplateEngineService extends TemplateEngineService {
  private readonly logger = new Logger(PdfmeTemplateEngineService.name);

  constructor(private readonly validator: TemplateSchemaValidatorService) {
    super();
  }

  createTemplate(schema: Record<string, unknown>): Record<string, unknown> {
    this.validateTemplateSchema(schema);
    return schema;
  }

  updateTemplate(
    schema: Record<string, unknown>,
    patch: Record<string, unknown>,
  ): Record<string, unknown> {
    const nextSchema = { ...schema, ...patch };
    this.validateTemplateSchema(nextSchema);
    return nextSchema;
  }

  validateTemplateSchema(schema: Record<string, unknown>): void {
    this.validator.validate(schema);
  }

  async renderPreview(
    schema: Record<string, unknown>,
    data: GenericDocumentTemplateData,
    options?: TemplateRenderOptions,
  ): Promise<Buffer> {
    return this.generatePdf(schema, data, options);
  }

  async generatePdf(
    schema: Record<string, unknown>,
    data: GenericDocumentTemplateData,
    options?: TemplateRenderOptions,
  ): Promise<Buffer> {
    this.validateTemplateSchema(schema);
    const template = this.toPdfmeTemplate(schema, data, options);
    const inputs = [this.mapVariables(data)];
    const pdf = await generate({
      template,
      inputs,
      plugins: {
        text,
        image,
        table,
        line,
        rectangle,
      },
      options: {
        title: options?.filename || 'document-template-preview.pdf',
        creator: 'Invoicing System',
      },
    });

    return Buffer.from(pdf);
  }

  mapVariables(data: GenericDocumentTemplateData): Record<string, unknown> {
    return this.flatten(data);
  }

  exportTemplate(schema: Record<string, unknown>): Record<string, unknown> {
    this.validateTemplateSchema(schema);
    return schema;
  }

  importTemplate(schema: Record<string, unknown>): Record<string, unknown> {
    this.validateTemplateSchema(schema);
    return schema;
  }

  private toPdfmeTemplate(
    schema: Record<string, unknown>,
    data: GenericDocumentTemplateData,
    options?: TemplateRenderOptions,
  ): Template {
    const source = this.detectTemplateSource(schema);

    if (source === 'NATIVE_PDFME_SCHEMA') {
      this.debugNativeTemplate(schema, options);
      return schema as unknown as Template;
    }

    const pageSettings = this.getPageSettings(schema);
    const warnings: ConversionWarning[] = [];
    const reports: ElementConversionReport[] = [];
    const elements = ((schema.elements || []) as TemplateElement[]).map(
      (element, originalIndex) =>
        this.normalizeElement(element, pageSettings, originalIndex, warnings),
    );
    const visibleElements = elements
      .filter((element) => element.visible !== false)
      .sort(
        (a, b) =>
          a.normalizedPageIndex - b.normalizedPageIndex ||
          (a.zIndex || 0) - (b.zIndex || 0) ||
          a.originalIndex - b.originalIndex,
      );

    const maxPageIndex = visibleElements.reduce(
      (max, element) => Math.max(max, element.normalizedPageIndex),
      0,
    );
    const schemasByPage: Record<string, unknown>[][] = Array.from(
      { length: maxPageIndex + 1 },
      () => [],
    );

    visibleElements.forEach((element) => {
      const elementSchemas = this.toPdfmeSchemas(element, data, warnings);
      schemasByPage[element.normalizedPageIndex].push(...elementSchemas);
      reports.push({
        elementId: element.id,
        elementType: element.type,
        pageIndex: element.normalizedPageIndex,
        schemaCount: elementSchemas.length,
        schemaNames: elementSchemas
          .map((pdfmeSchema) => pdfmeSchema.name)
          .filter((name): name is string => typeof name === 'string'),
        resolvedContent:
          element.type === 'table'
            ? undefined
            : this.getElementContent(element, data),
        warning: elementSchemas.length
          ? undefined
          : 'Visible element did not produce any pdfme schemas',
      });
      if (!elementSchemas.length) {
        warnings.push({
          elementId: element.id,
          elementType: element.type,
          reason: 'Visible element did not produce any pdfme schemas',
        });
      }
    });

    const template = {
      basePdf: {
        width: pageSettings.width,
        height: pageSettings.height,
        padding: pageSettings.padding,
      },
      schemas: schemasByPage.length ? schemasByPage : [[]],
    } as unknown as Template;

    this.debugZcTemplate({
      schema,
      pageSettings,
      visibleElements,
      reports,
      warnings,
      template,
      data,
      options,
    });

    return template;
  }

  private toPdfmeSchemas(
    element: NormalizedTemplateElement,
    data: GenericDocumentTemplateData,
    warnings: ConversionWarning[],
  ): Record<string, unknown>[] {
    if (!this.isRenderableElement(element, warnings)) return [];
    if (element.type === 'table') {
      return this.toTableSchemas(element, data, warnings);
    }
    if (this.isImageElementType(element.type)) {
      return this.toImageSchemas(element, data, warnings);
    }
    if (this.shouldRenderUnsupportedPlaceholder(element.type)) {
      return this.toUnsupportedPlaceholderSchemas(element, data, warnings);
    }
    return [this.toPdfmeSchema(element, data)];
  }

  private toPdfmeSchema(
    element: NormalizedTemplateElement,
    data: GenericDocumentTemplateData,
  ): Record<string, unknown> {
    const style = element.style || {};
    const bindingName = element.id || element.binding?.path || element.name;
    const name = this.normalizeFieldName(bindingName);
    const { x, y } = element.normalizedPosition;
    const { width, height } = element.normalizedSize;
    const content = this.getElementContent(element, data);

    if (element.type === 'rectangle') {
      return {
        name,
        type: 'rectangle',
        position: { x, y },
        width,
        height,
        color: this.asString(style.backgroundColor, '#ffffff'),
        borderColor: this.asString(style.borderColor, '#d4d4d8'),
        borderWidth: this.asNumber(style.borderWidth, 0),
        readOnly: true,
      };
    }

    return {
      name,
      type: this.getPdfmeType(element.type),
      content,
      position: { x, y },
      width,
      height,
      fontSize: Number(style.fontSize || 10),
      fontColor: style.color || '#111827',
      backgroundColor: style.backgroundColor,
      alignment: style.textAlign || 'left',
      verticalAlignment: style.verticalAlign || 'top',
      lineHeight: Number(style.lineHeight || 1),
      readOnly: true,
    };
  }

  private toTableSchemas(
    element: NormalizedTemplateElement,
    data: GenericDocumentTemplateData,
    warnings: ConversionWarning[],
  ): Record<string, unknown>[] {
    const config = this.normalizeTableConfig(element.tableConfig);
    const binding = config.binding || element.binding?.path || 'items';
    const rows = this.getRows(data, binding);
    const columns = this.getVisibleColumns(config);
    if (!columns.length) {
      warnings.push({
        elementId: element.id,
        elementType: element.type,
        reason: 'Table has no visible columns',
      });
      return [];
    }
    const { x, y } = element.normalizedPosition;
    const { width, height } = element.normalizedSize;
    const borderColor = config.borderColor || '#d4d4d8';
    const borderWidth = this.asNumber(config.borderWidth, 0.25);
    const rowHeight = Math.max(this.asNumber(config.rowHeight, 10), 6);
    const headerHeight = Math.max(rowHeight, 7);
    const maxRowsByHeight = Math.max(
      Math.floor((height - headerHeight) / rowHeight),
      0,
    );
    const maxRows =
      typeof config.maxRows === 'number'
        ? Math.max(Math.min(config.maxRows, maxRowsByHeight), 0)
        : maxRowsByHeight;
    const totalWidthUnits = columns.reduce(
      (sum, column) => sum + Math.max(Number(column.width || 0), 1),
      0,
    );
    const schemas: Record<string, unknown>[] = [];

    if (rows.length > maxRows) {
      warnings.push({
        elementId: element.id,
        elementType: element.type,
        reason: `Table rows truncated from ${rows.length} to ${maxRows} by element height`,
      });
    }

    let currentX = x;
    columns.forEach((column, columnIndex) => {
      const columnWidth =
        columnIndex === columns.length - 1
          ? x + width - currentX
          : (width * Math.max(Number(column.width || 1), 1)) / totalWidthUnits;
      const cellName = `${element.id}_header_${column.key}_${columnIndex}`;

      schemas.push(
        this.createRectangleSchema({
          name: `${cellName}_bg`,
          x: currentX,
          y,
          width: columnWidth,
          height: headerHeight,
          color: config.headerStyle?.backgroundColor || '#111827',
          borderColor,
          borderWidth,
        }),
        this.createTextSchema({
          name: `${cellName}_text`,
          content: column.label || column.key,
          x: currentX,
          y,
          width: columnWidth,
          height: headerHeight,
          fontSize: this.asNumber(config.headerStyle?.fontSize, 7),
          fontColor: config.headerStyle?.color || '#ffffff',
          alignment: column.align || 'left',
          verticalAlignment: 'middle',
          padding: this.asNumber(config.padding, 1.5),
        }),
      );

      currentX += columnWidth;
    });

    rows.slice(0, maxRows).forEach((row, rowIndex) => {
      let rowX = x;
      const rowY = y + headerHeight + rowIndex * rowHeight;
      const alternateColor =
        rowIndex % 2 === 1
          ? config.rowStyle?.alternateBackgroundColor || '#f8fafc'
          : '#ffffff';

      columns.forEach((column, columnIndex) => {
        const columnWidth =
          columnIndex === columns.length - 1
            ? x + width - rowX
            : (width * Math.max(Number(column.width || 1), 1)) /
              totalWidthUnits;
        const content = this.formatTableCell(
          this.getColumnValue(row, column),
          row,
          column,
          config,
          data,
        );
        const cellName = `${element.id}_row_${rowIndex}_${column.key}_${columnIndex}`;

        schemas.push(
          this.createRectangleSchema({
            name: `${cellName}_bg`,
            x: rowX,
            y: rowY,
            width: columnWidth,
            height: rowHeight,
            color: alternateColor,
            borderColor,
            borderWidth,
          }),
          this.createTextSchema({
            name: `${cellName}_text`,
            content,
            x: rowX,
            y: rowY,
            width: columnWidth,
            height: rowHeight,
            fontSize: this.asNumber(config.rowStyle?.fontSize, 7),
            fontColor: config.rowStyle?.color || '#111827',
            alignment: column.align || 'left',
            verticalAlignment: 'middle',
            padding: this.asNumber(config.padding, 1.5),
          }),
        );

        rowX += columnWidth;
      });
    });

    return schemas;
  }

  private toImageSchemas(
    element: NormalizedTemplateElement,
    data: GenericDocumentTemplateData,
    warnings: ConversionWarning[],
  ): Record<string, unknown>[] {
    const source = this.getElementContent(element, data);
    if (this.isRenderableImageSource(source)) {
      return [this.toPdfmeSchema(element, data)];
    }

    warnings.push({
      elementId: element.id,
      elementType: element.type,
      reason: source
        ? 'Image source is not a renderable data URI; rendering empty placeholder'
        : 'Image source is missing; rendering empty placeholder',
    });

    const { x, y } = element.normalizedPosition;
    const { width, height } = element.normalizedSize;

    return [
      this.createRectangleSchema({
        name: `${element.id}_placeholder_bg`,
        x,
        y,
        width,
        height,
        color: '#f8fafc',
        borderColor: '#cbd5e1',
        borderWidth: 0.25,
      }),
    ];
  }

  private toUnsupportedPlaceholderSchemas(
    element: NormalizedTemplateElement,
    data: GenericDocumentTemplateData,
    warnings: ConversionWarning[],
  ): Record<string, unknown>[] {
    warnings.push({
      elementId: element.id,
      elementType: element.type,
      reason:
        'Element type is not supported by the pdfme renderer yet; rendering placeholder',
    });

    const { x, y } = element.normalizedPosition;
    const { width, height } = element.normalizedSize;
    const label =
      this.getElementContent(element, data) || element.name || element.type;

    return [
      this.createRectangleSchema({
        name: `${element.id}_unsupported_bg`,
        x,
        y,
        width,
        height,
        color: '#f8fafc',
        borderColor: '#cbd5e1',
        borderWidth: 0.25,
      }),
      this.createTextSchema({
        name: `${element.id}_unsupported_text`,
        content: label,
        x,
        y,
        width,
        height,
        fontSize: Math.min(Math.max(height * 0.25, 6), 10),
        fontColor: '#64748b',
        alignment: 'center',
        verticalAlignment: 'middle',
        padding: 1,
      }),
    ];
  }

  private normalizeTableConfig(
    config?: TemplateTableConfig,
  ): TemplateTableConfig {
    return {
      binding: config?.binding || 'items',
      columns: config?.columns?.length ? config.columns : DEFAULT_TABLE_COLUMNS,
      headerStyle: {
        backgroundColor: '#111827',
        color: '#ffffff',
        fontSize: 7,
        fontWeight: '700',
        ...(config?.headerStyle || {}),
      },
      rowStyle: {
        fontSize: 7,
        color: '#111827',
        alternateBackgroundColor: '#f8fafc',
        minHeight: 9,
        ...(config?.rowStyle || {}),
      },
      borderColor: config?.borderColor || '#d4d4d8',
      borderWidth: config?.borderWidth ?? 0.25,
      padding: config?.padding ?? 1.5,
      rowHeight: config?.rowHeight ?? 10,
      maxRows: config?.maxRows,
      currency: config?.currency || 'TND',
      locale: config?.locale || 'fr-TN',
    };
  }

  private getVisibleColumns(
    config: TemplateTableConfig,
  ): TemplateTableColumn[] {
    const columns = config.columns?.length
      ? config.columns
      : DEFAULT_TABLE_COLUMNS;
    return columns.filter((column) => column.visible !== false);
  }

  private createRectangleSchema({
    name,
    x,
    y,
    width,
    height,
    color,
    borderColor,
    borderWidth,
  }: {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    borderColor: string;
    borderWidth: number;
  }): Record<string, unknown> {
    return {
      name: this.normalizeFieldName(name),
      type: 'rectangle',
      position: { x, y },
      width,
      height,
      color,
      borderColor,
      borderWidth,
      readOnly: true,
    };
  }

  private createTextSchema({
    name,
    content,
    x,
    y,
    width,
    height,
    fontSize,
    fontColor,
    alignment,
    verticalAlignment,
    padding,
  }: {
    name: string;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontColor: string;
    alignment: 'left' | 'center' | 'right';
    verticalAlignment: 'top' | 'middle' | 'bottom';
    padding: number;
  }): Record<string, unknown> {
    return {
      name: this.normalizeFieldName(name),
      type: 'text',
      content,
      position: { x: x + padding, y: y + padding * 0.65 },
      width: Math.max(width - padding * 2, 1),
      height: Math.max(height - padding * 1.3, 1),
      fontSize,
      fontColor,
      alignment,
      verticalAlignment,
      lineHeight: 1,
      readOnly: true,
    };
  }

  private getPageSettings(schema: Record<string, unknown>): {
    width: number;
    height: number;
    padding: [number, number, number, number];
    unit: TemplateUnit;
  } {
    const pageSettings = (schema.pageSettings ||
      schema['page'] ||
      {}) as Record<string, unknown>;
    const margin = (pageSettings.margin || {}) as Record<string, unknown>;
    const unit = this.normalizeUnit(pageSettings.unit);
    const orientation =
      typeof pageSettings.orientation === 'string'
        ? pageSettings.orientation
        : 'portrait';
    const defaultWidth =
      orientation === 'landscape'
        ? A4_PORTRAIT_HEIGHT_MM
        : A4_PORTRAIT_WIDTH_MM;
    const defaultHeight =
      orientation === 'landscape'
        ? A4_PORTRAIT_WIDTH_MM
        : A4_PORTRAIT_HEIGHT_MM;
    const width =
      pageSettings.width == null
        ? defaultWidth
        : this.convertToMm(
            this.asNumber(pageSettings.width, defaultWidth),
            unit,
          );
    const height =
      pageSettings.height == null
        ? defaultHeight
        : this.convertToMm(
            this.asNumber(pageSettings.height, defaultHeight),
            unit,
          );
    const top =
      margin.top == null && pageSettings.marginTop == null
        ? 10
        : this.convertToMm(
            this.asNumber(margin.top ?? pageSettings.marginTop, 10),
            unit,
          );
    const right =
      margin.right == null && pageSettings.marginRight == null
        ? 10
        : this.convertToMm(
            this.asNumber(margin.right ?? pageSettings.marginRight, 10),
            unit,
          );
    const bottom =
      margin.bottom == null && pageSettings.marginBottom == null
        ? 10
        : this.convertToMm(
            this.asNumber(margin.bottom ?? pageSettings.marginBottom, 10),
            unit,
          );
    const left =
      margin.left == null && pageSettings.marginLeft == null
        ? 10
        : this.convertToMm(
            this.asNumber(margin.left ?? pageSettings.marginLeft, 10),
            unit,
          );

    return { width, height, padding: [top, right, bottom, left], unit };
  }

  private getPdfmeType(type: string): string {
    if (this.isImageElementType(type)) return 'image';
    if (type === 'line') return 'line';
    if (type === 'rectangle') return 'rectangle';
    return 'text';
  }

  private getElementContent(
    element: TemplateElement,
    data: GenericDocumentTemplateData,
  ): string {
    if (element.binding?.path) {
      const value = this.getPathValue(data, element.binding.path);
      const formatted = this.formatValue(value, element.formatting, data);
      if (formatted) return formatted;
      if (element.binding.path === 'client.billingAddress') {
        return this.stringifyPrimitives(
          this.getPathValue(data, 'client.address'),
        );
      }
      return element.binding.fallback || '';
    }

    if (typeof element.content === 'string') return element.content;
    if (element.type === 'page_number')
      return '{{currentPage}} / {{totalPages}}';
    return '';
  }

  private normalizeFieldName(path: string): string {
    return path.replace(/\[\]/g, '').replace(/[^a-zA-Z0-9_.-]/g, '_');
  }

  private getRows(
    data: GenericDocumentTemplateData,
    binding: string,
  ): Record<string, unknown>[] {
    const value = this.getPathValue(data, binding.replace(/\[\]/g, ''));
    if (!Array.isArray(value)) return [];

    return value
      .filter((row) => row && typeof row === 'object' && !Array.isArray(row))
      .map((row, index) => ({
        index: index + 1,
        ...(row as Record<string, unknown>),
      }));
  }

  private getColumnValue(
    row: Record<string, unknown>,
    column: TemplateTableColumn,
  ): unknown {
    if (column.key === 'name') {
      const name = this.stringifyPrimitives(row.name);
      const description = this.stringifyPrimitives(row.description);
      return [name, description].filter(Boolean).join('\n');
    }

    return this.getPathValue(row, column.key);
  }

  private formatTableCell(
    value: unknown,
    row: Record<string, unknown>,
    column: TemplateTableColumn,
    config: TemplateTableConfig,
    data: GenericDocumentTemplateData,
  ): string {
    if (column.key === 'index') return String(row.index || '');

    const formatting: TemplateFormatting = {
      type:
        column.format === 'percent'
          ? 'percentage'
          : column.format === 'currency' ||
              column.format === 'number' ||
              column.format === 'date' ||
              column.format === 'text'
            ? column.format
            : 'text',
      currency: config.currency || this.resolveCurrency(data),
      locale: config.locale || 'fr-TN',
    };

    return this.formatValue(value, formatting, data);
  }

  private getPathValue(source: unknown, path: string): unknown {
    if (!source || !path) return undefined;
    const normalizedPath = path.replace(/\[\]/g, '');

    return normalizedPath.split('.').reduce<unknown>((current, key) => {
      if (!current || typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[key];
    }, source);
  }

  private formatValue(
    value: unknown,
    formatting?: TemplateFormatting,
    data?: GenericDocumentTemplateData,
  ): string {
    if (value == null || value === '') return formatting?.fallback || '';

    switch (formatting?.type) {
      case 'currency':
        return this.formatCurrency(
          value,
          formatting.currency || this.resolveCurrency(data),
          formatting.locale,
          formatting.precision,
        );
      case 'percentage':
        return this.formatPercent(
          value,
          formatting.locale,
          formatting.precision,
        );
      case 'number':
        return this.formatNumber(
          value,
          formatting.locale,
          formatting.precision,
        );
      case 'date':
        return this.formatDate(value, formatting.locale);
      case 'amountInWords':
      case 'text':
      default:
        return this.stringifyPrimitives(value);
    }
  }

  private formatCurrency(
    value: unknown,
    currency = 'TND',
    locale = 'fr-TN',
    precision = currency === 'TND' ? 3 : 2,
  ): string {
    const numeric = this.parseNumeric(value);
    if (numeric == null) return this.stringifyPrimitives(value);

    return `${new Intl.NumberFormat(locale, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(numeric)} ${currency}`;
  }

  private formatPercent(
    value: unknown,
    locale = 'fr-TN',
    precision = 2,
  ): string {
    if (typeof value === 'string' && value.includes('%')) return value;
    const numeric = this.parseNumeric(value);
    if (numeric == null) return this.stringifyPrimitives(value);
    const normalized =
      Math.abs(numeric) <= 1 && numeric !== 0 ? numeric * 100 : numeric;
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    }).format(normalized);
    return `${formatted}%`;
  }

  private formatNumber(
    value: unknown,
    locale = 'fr-TN',
    precision = 2,
  ): string {
    const numeric = this.parseNumeric(value);
    if (numeric == null) return this.stringifyPrimitives(value);
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    }).format(numeric);
  }

  private formatDate(value: unknown, locale = 'fr-TN'): string {
    if (value instanceof Date) {
      return new Intl.DateTimeFormat(locale).format(value);
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return new Intl.DateTimeFormat(locale).format(parsed);
      }
      return value;
    }

    return this.stringifyPrimitives(value);
  }

  private resolveCurrency(data?: GenericDocumentTemplateData): string {
    const currency = this.getPathValue(data, 'document.currency');
    if (typeof currency === 'string' && currency.trim()) return currency.trim();
    return 'TND';
  }

  private parseNumeric(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;

    const normalized = value
      .replace(/\s/g, '')
      .replace(/[^\d,.-]/g, '')
      .replace(',', '.');
    if (!normalized) return null;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private asString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value : fallback;
  }

  private asNumber(value: unknown, fallback: number): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private flatten(
    value: unknown,
    parentKey = '',
    result: Record<string, unknown> = {},
  ): Record<string, unknown> {
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object') {
        const rows = value.map((item) => {
          const row = item as Record<string, unknown>;
          const vals = [
            row.name || row.description || '',
            row.quantity ? `Qty: ${row.quantity}` : '',
            row.unitPrice ? `Price: ${row.unitPrice}` : '',
            row.totalTTC || row.totalHT
              ? `Total: ${row.totalTTC || row.totalHT}`
              : '',
          ].filter(Boolean);
          return vals.join(' | ');
        });
        result[parentKey] = rows.join('\n');
        this.flattenArrayFields(
          value as Record<string, unknown>[],
          parentKey,
          result,
        );
      } else {
        result[parentKey] = value
          .map((item) => this.stringifyPrimitives(item))
          .join(', ');
      }
      return result;
    }

    if (value && typeof value === 'object') {
      for (const [key, nestedValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        const nextKey = parentKey ? `${parentKey}.${key}` : key;
        this.flatten(nestedValue, nextKey, result);
      }
      return result;
    }

    if (parentKey) {
      result[parentKey] = value != null ? String(value) : '';
    }
    return result;
  }

  private flattenArrayFields(
    rows: Record<string, unknown>[],
    parentKey: string,
    result: Record<string, unknown>,
  ): void {
    if (!parentKey) return;
    const fieldNames = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => fieldNames.add(key));
    });

    fieldNames.forEach((fieldName) => {
      const joined = rows
        .map((row) => this.stringifyPrimitives(row[fieldName]))
        .filter((value) => value !== '')
        .join('\n');
      result[`${parentKey}.${fieldName}`] = joined;
      result[`${parentKey}[].${fieldName}`] = joined;
    });
  }

  private stringifyPrimitives(value: unknown): string {
    if (value == null) return '';
    if (value instanceof Date) return value.toISOString();
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => this.stringifyPrimitives(item))
        .filter(Boolean)
        .join('\n');
    }
    return '';
  }

  private detectTemplateSource(
    schema: Record<string, unknown>,
  ): TemplateSource {
    const hasPdfmeShape = Array.isArray(schema.schemas) && !!schema.basePdf;
    const hasZcShape = Array.isArray(schema.elements);

    if (hasPdfmeShape && hasZcShape) {
      throw new BadRequestException(
        'Template schema is ambiguous: it contains both ZC builder elements and native pdfme schemas',
      );
    }
    if (hasPdfmeShape) return 'NATIVE_PDFME_SCHEMA';
    if (hasZcShape) return 'ZC_BUILDER_SCHEMA';

    throw new BadRequestException(
      'Template schema must be a ZC builder schema or a native pdfme schema',
    );
  }

  private normalizeElement(
    element: TemplateElement,
    pageSettings: NormalizedPageSettings,
    originalIndex: number,
    warnings: ConversionWarning[],
  ): NormalizedTemplateElement {
    const id = element.id || `element_${originalIndex}`;
    const type = element.type || 'text';
    const x = this.convertCoordinateToMm(
      element.position?.x,
      pageSettings.unit,
      0,
      id,
      type,
      'x',
      warnings,
    );
    const y = this.convertCoordinateToMm(
      element.position?.y,
      pageSettings.unit,
      0,
      id,
      type,
      'y',
      warnings,
    );
    const width = this.convertCoordinateToMm(
      element.size?.width,
      pageSettings.unit,
      40,
      id,
      type,
      'width',
      warnings,
    );
    const height = this.convertCoordinateToMm(
      element.size?.height,
      pageSettings.unit,
      10,
      id,
      type,
      'height',
      warnings,
    );
    const pageIndex = Number(element.pageIndex || 0);

    return {
      ...element,
      id,
      type,
      normalizedPosition: { x, y },
      normalizedSize: { width, height },
      normalizedPageIndex:
        Number.isFinite(pageIndex) && pageIndex > 0 ? Math.floor(pageIndex) : 0,
      originalIndex,
    };
  }

  private isRenderableElement(
    element: NormalizedTemplateElement,
    warnings: ConversionWarning[],
  ): boolean {
    const { width, height } = element.normalizedSize;
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      warnings.push({
        elementId: element.id,
        elementType: element.type,
        reason: 'Element size is not finite',
      });
      return false;
    }
    if (width <= 0 || height <= 0) {
      warnings.push({
        elementId: element.id,
        elementType: element.type,
        reason: 'Element width and height must be greater than zero',
      });
      return false;
    }
    return true;
  }

  private convertCoordinateToMm(
    value: unknown,
    unit: TemplateUnit,
    fallback: number,
    elementId: string,
    elementType: string,
    field: string,
    warnings: ConversionWarning[],
  ): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      warnings.push({
        elementId,
        elementType,
        reason: `Invalid ${field}; using fallback ${fallback}mm`,
      });
      return fallback;
    }
    return this.convertToMm(parsed, unit);
  }

  private normalizeUnit(unit: unknown): TemplateUnit {
    if (unit === 'px' || unit === 'pt' || unit === 'mm') return unit;
    return 'mm';
  }

  private convertToMm(value: number, unit: TemplateUnit): number {
    if (unit === 'px') return (value * MM_PER_INCH) / PX_PER_INCH;
    if (unit === 'pt') return (value * MM_PER_INCH) / PT_PER_INCH;
    return value;
  }

  private isRenderableImageSource(source: string): boolean {
    return /^(data:image\/|https?:\/\/)/i.test(source.trim());
  }

  private isImageElementType(type: string): boolean {
    return ['image', 'logo', 'signature', 'stamp'].includes(type);
  }

  private shouldRenderUnsupportedPlaceholder(type: string): boolean {
    return ![
      'text',
      'dynamic_text',
      'page_number',
      'line',
      'rectangle',
      'table',
      'image',
      'logo',
      'signature',
      'stamp',
    ].includes(type);
  }

  private isDebugEnabled(): boolean {
    return process.env.DOCUMENT_TEMPLATE_RENDER_DEBUG === 'true';
  }

  private debugNativeTemplate(
    schema: Record<string, unknown>,
    options?: TemplateRenderOptions,
  ): void {
    if (!this.isDebugEnabled()) return;
    this.logger.debug(
      JSON.stringify({
        source: 'NATIVE_PDFME_SCHEMA',
        templateId: options?.templateId,
        documentType: options?.documentType,
        filename: options?.filename,
        pages: Array.isArray(schema.schemas) ? schema.schemas.length : 0,
      }),
    );
  }

  private debugZcTemplate({
    schema,
    pageSettings,
    visibleElements,
    reports,
    warnings,
    template,
    data,
    options,
  }: {
    schema: Record<string, unknown>;
    pageSettings: NormalizedPageSettings;
    visibleElements: NormalizedTemplateElement[];
    reports: ElementConversionReport[];
    warnings: ConversionWarning[];
    template: Template;
    data: GenericDocumentTemplateData;
    options?: TemplateRenderOptions;
  }): void {
    if (!this.isDebugEnabled()) return;
    const totalElementCount = ((schema.elements || []) as TemplateElement[])
      .length;
    const hiddenCount = ((schema.elements || []) as TemplateElement[]).filter(
      (element) => element.visible === false,
    ).length;
    const payload = {
      source: 'ZC_BUILDER_SCHEMA',
      templateId: options?.templateId,
      documentType: options?.documentType,
      filename: options?.filename,
      pageSettings,
      totalElementCount,
      visibleElementCount: visibleElements.length,
      hiddenElementCount: hiddenCount,
      generatedPageCount: template.schemas.length,
      generatedSchemaCount: template.schemas.reduce(
        (count, page) => count + page.length,
        0,
      ),
      mappedDataKeys: Object.keys(this.flatten(data)),
      reports,
      warnings,
    };
    this.logger.debug(JSON.stringify(payload));
  }
}
