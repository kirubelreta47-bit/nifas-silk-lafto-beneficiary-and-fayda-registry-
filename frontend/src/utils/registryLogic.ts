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

/**
 * Generates an Excel-compatible CSV string with UTF-8 BOM (\uFEFF)
 * so Ethiopic Amharic script opens immediately without character corruption.
 */
export function generateCsvExport(
  records: BeneficiaryRecord[],
  customFields: CustomFormField[] = []
): string {
  const BOM = '\uFEFF';

  // Base headers matching official Sub-City Excel sheets
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

  // Append any custom field headers
  customFields.forEach((cf) => {
    headers.push(`${cf.labelAm} (${cf.labelEn})`);
  });

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
