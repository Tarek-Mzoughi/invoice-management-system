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
      backgroundColor: '#111827',
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

export const createDefaultPaymentReceiptTemplateSchema = (): Record<
  string,
  unknown
> => ({
  pageSettings: {
    orientation: 'portrait',
    unit: 'mm',
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
  },
  elements: [
    rectangle('headerBackground', 10, 10, 190, 24, {
      backgroundColor: '#f8fafc',
      borderColor: '#e5e7eb',
      borderWidth: 0.4,
    }),
    image('companyLogo', 14, 13, 24, 16, 'company.logo'),
    boundText('companyName', 42, 13, 80, 6, 'company.name', 'Entreprise', {
      fontSize: 12,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText('companyAddress', 42, 20, 86, 5, 'company.address', '', {
      fontSize: 7,
      color: '#4b5563',
    }),
    boundText('companyContact', 42, 26, 86, 5, 'company.phone', '', {
      fontSize: 7,
      color: '#4b5563',
    }),
    text('receiptTitle', 130, 13, 66, 8, 'RECU DE PAIEMENT', {
      fontSize: 15,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'right',
    }),
    boundText('receiptNumber', 130, 23, 66, 5, 'payment.number', '', {
      fontSize: 8,
      color: '#374151',
      textAlign: 'right',
    }),
    boundText('receiptDate', 130, 28, 66, 5, 'payment.date', '', {
      fontSize: 8,
      color: '#374151',
      textAlign: 'right',
    }),

    text('partnerLabel', 12, 42, 60, 5, 'Partenaire', {
      fontSize: 8,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText('partnerName', 12, 49, 84, 6, 'partner.name', '', {
      fontSize: 11,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText('partnerAddress', 12, 56, 84, 12, 'partner.address', '', {
      fontSize: 8,
      color: '#4b5563',
      lineHeight: 1.15,
    }),
    boundText('partnerTaxNumber', 12, 69, 84, 5, 'partner.taxNumber', '', {
      fontSize: 8,
      color: '#4b5563',
    }),

    rectangle('paymentDetailsBox', 106, 42, 92, 35, {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 0.4,
    }),
    text('paymentDetailsTitle', 110, 46, 84, 5, 'Details du paiement', {
      fontSize: 9,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText('paymentDirection', 110, 54, 84, 5, 'payment.direction', '', {
      fontSize: 8,
      color: '#374151',
    }),
    boundText('paymentMode', 110, 61, 84, 5, 'payment.modeLabel', '', {
      fontSize: 8,
      color: '#374151',
    }),
    boundText('paymentTreasury', 110, 68, 84, 5, 'treasury.accountName', '', {
      fontSize: 8,
      color: '#374151',
    }),

    text('amountSummaryTitle', 12, 86, 120, 6, 'Synthese des montants', {
      fontSize: 10,
      fontWeight: '700',
      color: '#111827',
    }),
    rectangle('amountSummaryBox', 12, 94, 186, 42, {
      backgroundColor: '#f9fafb',
      borderColor: '#e5e7eb',
      borderWidth: 0.4,
    }),
    text('moneyAmountLabel', 18, 100, 55, 5, 'Montant paye en argent', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText(
      'moneyAmount',
      75,
      100,
      34,
      5,
      'totals.moneyAmount',
      '0',
      { fontSize: 8, color: '#111827', textAlign: 'right' },
      { type: 'currency', locale: 'fr-TN' },
    ),
    text('creditAmountLabel', 118, 100, 42, 5, 'Utilise par avoir', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText(
      'creditAmount',
      162,
      100,
      28,
      5,
      'totals.creditNoteUsedAmount',
      '0',
      { fontSize: 8, color: '#111827', textAlign: 'right' },
      { type: 'currency', locale: 'fr-TN' },
    ),
    text('withholdingLabel', 18, 112, 55, 5, 'Retenue a la source', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText(
      'withholdingAmount',
      75,
      112,
      34,
      5,
      'totals.withholdingAmount',
      '0',
      { fontSize: 8, color: '#111827', textAlign: 'right' },
      { type: 'currency', locale: 'fr-TN' },
    ),
    text('feeLabel', 118, 112, 42, 5, 'Frais', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText(
      'feeAmount',
      162,
      112,
      28,
      5,
      'totals.fee',
      '0',
      { fontSize: 8, color: '#111827', textAlign: 'right' },
      { type: 'currency', locale: 'fr-TN' },
    ),
    text('coverageLabel', 18, 125, 55, 5, 'Couverture totale', {
      fontSize: 8,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText(
      'coverageAmount',
      75,
      125,
      34,
      5,
      'totals.totalDocumentCoverage',
      '0',
      { fontSize: 8, fontWeight: '700', color: '#111827', textAlign: 'right' },
      { type: 'currency', locale: 'fr-TN' },
    ),
    text('treasuryMovementLabel', 118, 125, 42, 5, 'Mouvement tresorerie', {
      fontSize: 8,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText(
      'treasuryMovementAmount',
      162,
      125,
      28,
      5,
      'totals.finalTreasuryAmount',
      '0',
      { fontSize: 8, fontWeight: '700', color: '#111827', textAlign: 'right' },
      { type: 'currency', locale: 'fr-TN' },
    ),

    text('allocationsTitle', 12, 146, 120, 6, 'Documents regles', {
      fontSize: 10,
      fontWeight: '700',
      color: '#111827',
    }),
    table('allocationsTable', 12, 154, 186, 48, 'allocations', [
      {
        key: 'reference',
        label: 'Document',
        width: 34,
        align: 'left',
        format: 'text',
      },
      {
        key: 'documentType',
        label: 'Type',
        width: 32,
        align: 'left',
        format: 'text',
      },
      { key: 'date', label: 'Date', width: 20, align: 'left', format: 'text' },
      {
        key: 'amount',
        label: 'Montant',
        width: 28,
        align: 'right',
        format: 'currency',
      },
      {
        key: 'currency',
        label: 'Devise',
        width: 18,
        align: 'center',
        format: 'text',
      },
      {
        key: 'remaining',
        label: 'Reste',
        width: 24,
        align: 'right',
        format: 'currency',
      },
    ]),

    text('creditNotesTitle', 12, 211, 120, 6, 'Avoirs utilises', {
      fontSize: 10,
      fontWeight: '700',
      color: '#111827',
    }),
    table('creditNotesTable', 12, 219, 186, 32, 'creditNotes', [
      {
        key: 'reference',
        label: 'Avoir',
        width: 34,
        align: 'left',
        format: 'text',
      },
      {
        key: 'originalAmount',
        label: 'Montant origine',
        width: 28,
        align: 'right',
        format: 'number',
      },
      {
        key: 'originalCurrency',
        label: 'Devise',
        width: 18,
        align: 'center',
        format: 'text',
      },
      {
        key: 'exchangeRateToPaymentCurrency',
        label: 'Taux',
        width: 18,
        align: 'right',
        format: 'number',
      },
      {
        key: 'convertedAmount',
        label: 'Converti',
        width: 28,
        align: 'right',
        format: 'currency',
      },
      {
        key: 'remainingCredit',
        label: 'Reste avoir',
        width: 28,
        align: 'right',
        format: 'number',
      },
    ]),

    boundText('notes', 12, 260, 120, 10, 'payment.notes', '', {
      fontSize: 8,
      color: '#4b5563',
      lineHeight: 1.15,
    }),
    text('signatureLabel', 150, 257, 42, 5, 'Cachet / Signature', {
      fontSize: 8,
      color: '#4b5563',
      textAlign: 'center',
    }),
    image('stamp', 160, 264, 24, 18, 'signature.stamp'),
  ],
});
