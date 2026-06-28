type TemplateElement = {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: Record<string, unknown>;
  content?: string;
  binding?: { path: string; fallback?: string };
  formatting?: Record<string, unknown>;
  tableConfig?: Record<string, unknown>;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  pageIndex: number;
};

const text = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  content: string,
  style: Record<string, unknown> = {},
): TemplateElement => ({
  id,
  type: 'text',
  name: id,
  position: { x, y },
  size: { width, height },
  content,
  style,
  zIndex: 1,
  visible: true,
  locked: false,
  pageIndex: 0,
});

const boundText = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  path: string,
  fallback = '',
  style: Record<string, unknown> = {},
  formatting?: Record<string, unknown>,
): TemplateElement => ({
  ...text(id, x, y, width, height, fallback, style),
  binding: { path, fallback },
  formatting,
});

const image = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  path: string,
): TemplateElement => ({
  id,
  type: 'image',
  name: id,
  position: { x, y },
  size: { width, height },
  binding: { path, fallback: '' },
  zIndex: 1,
  visible: true,
  locked: false,
  pageIndex: 0,
});

const rectangle = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  style: Record<string, unknown> = {},
): TemplateElement => ({
  id,
  type: 'rectangle',
  name: id,
  position: { x, y },
  size: { width, height },
  style,
  zIndex: 0,
  visible: true,
  locked: false,
  pageIndex: 0,
});

const table = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  binding: string,
  columns: Record<string, unknown>[],
): TemplateElement => ({
  id,
  type: 'table',
  name: id,
  position: { x, y },
  size: { width, height },
  tableConfig: {
    binding,
    columns,
    headerStyle: {
      backgroundColor: '#1f2937',
      color: '#ffffff',
      fontSize: 7,
      fontWeight: '600',
    },
    rowStyle: {
      fontSize: 7,
      color: '#111827',
      alternateBackgroundColor: '#f8fafc',
      minHeight: 8,
    },
    borderColor: '#d4d4d8',
    borderWidth: 0.25,
    padding: 1.3,
    rowHeight: 8,
    maxRows: 8,
  },
  zIndex: 1,
  visible: true,
  locked: false,
  pageIndex: 0,
});

export const createDefaultWithholdingTaxCertificateTemplateSchema = (): Record<
  string,
  unknown
