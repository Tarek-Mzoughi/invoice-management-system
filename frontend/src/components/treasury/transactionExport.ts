import {
  TREASURY_MOVEMENT_DIRECTION,
  TreasuryMovement
} from '@/types';

export interface TransactionExportLabels {
  reference: string;
  date: string;
  account: string;
  debit: string;
  credit: string;
  balance: string;
  reason: string;
  total: string;
}

export interface TransactionExportMeta {
  title: string;
  sheetName?: string;
  companyName: string;
  generatedAt: string;
  period: string;
  accountScope: string;
}

interface TransactionExportRow {
  reference: string;
  dateText: string;
  dateValue: Date | null;
  account: string;
  debit: number;
  credit: number;
  balance: number;
  reason: string;
}

interface BuildTransactionExportRowsOptions {
  movements: TreasuryMovement[];
  locale: string;
}

interface TransactionExportDocumentOptions extends BuildTransactionExportRowsOptions {
  meta: TransactionExportMeta;
  labels: TransactionExportLabels;
  fileName: string;
}

const EXCEL_HEADER_FILL = 'FF4472C4';
const EXCEL_HEADER_TEXT = 'FFFFFFFF';
const EXCEL_TOTAL_FILL = 'FFD9D9D9';
const BORDER_COLOR = 'FFA6A6A6';

const saveBlob = (blob: Blob, fileName: string) => {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
};

const parseDateValue = (value: string | Date | undefined) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatDateOnly = (value: string | Date | undefined, locale: string) => {
  const date = parseDateValue(value);
  if (!date) return '';

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const formatNumber = (value: number, locale: string, digits: number = 3) =>
  value.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });

const buildTransactionExportRows = ({
  movements,
  locale
}: BuildTransactionExportRowsOptions) => {
  const balancesByAccount: Record<string, number> = {};

  const rows = movements.map((movement) => {
    const accountKey =
      movement.accountId?.toString() || movement.account?.id?.toString() || '_unknown';

    if (!(accountKey in balancesByAccount)) {
      balancesByAccount[accountKey] = 0;
    }

    const amount = movement.amount ?? 0;
    const isCredit = movement.direction === TREASURY_MOVEMENT_DIRECTION.IN;

    balancesByAccount[accountKey] += isCredit ? amount : -amount;

    const dateValue = parseDateValue(movement.movementDate);

    return {
      reference: formatReference(movement),
      dateText: formatDateOnly(movement.movementDate, locale),
      dateValue,
      account: movement.account?.name || '-',
      debit: isCredit ? 0 : amount,
      credit: isCredit ? amount : 0,
      balance: balancesByAccount[accountKey],
      reason: movement.notes || movement.label || '-'
    } satisfies TransactionExportRow;
  });

  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);

  return { rows, totalDebit, totalCredit };
};

const formatReference = (movement: TreasuryMovement) => {
  const date = movement.movementDate ? new Date(movement.movementDate) : new Date(movement.createdAt || '');
  const year = date.getFullYear();
  const id = String(movement.id ?? 0).padStart(5, '0');
  return `TX-${year}-${id}`;
};

export const exportTransactionsToPdf = async ({
  movements,
  meta,
  labels,
  fileName,
  locale
}: TransactionExportDocumentOptions) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const { rows, totalDebit, totalCredit } = buildTransactionExportRows({
    movements,
    locale
  });

  const document = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4'
  });

  document.setFont('helvetica', 'bold');
  document.setFontSize(18);
  document.text(meta.companyName, 56, 62);
  document.text(meta.title, 540, 62, { align: 'right' });

  document.setFont('helvetica', 'normal');
  document.setFontSize(9);
  document.text(meta.generatedAt, 540, 84, { align: 'right' });
  document.text(meta.period, 540, 100, { align: 'right' });
  document.text(meta.accountScope, 540, 116, { align: 'right' });

  document.setDrawColor(33, 33, 33);
  document.line(56, 132, 540, 132);

  autoTable(document, {
    startY: 152,
    margin: { left: 56, right: 56 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.5,
      textColor: [30, 30, 30]
    },
    headStyles: {
      fillColor: [211, 217, 224],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [166, 166, 166]
    },
    footStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [120, 120, 120]
    },
    columnStyles: {
      0: { cellWidth: 84 },
      1: { cellWidth: 58 },
      2: { cellWidth: 94 },
      3: { cellWidth: 70, halign: 'right' },
      4: { cellWidth: 70, halign: 'right' },
      5: { cellWidth: 70, halign: 'right' },
      6: { cellWidth: 'auto' }
    },
    head: [[
      labels.reference,
      labels.date,
      labels.account,
      labels.debit,
      labels.credit,
      labels.balance,
      labels.reason
    ]],
    body: rows.map((row) => [
      row.reference,
      row.dateText,
      row.account,
      row.debit ? formatNumber(row.debit, locale) : '—',
      row.credit ? formatNumber(row.credit, locale) : '—',
      formatNumber(row.balance, locale),
      row.reason
    ]),
    foot: [[
      labels.total,
      '—',
      '—',
      formatNumber(totalDebit, locale),
      formatNumber(totalCredit, locale),
      '—',
      '—'
    ]],
    didParseCell: (hookData) => {
      if (hookData.section === 'body' || hookData.section === 'foot') {
        if (hookData.column.index === 3 && hookData.cell.text[0] !== '—') {
          hookData.cell.styles.textColor = [0, 153, 51];
        }

        if (hookData.column.index === 4 && hookData.cell.text[0] !== '—') {
          hookData.cell.styles.textColor = [220, 53, 69];
        }

        if (hookData.column.index === 5 && hookData.cell.text[0] !== '—') {
          hookData.cell.styles.textColor = hookData.cell.text[0].startsWith('-')
            ? [220, 53, 69]
            : [0, 153, 51];
        }
      }
    }
  });

  document.save(fileName);
};

