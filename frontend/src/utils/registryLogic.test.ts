import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidFaydaId,
  formatFaydaId,
  calculateFamilyTotal,
  filterBeneficiaries,
  computeRegistryStats,
  generateCsvExport
} from './registryLogic';
import { BeneficiaryRecord, CustomFormField } from '../types/registry';

const sampleRecords: BeneficiaryRecord[] = [
  {
    id: 1,
    fullName: 'ጊዜ ጥላሁን ገላይ',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 01',
    blockZone: 'ቀጠና 1',
    locality: 'አብርሀሙ ስላሴ',
    houseNo: 'ተከራይ',
    faydaId: '5475904205272936',
    gender: 'ወ',
    age: 38,
    healthStatus: 'አካል ጉዳት',
    familyMale: 1,
    familyFemale: 1,
    familyTotal: 2,
    phone: '0931753611',
    category: 'በቀጣይነት የሚረዱ',
    customFields: { aidType: 'የምግብ ድጋፍ' }
  },
  {
    id: 2,
    fullName: 'አመቤት ደገፉ ኤርገዶ',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 01',
    blockZone: 'ቀጠና 1',
    locality: 'ቆርቆሮ ሰፈር',
    houseNo: 'ተከራይ',
    faydaId: '2763784207941036',
    gender: 'ሴ',
    age: 34,
    healthStatus: 'ጤነኛ',
    familyMale: 2,
    familyFemale: 1,
    familyTotal: 3,
    phone: '0902399053',
    category: 'ሰሪ ሀይል',
    customFields: { aidType: 'የስራ እድል' }
  },
  {
    id: 3,
    fullName: 'አለም ጸጋዬ ኪ/ማርያም',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 02',
    blockZone: 'ቀጠና 2',
    locality: '240/1',
    houseNo: '240/1',
    faydaId: '1332840049298492',
    gender: 'ሴ',
    age: 66,
    healthStatus: 'ጤነኛ',
    familyMale: 0,
    familyFemale: 1,
    familyTotal: 1,
    phone: '0921474205',
    category: 'በቀጣይነት የሚረዱ'
  }
];

test('isValidFaydaId correctly validates 16 numeric digits', () => {
  assert.equal(isValidFaydaId('5475904205272936'), true);
  assert.equal(isValidFaydaId('5475 9042 0527 2936'), true);
  assert.equal(isValidFaydaId('5475-9042-0527-2936'), true);
  // Invalid
  assert.equal(isValidFaydaId('12345'), false);
  assert.equal(isValidFaydaId('547590420527293A'), false);
  assert.equal(isValidFaydaId(''), false);
});

test('formatFaydaId chunks 16 digits into groups of 4', () => {
  assert.equal(formatFaydaId('5475904205272936'), '5475 9042 0527 2936');
  assert.equal(formatFaydaId('12345'), '1234 5');
});

test('calculateFamilyTotal sums male and female counts', () => {
  assert.equal(calculateFamilyTotal(3, 2), 5);
  assert.equal(calculateFamilyTotal('4', '5'), 9);
  assert.equal(calculateFamilyTotal(0, 0), 0);
  assert.equal(calculateFamilyTotal(-1, 2), 2);
});

test('filterBeneficiaries filters by category, search, and woreda', () => {
  // Category test
  const workforce = filterBeneficiaries(sampleRecords, 'workforce', '', 'all', 'all');
  assert.equal(workforce.length, 1);
  assert.equal(workforce[0].fullName, 'አመቤት ደገፉ ኤርገዶ');

  const continuous = filterBeneficiaries(sampleRecords, 'continuous', '', 'all', 'all');
  assert.equal(continuous.length, 2);

  // Search test
  const searchedFayda = filterBeneficiaries(sampleRecords, 'all', '5475', 'all', 'all');
  assert.equal(searchedFayda.length, 1);
  assert.equal(searchedFayda[0].fullName, 'ጊዜ ጥላሁን ገላይ');

  // Woreda test
  const woreda2 = filterBeneficiaries(sampleRecords, 'all', '', 'ለቡ 02', 'all');
  assert.equal(woreda2.length, 1);
  assert.equal(woreda2[0].fullName, 'አለም ጸጋዬ ኪ/ማርያም');

  // Health test
  const disabled = filterBeneficiaries(sampleRecords, 'all', '', 'all', 'አካል ጉዳት');
  assert.equal(disabled.length, 1);
  assert.equal(disabled[0].fullName, 'ጊዜ ጥላሁን ገላይ');
});

test('computeRegistryStats aggregates metrics correctly', () => {
  const stats = computeRegistryStats(sampleRecords);
  assert.equal(stats.totalBeneficiaries, 3);
  assert.equal(stats.workforceCount, 1);
  assert.equal(stats.continuousCount, 2);
  assert.equal(stats.totalFamilyMembers, 6); // 2 + 3 + 1
  assert.equal(stats.maleBeneficiaries, 1);
  assert.equal(stats.femaleBeneficiaries, 2);
  assert.equal(stats.averageFamilySize, 2);
});

test('generateCsvExport produces UTF-8 BOM and valid CSV columns', () => {
  const customFields: CustomFormField[] = [
    { id: 'aidType', labelAm: 'የድጋፍ አይነት', labelEn: 'Aid Type', type: 'text', required: false }
  ];
  const csv = generateCsvExport(sampleRecords, customFields);
  assert.ok(csv.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');
  assert.ok(csv.includes('ጊዜ ጥላሁን ገላይ'));
  assert.ok(csv.includes('የድጋፍ አይነት (Aid Type)'));
  assert.ok(csv.includes('የምግብ ድጋፍ'));
});