> => ({
  pageSettings: {
    orientation: 'portrait',
    unit: 'mm',
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
  },
  elements: [
    text('republic', 12, 12, 72, 5, 'REPUBLIQUE TUNISIENNE', {
      fontSize: 9,
      fontWeight: '700',
      color: '#111827',
    }),
    text('ministry', 12, 18, 72, 5, 'MINISTERE DES FINANCES', {
      fontSize: 8,
      color: '#374151',
    }),
    text('title', 62, 24, 88, 9, 'CERTIFICAT DE RETENUE A LA SOURCE', {
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
      color: '#111827',
    }),
    rectangle('titleLine', 58, 35, 96, 0.4, {
      backgroundColor: '#111827',
      borderColor: '#111827',
      borderWidth: 0,
    }),
    boundText('certRef', 142, 13, 56, 5, 'certificate.reference', '', {
      fontSize: 8,
      fontWeight: '700',
      textAlign: 'right',
      color: '#111827',
    }),
    boundText('certDate', 142, 20, 56, 5, 'certificate.date', '', {
      fontSize: 8,
      textAlign: 'right',
      color: '#374151',
    }),

    rectangle('documentBox', 12, 44, 186, 24, {
      backgroundColor: '#f9fafb',
      borderColor: '#e5e7eb',
      borderWidth: 0.4,
    }),
    text('documentTitle', 16, 48, 68, 5, 'References', {
      fontSize: 9,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText(
      'invoiceRef',
      16,
      56,
      78,
      5,
      'certificate.documentReference',
      '',
      {
        fontSize: 8,
        color: '#374151',
      },
    ),
    boundText(
      'paymentRef',
      104,
      56,
      90,
      5,
      'certificate.paymentReference',
      '',
      {
        fontSize: 8,
        textAlign: 'right',
        color: '#374151',
      },
    ),

    text('payerTitle', 12, 80, 88, 5, 'Payeur', {
      fontSize: 10,
      fontWeight: '700',
      color: '#111827',
    }),
    rectangle('payerBox', 12, 88, 88, 38, {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 0.4,
    }),
    boundText('payerName', 16, 93, 80, 6, 'payer.name', '', {
      fontSize: 10,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText('payerTax', 16, 101, 80, 5, 'payer.taxNumber', '', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText('payerAddress', 16, 108, 80, 13, 'payer.address', '', {
      fontSize: 8,
      lineHeight: 1.15,
      color: '#4b5563',
    }),

    text('beneficiaryTitle', 110, 80, 88, 5, 'Beneficiaire', {
      fontSize: 10,
      fontWeight: '700',
      color: '#111827',
    }),
    rectangle('beneficiaryBox', 110, 88, 88, 38, {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 0.4,
    }),
    boundText('beneficiaryName', 114, 93, 80, 6, 'beneficiary.name', '', {
      fontSize: 10,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText('beneficiaryTax', 114, 101, 80, 5, 'beneficiary.taxNumber', '', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText(
      'beneficiaryAddress',
      114,
      108,
      80,
      13,
      'beneficiary.address',
      '',
      {
        fontSize: 8,
        lineHeight: 1.15,
        color: '#4b5563',
      },
    ),

    text('withholdingTitle', 12, 140, 90, 6, 'Details de la retenue', {
      fontSize: 10,
      fontWeight: '700',
      color: '#111827',
    }),
    rectangle('summaryBox', 12, 150, 186, 42, {
      backgroundColor: '#f9fafb',
      borderColor: '#e5e7eb',
      borderWidth: 0.4,
    }),
    text('baseLabel', 18, 158, 48, 5, 'Base imposable', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText(
      'baseAmount',
      66,
      158,
      36,
      5,
      'totals.baseAmount',
      '0',
      { fontSize: 8, fontWeight: '700', textAlign: 'right', color: '#111827' },
      { type: 'currency', locale: 'fr-TN' },
    ),
    text('rateLabel', 114, 158, 28, 5, 'Taux', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText('rate', 144, 158, 46, 5, 'withholding.rateLabel', '', {
      fontSize: 8,
      fontWeight: '700',
      textAlign: 'right',
      color: '#111827',
    }),
    text('withheldLabel', 18, 171, 48, 5, 'Montant retenu', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText(
      'withheldAmount',
      66,
      171,
      36,
      5,
      'totals.withholdingAmount',
      '0',
      { fontSize: 8, fontWeight: '700', textAlign: 'right', color: '#111827' },
      { type: 'currency', locale: 'fr-TN' },
    ),
    text('netLabel', 114, 171, 28, 5, 'Net paye', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText(
      'netAmount',
      144,
      171,
      46,
      5,
      'totals.netAmount',
      '0',
      { fontSize: 8, fontWeight: '700', textAlign: 'right', color: '#111827' },
      { type: 'currency', locale: 'fr-TN' },
    ),
    boundText('taxType', 18, 183, 172, 5, 'withholding.label', '', {
      fontSize: 8,
      color: '#374151',
    }),

    text('documentsTitle', 12, 205, 90, 6, 'Documents concernes', {
      fontSize: 10,
      fontWeight: '700',
      color: '#111827',
    }),
    table('documentsTable', 12, 214, 186, 38, 'documents', [
      {
        key: 'reference',
        label: 'Document',
        width: 52,
        align: 'left',
        format: 'text',
      },
      { key: 'date', label: 'Date', width: 28, align: 'left', format: 'text' },
      {
        key: 'amount',
        label: 'Base',
        width: 34,
        align: 'right',
        format: 'currency',
      },
      {
        key: 'currency',
        label: 'Devise',
        width: 24,
        align: 'center',
        format: 'text',
      },
      { key: 'type', label: 'Type', width: 38, align: 'left', format: 'text' },
    ]),

    text(
      'statement',
      12,
      260,
      120,
      12,
      'Le present certificat est etabli sur la base des donnees de paiement enregistrees dans le systeme.',
      {
        fontSize: 8,
        color: '#4b5563',
        lineHeight: 1.15,
      },
    ),
    text('signatureLabel', 148, 258, 48, 5, 'Cachet / Signature', {
      fontSize: 8,
      textAlign: 'center',
      color: '#4b5563',
    }),
    image('stamp', 160, 264, 24, 18, 'signature.stamp'),
  ],
});