export const exportTransactionsToExcel = async ({
  movements,
  meta,
  labels,
  fileName,
  locale
}: TransactionExportDocumentOptions) => {
  const excelJsModule = await import('exceljs');
  const ExcelJS = excelJsModule.default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(meta.sheetName || meta.title);

  const { rows, totalDebit, totalCredit } = buildTransactionExportRows({
    movements,
    locale
  });

  worksheet.properties.defaultRowHeight = 22;
  worksheet.views = [{ state: 'frozen', ySplit: 6 }];
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1
  };

  worksheet.columns = [
    { width: 18 },
    { width: 17 },
    { width: 28 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 30 }
  ];

  worksheet.mergeCells('A1:C1');
  worksheet.mergeCells('D1:G1');
  worksheet.getCell('A1').value = meta.companyName;
  worksheet.getCell('D1').value = meta.title;
  worksheet.getCell('D1').alignment = { horizontal: 'right' };
  worksheet.getCell('A1').font = { name: 'Cambria', size: 16, bold: true };
  worksheet.getCell('D1').font = { name: 'Cambria', size: 16, bold: true };

  worksheet.mergeCells('D2:G2');
  worksheet.mergeCells('D3:G3');
  worksheet.mergeCells('D4:G4');
  worksheet.getCell('D2').value = meta.generatedAt;
  worksheet.getCell('D3').value = meta.period;
  worksheet.getCell('D4').value = meta.accountScope;
  ['D2', 'D3', 'D4'].forEach((cellRef) => {
    const cell = worksheet.getCell(cellRef);
    cell.alignment = { horizontal: 'right' };
    cell.font = { name: 'Cambria', size: 10, bold: cellRef === 'D4' };
  });

  const headerRowIndex = 6;
  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.values = [
    labels.reference,
    labels.date,
    labels.account,
    labels.debit,
    labels.credit,
    labels.balance,
    labels.reason
  ];
  headerRow.height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Cambria', size: 11, bold: true, color: { argb: EXCEL_HEADER_TEXT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_HEADER_FILL }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: BORDER_COLOR } },
      left: { style: 'thin', color: { argb: BORDER_COLOR } },
      bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
      right: { style: 'thin', color: { argb: BORDER_COLOR } }
    };
  });

  const amountNumberFormat = '#,##0.000';

  rows.forEach((row, index) => {
    const excelRow = worksheet.getRow(headerRowIndex + 1 + index);
    excelRow.getCell(1).value = row.reference;
    excelRow.getCell(2).value = row.dateValue || row.dateText;
    excelRow.getCell(3).value = row.account;
    excelRow.getCell(4).value = row.debit || 0;
    excelRow.getCell(5).value = row.credit || 0;
    excelRow.getCell(6).value = row.balance;
    excelRow.getCell(7).value = row.reason;

    excelRow.getCell(1).font = { name: 'Cambria', size: 11 };
    excelRow.getCell(2).font = { name: 'Cambria', size: 11 };
    excelRow.getCell(3).font = { name: 'Cambria', size: 11 };
    excelRow.getCell(7).font = { name: 'Cambria', size: 11 };

    if (row.dateValue) {
      excelRow.getCell(2).numFmt = locale.startsWith('fr') ? 'dd/mm/yyyy' : 'mm/dd/yyyy';
    }

    [4, 5, 6].forEach((columnIndex) => {
      const cell = excelRow.getCell(columnIndex);
      cell.numFmt = amountNumberFormat;
      cell.alignment = { horizontal: 'right' };
      cell.font = { name: 'Cambria', size: 11 };
    });

    excelRow.getCell(4).font = { name: 'Cambria', size: 11, color: { argb: 'FF009933' } };
    excelRow.getCell(5).font = { name: 'Cambria', size: 11, color: { argb: 'FFFF0000' } };
    excelRow.getCell(6).font = {
      name: 'Cambria',
      size: 11,
      color: { argb: row.balance < 0 ? 'FFFF0000' : 'FF009933' }
    };

    excelRow.eachCell((cell) => {
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } }
      };
    });
  });

  const totalRowIndex = headerRowIndex + rows.length + 1;
  const totalRow = worksheet.getRow(totalRowIndex);
  totalRow.getCell(1).value = labels.total;
  totalRow.getCell(4).value = totalDebit;
  totalRow.getCell(5).value = totalCredit;

  totalRow.eachCell((cell) => {
    cell.font = { name: 'Cambria', size: 11, bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_TOTAL_FILL }
    };
    cell.border = {
      top: { style: 'thin', color: { argb: '444444' } },
      bottom: { style: 'thin', color: { argb: BORDER_COLOR } }
    };
  });

  totalRow.getCell(4).numFmt = amountNumberFormat;
  totalRow.getCell(5).numFmt = amountNumberFormat;
  totalRow.getCell(4).alignment = { horizontal: 'right' };
  totalRow.getCell(5).alignment = { horizontal: 'right' };
  totalRow.getCell(4).font = {
    name: 'Cambria',
    size: 11,
    bold: true,
    color: { argb: 'FF009933' }
  };
  totalRow.getCell(5).font = {
    name: 'Cambria',
    size: 11,
    bold: true,
    color: { argb: 'FFFF0000' }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  saveBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    fileName
  );
};
