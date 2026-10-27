import { BeneficiaryRecord, CustomFormField, RegistryStats } from '../types/registry';

/**
 * Validates that a Fayda National ID contains exactly 16 numeric digits.
 */
export function isValidFaydaId(faydaId: string): boolean {
  if (!faydaId) return false;
  const clean = faydaId.replace(/\s+/g, '').replace(/-/g, '');
  return /^\d{16}$/.test(clean);
}

/**
 * Formats a 16-digit Fayda ID into readable chunks (e.g., 5475 9042 0527 2936).
 */
export function formatFaydaId(faydaId: string): string {
  if (!faydaId) return '';
  const clean = faydaId.replace(/\D/g, '').slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Strips non-digits from phone number or input
 */
export function sanitizeDigits(val: string): string {
  return val.replace(/\D/g, '');
}

/**
 * Calculates family total safely.
 */
export function calculateFamilyTotal(male: number | string, female: number | string): number {
  const m = Math.max(0, parseInt(String(male), 10) || 0);
  const f = Math.max(0, parseInt(String(female), 10) || 0);
  return m + f;
}

/**
 * Filter beneficiaries by category, search term, woreda, and health status.
 */
export function filterBeneficiaries(
  records: BeneficiaryRecord[],
  categoryTab: 'all' | 'workforce' | 'continuous',
  searchQuery: string,
  woredaFilter: string,
  healthFilter: string
): BeneficiaryRecord[] {
  const query = searchQuery.trim().toLowerCase();

  return records.filter((item) => {
    // 1. Category tab filter
    if (categoryTab === 'workforce' && item.category !== 'ሰሪ ሀይል') return false;
    if (categoryTab === 'continuous' && item.category !== 'በቀጣይነት የሚረዱ') return false;

    // 2. Woreda filter
    if (woredaFilter && woredaFilter !== 'all' && item.woreda !== woredaFilter) {
      return false;
    }

    // 3. Health status filter
    if (healthFilter && healthFilter !== 'all' && item.healthStatus !== healthFilter) {
      return false;
    }

    // 4. Search query
    if (query) {
      const matchName = item.fullName.toLowerCase().includes(query);
      const matchFayda = item.faydaId.toLowerCase().includes(query) ||
        formatFaydaId(item.faydaId).toLowerCase().includes(query);
      const matchPhone = item.phone.toLowerCase().includes(query);
      const matchLocality = item.locality.toLowerCase().includes(query);
      const matchHouse = item.houseNo.toLowerCase().includes(query);
      const matchZone = item.blockZone.toLowerCase().includes(query);

      if (!matchName && !matchFayda && !matchPhone && !matchLocality && !matchHouse && !matchZone) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Computes registry analytics and metrics.
 */
export function computeRegistryStats(records: BeneficiaryRecord[]): RegistryStats {
  const totalBeneficiaries = records.length;
  let workforceCount = 0;
  let continuousCount = 0;
  let totalFamilyMembers = 0;
  let maleBeneficiaries = 0;
  let femaleBeneficiaries = 0;

  const woredaCountMap: Record<string, number> = {};
  const healthCountMap: Record<string, number> = {};

  records.forEach((r) => {
    if (r.category === 'ሰሪ ሀይል') workforceCount++;
    if (r.category === 'በቀጣይነት የሚረዱ') continuousCount++;

    totalFamilyMembers += r.familyTotal || (r.familyMale + r.familyFemale);

    if (r.gender === 'ወ') maleBeneficiaries++;
    if (r.gender === 'ሴ') femaleBeneficiaries++;

    // Woreda tally
    woredaCountMap[r.woreda] = (woredaCountMap[r.woreda] || 0) + 1;

    // Health tally
    healthCountMap[r.healthStatus] = (healthCountMap[r.healthStatus] || 0) + 1;
  });

  const averageFamilySize = totalBeneficiaries > 0
    ? Number((totalFamilyMembers / totalBeneficiaries).toFixed(1))
    : 0;

  const woredaDistribution = Object.entries(woredaCountMap)
    .map(([woreda, count]) => ({
      woreda,
      count,
      percentage: totalBeneficiaries > 0 ? Math.round((count / totalBeneficiaries) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const healthDistribution = Object.entries(healthCountMap)
    .map(([condition, count]) => ({
      condition,
      count,
      percentage: totalBeneficiaries > 0 ? Math.round((count / totalBeneficiaries) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const malePercentage = totalBeneficiaries > 0 ? Math.round((maleBeneficiaries / totalBeneficiaries) * 100) : 0;
  const femalePercentage = totalBeneficiaries > 0 ? 100 - malePercentage : 0;

  return {
    totalBeneficiaries,
    workforceCount,
    continuousCount,
    totalFamilyMembers,
    maleBeneficiaries,
    femaleBeneficiaries,
    averageFamilySize,
    woredaDistribution,
    healthDistribution,
    genderRatio: {
      male: maleBeneficiaries,
      female: femaleBeneficiaries,
      malePercentage,
      femalePercentage
    }
  };
}

/**
 * Escapes a cell value for CSV output.
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/** Column titles shared by Excel export, the blank import template, and import matching. */
export function getRegistryExportHeaders(customFields: CustomFormField[] = []): string[] {
  const headers = [
    'ተ.ቁ (No)',
    'ሙሉ ስም ከነአያት (Full Name)',
    'ክፍለ ከተማ (Sub-City)',
    'ወረዳ (Woreda)',
    'የብሎክ/ቀጠና ቁጥር (Block/Zone)',
    'የአከባቢው ልዩ መጠሪያ (Locality)',
    'የቤት ቁጥር / ሁኔታ (House No)',
    'የፋይዳ መታወቂያ ቁጥር (Fayda ID)',
    'ጾታ (Gender)',
    'እድሜ (Age)',
    'የጤና ሁኔታ (Health Status)',
    'የቤተሰብ ብዛት - ወንድ (Family Male)',
    'የቤተሰብ ብዛት - ሴት (Family Female)',
    'ጠቅላላ የቤተሰብ ብዛት (Family Total)',
    'ስልክ ቁጥር (Phone)',
    'የድጋፍ ምድብ (Category)'
  ];

  customFields.forEach((cf) => {
    headers.push(`${cf.labelAm} (${cf.labelEn})`);
  });

  return headers;
}

/**
 * Generates an Excel-compatible CSV string with UTF-8 BOM (\uFEFF)
 * so Ethiopic Amharic script opens immediately without character corruption.
 */
export function generateCsvExport(
  records: BeneficiaryRecord[],
  customFields: CustomFormField[] = []
): string {
  const BOM = '\uFEFF';
  const headers = getRegistryExportHeaders(customFields);

  const rows = records.map((rec, index) => {
    const rowValues = [
      rec.id || index + 1,
      rec.fullName,
      rec.subCity,
      rec.woreda,
      rec.blockZone,
      rec.locality,
      rec.houseNo,
      rec.faydaId,
      rec.gender,
      rec.age,
      rec.healthStatus,
      rec.familyMale,
      rec.familyFemale,
      rec.familyTotal,
      rec.phone,
      rec.category
    ];

    // Append custom field values
    customFields.forEach((cf) => {
      const val = rec.customFields?.[cf.id] ?? '';
      rowValues.push(val);
    });

    return rowValues.map(escapeCsvCell).join(',');
  });

  return BOM + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
}

/**
 * Triggers browser download of a CSV file.
 */
export function downloadCsv(csvContent: string, fileName = 'Nifas_Silk_Lafto_Registry.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type ImportRowStatus = 'ready' | 'invalid' | 'duplicate';

export interface ImportRowDraft {
  rowNumber: number;
  fullName: string;
  faydaId: string;
  phone: string;
  record?: Omit<BeneficiaryRecord, 'id'>;
  errors: string[];
  warnings: string[];
  status: ImportRowStatus;
}

export interface SpreadsheetImportResult {
  fileError?: string;
  unrecognizedHeaders: string[];
  missingRequiredColumns: string[];
  rows: ImportRowDraft[];
  readyCount: number;
  duplicateCount: number;
  invalidCount: number;
}

type ImportField =
  | 'fullName'
  | 'subCity'
  | 'woreda'
  | 'blockZone'
  | 'locality'
  | 'houseNo'
  | 'faydaId'
  | 'gender'
  | 'age'
  | 'healthStatus'
  | 'familyMale'
  | 'familyFemale'
  | 'familyTotal'
  | 'phone'
  | 'category'
  | 'registrationDate';

const HEADER_ALIASES: Record<string, ImportField | 'ignore'> = {
  no: 'ignore',
  serial: 'ignore',
  serialno: 'ignore',
  ተቁ: 'ignore',
  ተራቁጥ: 'ignore',
  fullname: 'fullName',
  name: 'fullName',
  beneficiaryname: 'fullName',
  ሙሉስም: 'fullName',
  ሙሉስምከነአያት: 'fullName',
  ስም: 'fullName',
  ስምከነአባት: 'fullName',
  subcity: 'subCity',
  ክፍለከተማ: 'subCity',
  woreda: 'woreda',
  ወረዳ: 'woreda',
  blockzone: 'blockZone',
  block: 'blockZone',
  zone: 'blockZone',
  የብሎክቀጠናቁጥር: 'blockZone',
  ቀጠና: 'blockZone',
  locality: 'locality',
  neighborhood: 'locality',
  የአከባቢውልዩመጠሪያ: 'locality',
  ሰፈር: 'locality',
  አካባቢ: 'locality',
  houseno: 'houseNo',
  house: 'houseNo',
  housenumber: 'houseNo',
  የቤትቁጥር: 'houseNo',
  የቤትቁጥርሁኔታ: 'houseNo',
  faydaid: 'faydaId',
  fayda: 'faydaId',
  fcn: 'faydaId',
  nationalid: 'faydaId',
  የፋይዳመታወቂያቁጥር: 'faydaId',
  የፋይዳቁጥር: 'faydaId',
  የፋይዳ: 'faydaId',
  ፋይዳ: 'faydaId',
  gender: 'gender',
  sex: 'gender',
  ጾታ: 'gender',
  age: 'age',
  እድሜ: 'age',
  healthstatus: 'healthStatus',
  health: 'healthStatus',
  የጤናሁኔታ: 'healthStatus',
  familymale: 'familyMale',
  malefamily: 'familyMale',
  የቤተሰብብዛትወንድ: 'familyMale',
  familyfemale: 'familyFemale',
  femalefamily: 'familyFemale',
  የቤተሰብብዛትሴት: 'familyFemale',
  familytotal: 'familyTotal',
  totalfamily: 'familyTotal',
  ጠቅላላየቤተሰብብዛት: 'familyTotal',
  phone: 'phone',
  phonenumber: 'phone',
  mobile: 'phone',
  mobilenumber: 'phone',
  tel: 'phone',
  telephone: 'phone',
  ስልክ: 'phone',
  ስልክቁጥር: 'phone',
  የስልክቁጥር: 'phone',
  category: 'category',
  የድጋፍምድብ: 'category',
  ምድብ: 'category',
  registrationdate: 'registrationDate',
  date: 'registrationDate',
  የምዝገባቀን: 'registrationDate'
};

function compactHeader(raw: string): string {
  return raw
    .replace(/^\uFEFF/, '')
    .normalize('NFKC')
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function headerCandidates(raw: string): string[] {
  const cleaned = String(raw ?? '').replace(/^\uFEFF/, '').normalize('NFKC');
  const parens = [...cleaned.matchAll(/\(([^)]+)\)/g)].map((match) => compactHeader(match[1]));
  return [...new Set([compactHeader(cleaned), ...parens].filter(Boolean))];
}

function resolveHeader(raw: string, customFields: CustomFormField[]): ImportField | `custom:${string}` | 'ignore' | null {
  const candidates = headerCandidates(raw);
  for (const candidate of candidates) {
    const field = HEADER_ALIASES[candidate];
    if (field) return field;
  }

  for (const field of customFields) {
    const keys = [compactHeader(field.labelAm), compactHeader(field.labelEn), compactHeader(field.id)].filter(Boolean);
    if (candidates.some((candidate) => keys.includes(candidate))) {
      return `custom:${field.id}`;
    }
  }

  return null;
}

function parseCount(raw: string): number {
  const n = parseInt(String(raw).replace(/[^\d-]/g, ''), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function normalizeGender(raw: string): 'ወ' | 'ሴ' {
  const value = raw.trim().toLowerCase();
  if (['ሴ', 'ሴት', 'f', 'female', 'woman'].includes(value) || value.startsWith('ሴ')) return 'ሴ';
  return 'ወ';
}

function normalizeCategory(raw: string): { value: BeneficiaryRecord['category']; warning?: string } {
  const trimmed = raw.trim();
  const value = trimmed.toLowerCase();
  if (!value) return { value: 'በቀጣይነት የሚረዱ' };
  if (trimmed === 'ሰሪ ሀይል' || value.includes('ሰሪ') || value.includes('workforce') || value.includes('worker')) {
    return { value: 'ሰሪ ሀይል' };
  }
  if (trimmed === 'በቀጣይነት የሚረዱ' || value.includes('ቀጣይ') || value.includes('continuous') || value.includes('ongoing')) {
    return { value: 'በቀጣይነት የሚረዱ' };
  }
  return {
    value: 'በቀጣይነት የሚረዱ',
    warning: `ያልታወቀ ምድብ "${trimmed}" ወደ "በቀጣይነት የሚረዱ" ተቀይሯል`
  };
}

function normalizeFayda(raw: string): { value: string; error?: string } {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return { value: '', error: 'የፋይዳ ቁጥር ማስገባት ግዴታ ነው' };
  if (/e[+-]/i.test(trimmed) || (trimmed.includes('.') && !/^\d{16}$/.test(trimmed.replace(/\D/g, '')))) {
    return {
      value: trimmed,
      error: 'የፋይዳ ቁጥሩ እንደ ቁጥር ተቀምጦ አሃዞች ጠፍተዋል። ዓምዱን እንደ ጽሑፍ (Text) አድርገው 16 አሃዝ ያስገቡ'
    };
  }
  const digits = trimmed.replace(/\D/g, '');
  if (!/^\d{16}$/.test(digits)) {
    return { value: digits, error: 'የፋይዳ ቁጥር ልክ 16 ድጅት መሆን አለበት' };
  }
  return { value: digits };
}

function normalizePhone(raw: string): { value: string; error?: string } {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('251') && digits.length === 12) digits = `0${digits.slice(3)}`;
  if (digits.length === 9 && digits.startsWith('9')) digits = `0${digits}`;
  if (!digits) return { value: '', error: 'ስልክ ቁጥር ማስገባት ግዴታ ነው' };
  if (digits.length < 9 || digits.length > 13) {
    return { value: digits, error: 'ስልክ ቁጥሩ ትክክል አይመስልም' };
  }
  return { value: digits };
}

/**
 * Maps a spreadsheet grid (including a header row) onto beneficiary records.
 * Accepts the registry export headers and common English or Amharic column names.
 */
export function mapSpreadsheetRows(
  matrix: string[][],
  customFields: CustomFormField[] = [],
  existingFaydaIds: string[] = []
): SpreadsheetImportResult {
  const grid = (matrix || [])
    .map((row) => (row || []).map((cell) => String(cell ?? '').replace(/^\uFEFF/, '').trim()))
    .filter((row) => row.some((cell) => cell !== ''));

  if (grid.length === 0) {
    return {
      fileError: 'ፋይሉ ባዶ ነው። የአምድ ርዕሶች እና ቢያንስ አንድ ተመዝጋቢ ያስፈልጋል',
      unrecognizedHeaders: [],
      missingRequiredColumns: ['ሙሉ ስም', 'የፋይዳ ቁጥር', 'ስልክ'],
      rows: [],
      readyCount: 0,
      duplicateCount: 0,
      invalidCount: 0
    };
  }

  let headerIndex = 0;
  let bestScore = 0;
  const scanLimit = Math.min(grid.length, 8);
  for (let i = 0; i < scanLimit; i++) {
    const score = grid[i].filter((cell) => {
      const resolved = resolveHeader(cell, customFields);
      return Boolean(resolved && resolved !== 'ignore');
    }).length;
    if (score > bestScore) {
      bestScore = score;
      headerIndex = i;
    }
  }

  const headerRow = grid[headerIndex] || [];
  const columnMap: { index: number; field: ImportField | `custom:${string}` }[] = [];
  const used = new Set<string>();
  const unrecognizedHeaders: string[] = [];

  headerRow.forEach((header, index) => {
    if (!header) return;
    const resolved = resolveHeader(header, customFields);
    if (!resolved) {
      unrecognizedHeaders.push(header);
      return;
    }
    if (resolved === 'ignore' || used.has(resolved)) return;
    used.add(resolved);
    columnMap.push({ index, field: resolved });
  });

  const missingRequiredColumns: string[] = [];
  if (!used.has('fullName')) missingRequiredColumns.push('ሙሉ ስም (Full Name)');
  if (!used.has('faydaId')) missingRequiredColumns.push('የፋይዳ ቁጥር (Fayda ID)');
  if (!used.has('phone')) missingRequiredColumns.push('ስልክ (Phone)');

  if (bestScore < 2 || missingRequiredColumns.length === 3) {
    return {
      fileError: 'የአምድ ርዕሶች አልታወቁም። የናሙና ቅጹን ያውርዱ ወይም ሙሉ ስም፣ የፋይዳ ቁጥር እና ስልክ የሚሉ አምዶች ያካትቱ',
      unrecognizedHeaders,
      missingRequiredColumns,
      rows: [],
      readyCount: 0,
      duplicateCount: 0,
      invalidCount: 0
    };
  }

  const existing = new Set(existingFaydaIds.map((id) => String(id).replace(/\D/g, '')));
  const seenInFile = new Set<string>();
  const rows: ImportRowDraft[] = [];

  for (let r = headerIndex + 1; r < grid.length; r++) {
    const source = grid[r];
    const values: Partial<Record<ImportField, string>> = {};
    const customFieldsData: Record<string, string> = {};

    columnMap.forEach(({ index, field }) => {
      const cell = source[index] ?? '';
      if (field.startsWith('custom:')) {
        const fieldId = field.slice('custom:'.length);
        if (cell) customFieldsData[fieldId] = cell;
        return;
      }
      values[field] = cell;
    });

    const fullName = (values.fullName || '').trim();
    const fayda = normalizeFayda(values.faydaId || '');
    const phone = normalizePhone(values.phone || '');
    const hasAnyValue = fullName || fayda.value || phone.value || Object.values(values).some((v) => String(v || '').trim());
    if (!hasAnyValue) continue;

    const errors: string[] = [];
    if (!fullName) errors.push('ሙሉ ስም ማስገባት ግዴታ ነው');
    if (fayda.error) errors.push(fayda.error);
    if (phone.error) errors.push(phone.error);

    const category = normalizeCategory(values.category || '');
    const familyMale = parseCount(values.familyMale || '');
    const familyFemale = parseCount(values.familyFemale || '');
    const familyTotalRaw = (values.familyTotal || '').trim();
    const familyTotal = familyTotalRaw ? parseCount(familyTotalRaw) : familyMale + familyFemale;
    const age = parseCount(values.age || '');

    let status: ImportRowStatus = errors.length > 0 ? 'invalid' : 'ready';
    if (!fayda.error && fayda.value) {
      if (existing.has(fayda.value) || seenInFile.has(fayda.value)) {
        status = 'duplicate';
        errors.push(existing.has(fayda.value)
          ? 'ይህ የፋይዳ ቁጥር ቀደም ሲል በመዝገብ ላይ አለ'
          : 'ይህ የፋይዳ ቁጥር በፋይሉ ውስጥ ተደግሟል');
      } else if (status === 'ready') {
        seenInFile.add(fayda.value);
      }
    }

    const record: Omit<BeneficiaryRecord, 'id'> | undefined = status === 'ready'
      ? {
          fullName,
          subCity: (values.subCity || '').trim() || 'ንፋስ ስልክ ላፍቶ',
          woreda: (values.woreda || '').trim() || 'ለቡ 01',
          blockZone: (values.blockZone || '').trim() || 'ቀጠና 1',
          locality: (values.locality || '').trim(),
          houseNo: (values.houseNo || '').trim(),
          faydaId: fayda.value,
          gender: normalizeGender(values.gender || ''),
          age,
          healthStatus: (values.healthStatus || '').trim() || 'ጤነኛ',
          familyMale,
          familyFemale,
          familyTotal,
          phone: phone.value,
          category: category.value,
          registrationDate: (values.registrationDate || '').trim() || undefined,
          customFields: customFieldsData
        }
      : undefined;

    rows.push({
      rowNumber: r + 1,
      fullName,
      faydaId: fayda.value,
      phone: phone.value,
      record,
      errors,
      warnings: category.warning ? [category.warning] : [],
      status
    });
  }

  return {
    fileError: missingRequiredColumns.length > 0
      ? `የጎደሉ አምዶች: ${missingRequiredColumns.join('፣ ')}`
      : undefined,
    unrecognizedHeaders,
    missingRequiredColumns,
    rows,
    readyCount: rows.filter((row) => row.status === 'ready').length,
    duplicateCount: rows.filter((row) => row.status === 'duplicate').length,
    invalidCount: rows.filter((row) => row.status === 'invalid').length
  };
}
