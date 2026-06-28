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
    maxRows: 12,
  },
  zIndex: 1,
  visible: true,
  locked: false,
  pageIndex: 0,
});

export const createDefaultDocumentTemplateSchema = (
  documentTitle: string,
): Record<string, unknown> => ({
  pageSettings: {
    orientation: 'portrait',
    unit: 'mm',
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
  },
  elements: [
    // Header Background box
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
    boundText(
      'documentTitle',
      130,
      13,
      66,
      8,
      'document.title',
      documentTitle,
      {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'right',
      },
    ),
    boundText('documentNumber', 130, 22, 66, 5, 'document.number', '', {
      fontSize: 8,
      color: '#374151',
      textAlign: 'right',
    }),
    boundText('documentDate', 130, 28, 66, 5, 'document.date', '', {
      fontSize: 8,
      color: '#374151',
      textAlign: 'right',
    }),

    // Partner Info (Client / Supplier)
    text('partnerLabel', 12, 40, 60, 5, 'Destinataire', {
      fontSize: 8,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText('partnerName', 12, 47, 84, 6, 'partner.name', '', {
      fontSize: 10,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText('partnerAddress', 12, 54, 84, 12, 'partner.address', '', {
      fontSize: 8,
      color: '#4b5563',
      lineHeight: 1.15,
    }),
    boundText('partnerTaxNumber', 12, 67, 84, 5, 'partner.taxNumber', '', {
      fontSize: 8,
      color: '#4b5563',
    }),

    // Document Details Box
    rectangle('docDetailsBox', 106, 40, 92, 32, {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 0.4,
    }),
    text('docDetailsTitle', 110, 44, 84, 5, 'Informations', {
      fontSize: 9,
      fontWeight: '700',
      color: '#111827',
    }),
    text('objectLabel', 110, 51, 20, 5, 'Objet:', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText('objectValue', 130, 51, 64, 5, 'document.object', '', {
      fontSize: 8,
      color: '#111827',
    }),
    text('dueDateLabel', 110, 58, 20, 5, 'Echeance:', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText('dueDateValue', 130, 58, 64, 5, 'document.dueDate', '', {
      fontSize: 8,
      color: '#111827',
    }),
    text('currencyLabel', 110, 65, 20, 5, 'Devise:', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText('currencyValue', 130, 65, 64, 5, 'document.currency', '', {
      fontSize: 8,
      color: '#111827',
    }),

    // Items Table
    table('itemsTable', 10, 78, 190, 90, 'items', [
      {
        key: 'index',
        label: '#',
        width: 8,
        align: 'center',
        format: 'number',
      },
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
    ]),

    // Bank Details
    text('bankTitle', 12, 172, 80, 5, 'Coordonnees Bancaires', {
      fontSize: 9,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText('bankDetails', 12, 179, 88, 15, 'bank.details', '', {
      fontSize: 7.5,
      color: '#4b5563',
      lineHeight: 1.2,
    }),

    // Totals Section
    rectangle('totalsBox', 110, 172, 90, 32, {
      backgroundColor: '#f9fafb',
      borderColor: '#e5e7eb',
      borderWidth: 0.4,
    }),
    text('subtotalLabel', 114, 176, 40, 5, 'Total Hors Taxes (HT)', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText(
      'subtotalValue',
      158,
      176,
      38,
      5,
      'totals.totalHT',
      '0',
      { fontSize: 8, color: '#111827', textAlign: 'right' },
      { type: 'currency' },
    ),
    text('tvaLabel', 114, 183, 40, 5, 'Total TVA', {
      fontSize: 8,
      color: '#4b5563',
    }),
    boundText(
      'tvaValue',
      158,
      183,
      38,
      5,
      'totals.totalTVA',
      '0',
      { fontSize: 8, color: '#111827', textAlign: 'right' },
      { type: 'currency' },
    ),
    text('totalLabel', 114, 192, 40, 5, 'TOTAL (TTC)', {
      fontSize: 9,
      fontWeight: '700',
      color: '#111827',
    }),
    boundText(
      'totalValue',
      158,
      192,
      38,
      5,
      'totals.totalTTC',
      '0',
      { fontSize: 9, fontWeight: '700', color: '#111827', textAlign: 'right' },
      { type: 'currency' },
    ),

    // Notes
    boundText('notes', 12, 210, 120, 15, 'document.notes', '', {
      fontSize: 7.5,
      color: '#4b5563',
      lineHeight: 1.15,
    }),

    // Signature stamp
    text('signatureLabel', 148, 210, 48, 5, 'Cachet / Signature', {
      fontSize: 8,
      textAlign: 'center',
      color: '#4b5563',
    }),
    image('stamp', 160, 217, 24, 18, 'signature.stamp'),
  ],
});
