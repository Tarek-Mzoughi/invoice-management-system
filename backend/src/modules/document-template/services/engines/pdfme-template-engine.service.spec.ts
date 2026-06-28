import type { Template } from '@pdfme/common';
import { GenericDocumentTemplateData } from '../../interfaces/template-engine.interface';
import { PdfmeTemplateEngineService } from './pdfme-template-engine.service';
import { TemplateSchemaValidatorService } from '../template-schema-validator.service';

jest.mock('@pdfme/generator', () => ({
  generate: jest.fn(),
}));

jest.mock('@pdfme/schemas', () => ({
  image: {},
  line: {},
  rectangle: {},
  table: {},
  text: {},
}));

describe('PdfmeTemplateEngineService', () => {
  let service: PdfmeTemplateEngineService;

  const data: GenericDocumentTemplateData = {
    company: {
      name: 'ZC Company',
      logo: 'storage/company-logo.png',
    },
    client: {
      name: 'Client SARL',
    },
    document: {
      number: 'INV-2026-49',
      date: '2026-04-29',
      dueDate: '2026-05-29',
      currency: 'TND',
    },
    items: [
      {
        name: 'Consulting',
        description: 'Implementation',
        quantity: 2,
        unitPrice: 100,
        discount: 0,
        taxRate: 19,
        totalHT: 200,
        totalTTC: 238,
      },
    ],
    totals: {
      totalHT: 200,
      totalTVA: 38,
      totalTTC: 238,
    },
  };

  const buildTemplate = (
    schema: Record<string, unknown>,
    templateData = data,
  ): Template =>
    (
      service as unknown as {
        toPdfmeTemplate: (
          schema: Record<string, unknown>,
          data: GenericDocumentTemplateData,
        ) => Template;
      }
    ).toPdfmeTemplate(schema, templateData);

  beforeEach(() => {
    service = new PdfmeTemplateEngineService(
      new TemplateSchemaValidatorService(),
    );
  });

  it('passes native pdfme schemas through without ZC normalization', () => {
    const nativeTemplate = {
      basePdf: { width: 210, height: 297, padding: [0, 0, 0, 0] },
      schemas: [
        [
          {
            name: 'document.number',
            type: 'text',
            position: { x: 20, y: 30 },
            width: 50,
            height: 10,
            readOnly: false,
          },
        ],
      ],
    };

    expect(buildTemplate(nativeTemplate)).toBe(nativeTemplate);
  });

  it('converts ZC text elements to readonly resolved pdfme schemas', () => {
    const template = buildTemplate({
      pageSettings: { width: 210, height: 297, unit: 'mm' },
      elements: [
        {
          id: 'invoice_number',
          type: 'dynamic_text',
          name: 'Invoice number',
          position: { x: 20, y: 30 },
          size: { width: 50, height: 10 },
          zIndex: 1,
          visible: true,
          locked: false,
          pageIndex: 0,
          binding: { path: 'document.number' },
          style: { fontSize: 12, color: '#111827' },
        },
      ],
    });

    expect(template.schemas).toHaveLength(1);
    expect(template.schemas[0][0]).toMatchObject({
      name: 'invoice_number',
      type: 'text',
      content: 'INV-2026-49',
      position: { x: 20, y: 30 },
      width: 50,
      height: 10,
      fontSize: 12,
      fontColor: '#111827',
      readOnly: true,
    });
  });

  it('renders locked elements and skips hidden elements', () => {
    const template = buildTemplate({
      elements: [
        {
          id: 'locked_title',
          type: 'text',
          name: 'Title',
          content: 'FACTURE',
          position: { x: 20, y: 20 },
          size: { width: 60, height: 12 },
          zIndex: 1,
          visible: true,
          locked: true,
          pageIndex: 0,
        },
        {
          id: 'hidden_note',
          type: 'text',
          name: 'Hidden',
          content: 'Hidden content',
          position: { x: 20, y: 40 },
          size: { width: 60, height: 12 },
          zIndex: 2,
          visible: false,
          locked: false,
          pageIndex: 0,
        },
      ],
    });

    expect(template.schemas[0]).toHaveLength(1);
    expect(template.schemas[0][0]).toMatchObject({
      name: 'locked_title',
      content: 'FACTURE',
      readOnly: true,
    });
  });

  it('preserves sparse page indexes instead of collapsing them', () => {
    const template = buildTemplate({
      elements: [
        {
          id: 'page_two_text',
          type: 'text',
          name: 'Page two',
          content: 'Second page',
          position: { x: 15, y: 25 },
          size: { width: 50, height: 10 },
          zIndex: 1,
          visible: true,
          locked: false,
          pageIndex: 1,
        },
      ],
    });

    expect(template.schemas).toHaveLength(2);
    expect(template.schemas[0]).toHaveLength(0);
    expect(template.schemas[1][0]).toMatchObject({
      name: 'page_two_text',
      position: { x: 15, y: 25 },
      readOnly: true,
    });
  });

  it('uses clean fallback values for missing bindings and object bindings', () => {
    const template = buildTemplate({
      elements: [
        {
          id: 'missing_value',
          type: 'dynamic_text',
          name: 'Missing',
          position: { x: 10, y: 10 },
          size: { width: 50, height: 10 },
          zIndex: 1,
          visible: true,
          locked: false,
          pageIndex: 0,
          binding: { path: 'document.unknown', fallback: '-' },
        },
        {
          id: 'object_value',
          type: 'dynamic_text',
          name: 'Object',
          position: { x: 10, y: 25 },
          size: { width: 50, height: 10 },
          zIndex: 2,
          visible: true,
          locked: false,
          pageIndex: 0,
          binding: { path: 'client' },
        },
      ],
    });

    expect(template.schemas[0][0]).toMatchObject({
      name: 'missing_value',
      content: '-',
      readOnly: true,
    });
    expect(template.schemas[0][1]).toMatchObject({
      name: 'object_value',
      content: '',
      readOnly: true,
    });
  });

  it('renders invalid image sources as visible placeholders', () => {
    const template = buildTemplate({
      elements: [
        {
          id: 'company_logo',
          type: 'logo',
          name: 'Company logo',
          position: { x: 15, y: 12 },
          size: { width: 28, height: 18 },
          zIndex: 1,
          visible: true,
          locked: false,
          pageIndex: 0,
          binding: { path: 'company.logo' },
        },
      ],
    });

    expect(template.schemas[0]).toHaveLength(1);
    expect(template.schemas[0][0]).toMatchObject({
      name: 'company_logo_placeholder_bg',
      type: 'rectangle',
      position: { x: 15, y: 12 },
      width: 28,
      height: 18,
      readOnly: true,
    });
    expect(
      template.schemas[0].some((schema) => schema.content === 'Logo'),
    ).toBe(false);
  });

  it('renders resolved image data URLs as readonly image schemas', () => {
    const logoDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const template = buildTemplate(
      {
        elements: [
          {
            id: 'company_logo',
            type: 'logo',
            name: 'Company logo',
            position: { x: 15, y: 12 },
            size: { width: 28, height: 18 },
            zIndex: 1,
            visible: true,
            locked: true,
            pageIndex: 0,
            binding: { path: 'company.logo' },
          },
        ],
      },
      {
        ...data,
        company: {
          ...data.company,
          logo: logoDataUrl,
        },
      },
    );

    expect(template.schemas[0]).toHaveLength(1);
    expect(template.schemas[0][0]).toMatchObject({
      name: 'company_logo',
      type: 'image',
      content: logoDataUrl,
      position: { x: 15, y: 12 },
      width: 28,
      height: 18,
      readOnly: true,
    });
  });

  it('renders page number elements as readonly pdfme placeholders', () => {
    const template = buildTemplate({
      elements: [
        {
          id: 'page_number',
          type: 'page_number',
          name: 'Page number',
          position: { x: 160, y: 285 },
          size: { width: 30, height: 6 },
          zIndex: 1,
          visible: true,
          locked: false,
          pageIndex: 0,
        },
      ],
    });

    expect(template.schemas[0][0]).toMatchObject({
      name: 'page_number',
      type: 'text',
      content: '{{currentPage}} / {{totalPages}}',
      readOnly: true,
    });
  });

  it('keeps unsupported visible block elements visible as placeholders', () => {
    const template = buildTemplate({
      elements: [
        {
          id: 'company_block',
          type: 'company_block',
          name: 'Company block',
          position: { x: 18, y: 20 },
          size: { width: 70, height: 28 },
          zIndex: 1,
          visible: true,
          locked: false,
          pageIndex: 0,
        },
      ],
    });

    expect(template.schemas[0]).toHaveLength(2);
    expect(template.schemas[0][0]).toMatchObject({
      name: 'company_block_unsupported_bg',
      type: 'rectangle',
      position: { x: 18, y: 20 },
      width: 70,
      height: 28,
      readOnly: true,
    });
    expect(template.schemas[0][1]).toMatchObject({
      name: 'company_block_unsupported_text',
      type: 'text',
      content: 'Company block',
      readOnly: true,
    });
  });

  it('renders table sub-schemas inside the table bounds', () => {
    const template = buildTemplate({
      elements: [
        {
          id: 'items_table',
          type: 'table',
          name: 'Items',
          position: { x: 20, y: 100 },
          size: { width: 170, height: 30 },
          zIndex: 1,
          visible: true,
          locked: false,
          pageIndex: 0,
          tableConfig: {
            binding: 'items',
            rowHeight: 10,
            padding: 1,
            columns: [
              { key: 'name', label: 'Item', width: 70, align: 'left' },
              {
                key: 'totalTTC',
                label: 'TTC',
                width: 30,
                align: 'right',
                format: 'currency',
              },
            ],
          },
        },
      ],
    });

    expect(template.schemas[0].length).toBeGreaterThan(0);
    expect(
      template.schemas[0].every((schema) => schema.readOnly === true),
    ).toBe(true);

    const positions = template.schemas[0].map(
      (schema) => schema.position as { x: number; y: number },
    );
    expect(
      Math.min(...positions.map((position) => position.x)),
    ).toBeGreaterThanOrEqual(20);
    expect(
      Math.min(...positions.map((position) => position.y)),
    ).toBeGreaterThanOrEqual(100);
    expect(
      template.schemas[0].some(
        (schema) =>
          schema.type === 'text' &&
          typeof schema.content === 'string' &&
          schema.content.includes('238'),
      ),
    ).toBe(true);
  });
});
