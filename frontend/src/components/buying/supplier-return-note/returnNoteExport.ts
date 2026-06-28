import { downloadBlob } from '@/api/utils/document-api-factory';

export interface ReturnNoteExportRow {
  reference: string;
  client: string;
  status: string;
  amount: string;
  date: string;
}

export interface ReturnNoteExportLabels {
  reference: string;
  client: string;
  status: string;
  amount: string;
  date: string;
}

interface ReturnNoteExportOptions {
  rows: ReturnNoteExportRow[];
  labels: ReturnNoteExportLabels;
  title: string;
  generatedAt: string;
  fileName: string;
}

const EXCEL_HEADER_FILL = 'FF4472C4';
const EXCEL_HEADER_TEXT = 'FFFFFFFF';
const BORDER_COLOR = 'FFA6A6A6';

export const exportReturnNotesToPdf = async ({
  rows,
  labels,
  title,
  generatedAt,
  fileName
}: ReturnNoteExportOptions) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const document = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4'
  });

  document.setFont('helvetica', 'bold');
  document.setFontSize(18);
  document.text(title, 56, 56);

  document.setFont('helvetica', 'normal');
  document.setFontSize(10);
  document.text(generatedAt, 540, 58, { align: 'right' });
  document.setDrawColor(33, 33, 33);
  document.line(56, 76, 540, 76);

  autoTable(document, {
    startY: 96,
    margin: { left: 56, right: 56 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 5,
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
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 135 },
      2: { cellWidth: 85 },
      3: { cellWidth: 95, halign: 'right' },
      4: { cellWidth: 95 }
    },
    head: [[labels.reference, labels.client, labels.status, labels.amount, labels.date]],
    body: rows.map((row) => [row.reference, row.client, row.status, row.amount, row.date])
  });

  document.save(fileName);
};

export const exportReturnNotesToExcel = async ({
  rows,
  labels,
  title,
  generatedAt,
  fileName
}: ReturnNoteExportOptions) => {
  const excelJsModule = await import('exceljs');
  const ExcelJS = excelJsModule.default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);

  worksheet.properties.defaultRowHeight = 22;
  worksheet.views = [{ state: 'frozen', ySplit: 4 }];
  worksheet.columns = [{ width: 22 }, { width: 30 }, { width: 18 }, { width: 18 }, { width: 18 }];

  worksheet.mergeCells('A1:C1');
  worksheet.mergeCells('D1:E1');
  worksheet.getCell('A1').value = title;
  worksheet.getCell('D1').value = generatedAt;
  worksheet.getCell('D1').alignment = { horizontal: 'right' };
  worksheet.getCell('A1').font = { name: 'Cambria', size: 16, bold: true };
  worksheet.getCell('D1').font = { name: 'Cambria', size: 10 };

  const headerRow = worksheet.getRow(4);
  headerRow.values = [labels.reference, labels.client, labels.status, labels.amount, labels.date];
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

  rows.forEach((row, index) => {
    const excelRow = worksheet.getRow(5 + index);
    excelRow.values = [row.reference, row.client, row.status, row.amount, row.date];
    excelRow.eachCell((cell) => {
      cell.font = { name: 'Cambria', size: 11 };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
    });

    excelRow.getCell(4).alignment = { horizontal: 'right' };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    fileName
  );
};
