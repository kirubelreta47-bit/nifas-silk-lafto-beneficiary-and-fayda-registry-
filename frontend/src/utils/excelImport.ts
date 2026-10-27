import ExcelJS from 'exceljs';
import { CustomFormField } from '../types/registry';
import {
  getRegistryExportHeaders,
  mapSpreadsheetRows,
  SpreadsheetImportResult
} from './registryLogic';

function scalarToText(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'number') {
    if (Number.isSafeInteger(value)) return String(value);
    return String(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value).replace(/^\uFEFF/, '').trim();
}

function excelCellToText(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value == null || value === '') return '';

  if (typeof value === 'object' && !(value instanceof Date)) {
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text || '').join('').trim();
    }
    if ('result' in value) return scalarToText(value.result);
    if ('text' in value && typeof value.text === 'string') return value.text.trim();
  }

  const formatted = typeof cell.text === 'string' ? cell.text.trim() : '';
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    return formatted && !/e[+-]/i.test(formatted) ? formatted : String(value);
  }
  if (formatted && typeof value !== 'number') return formatted.replace(/^\uFEFF/, '');
  return scalarToText(value);
}

function worksheetToMatrix(worksheet: ExcelJS.Worksheet): string[][] {
  let columnCount = worksheet.columnCount;
  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: false }, (_cell, col) => {
      if (col > columnCount) columnCount = col;
    });
  });

  const matrix: string[][] = [];
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    const values: string[] = [];
    for (let col = 1; col <= columnCount; col++) {
      values.push(excelCellToText(row.getCell(col)));
    }
    matrix.push(values);
  });
  return matrix;
}

/** Parses a CSV text, including quoted Amharic cells from the registry export. */
export function parseCsvMatrix(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (char === '\n') {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows.filter((line) => line.some((value) => value !== ''));
}

/** Reads an .xlsx or .csv file into beneficiary rows. */
export async function parseSpreadsheetBuffer(
  data: ArrayBuffer,
  fileName: string,
  customFields: CustomFormField[] = [],
  existingFaydaIds: string[] = []
): Promise<SpreadsheetImportResult> {
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.csv')) {
    const text = new TextDecoder('utf-8').decode(data);
    return mapSpreadsheetRows(parseCsvMatrix(text), customFields, existingFaydaIds);
  }

  if (lower.endsWith('.xls') && !lower.endsWith('.xlsx')) {
    return {
      fileError: 'የድሮው .xls ቅርጸት አይነበብም። ፋይሉን እንደ .xlsx ያስቀምጡ እና እንደገና ይሞክሩ',
      unrecognizedHeaders: [],
      missingRequiredColumns: [],
      rows: [],
      readyCount: 0,
      duplicateCount: 0,
      invalidCount: 0
    };
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return mapSpreadsheetRows([], customFields, existingFaydaIds);
  return mapSpreadsheetRows(worksheetToMatrix(worksheet), customFields, existingFaydaIds);
}

/** Downloads a blank .xlsx workbook whose headers match the registry export. */
export async function downloadImportTemplate(customFields: CustomFormField[] = []): Promise<void> {
  const headers = getRegistryExportHeaders(customFields);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ተመዝጋቢዎች');
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle', wrapText: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  headers.forEach((header, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = Math.min(36, Math.max(16, header.length + 2));
    if (header.includes('Fayda') || header.includes('ፋይዳ') || header.includes('Phone') || header.includes('ስልክ')) {
      column.numFmt = '@';
    }
  });

  const instructions = workbook.addWorksheet('መመሪያ');
  instructions.getColumn(1).width = 92;
  [
    'የማስገቢያ መመሪያ (Import instructions)',
    'በአንድ ረድፍ አንድ ተመዝጋቢ ይሙሉ። የአምድ ርዕሶችን አይቀይሩ።',
    'ግዴታ የሆኑ አምዶች: ሙሉ ስም፣ የፋይዳ ቁጥር (16 አሃዝ)፣ ስልክ ቁጥር።',
    'የፋይዳ እና የስልክ ዓምዶች እንደ ጽሑፍ (Text) ተዘጋጅተዋል። 16 አሃዝ ቁጥር ሲገቡ መጀመሪያ ዓምዱ Text መሆኑን ያረጋግጡ።',
    'ጾታ: ወ ወይም ሴ። ምድብ: ሰሪ ሀይል ወይም በቀጣይነት የሚረዱ።',
    'ቀደም ሲል የተመዘገበ የፋይዳ ቁጥር ዳግመኛ አይገባም።'
  ].forEach((line) => instructions.addRow([line]));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Nifas_Silk_Lafto_Import_Template.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
