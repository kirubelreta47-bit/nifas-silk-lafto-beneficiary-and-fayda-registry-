import React from 'react';
import { BeneficiaryRecord, CustomFormField } from '../types/registry';
import { CivicEmblem } from './CivicEmblem';
import { formatFaydaId, computeRegistryStats } from '../utils/registryLogic';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface AdminPdfExportModalProps {
  subTab: 'directory' | 'reports' | 'formBuilder';
  activeCategory: 'all' | 'workforce' | 'continuous';
  records: BeneficiaryRecord[];
  filteredRecords: BeneficiaryRecord[];
  customFields: CustomFormField[];
  onClose: () => void;
}

export const AdminPdfExportModal: React.FC<AdminPdfExportModalProps> = ({
  subTab,
  activeCategory,
  records,
  filteredRecords,
  customFields,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('am-ET', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) || new Date().toISOString().split('T')[0];

  const getCategoryTitle = () => {
    if (activeCategory === 'workforce') return 'ሰሪ ሀይል (Workforce Group)';
    if (activeCategory === 'continuous') return 'በቀጣይነት የሚረዱ (Continuous Support)';
    return 'ጠቅላላ ተመዝጋቢዎች (All Beneficiaries)';
  };

  const getModalTitle = () => {
    if (subTab === 'directory') return 'የተመዝጋቢዎች ሰንጠረዥ PDF ሪፖርት (Directory Table PDF)';
    if (subTab === 'reports') return 'የሪፖርት እና ስታትስቲክስ ትንታኔ PDF (Analytics Summary PDF)';
    return 'የምዝገባ ቅጽ መዋቅር እና ዝርዝር PDF (Form Schema & Fields PDF)';
  };

  // Computations for Analytics
  const stats = computeRegistryStats(records);

  // Computations for Directory table totals
  const totalFamilySum = filteredRecords.reduce((acc, curr) => acc + (curr.familyTotal || 0), 0);
  const totalMaleFamilySum = filteredRecords.reduce((acc, curr) => acc + (curr.familyMale || 0), 0);
  const totalFemaleFamilySum = filteredRecords.reduce((acc, curr) => acc + (curr.familyFemale || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto p-2 sm:p-6 flex items-start justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl my-2 sm:my-3 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Interactive Bar (hidden in print) */}
        <div className="no-print bg-blue-950 text-white px-3.5 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b-2 border-yellow-500">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-base font-bold text-white truncate sm:overflow-visible">
                {getModalTitle()}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-blue-200">
                ይህንን ሰነድ በቀጥታ ማተም ወይም ወደ PDF ማስቀመጥ ይችላሉ (Print or Save as Official PDF)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-bold text-xs rounded-lg shadow-xs cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4 text-blue-950" />
              <span>አትም / PDF አስቀምጥ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-900 rounded-lg cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Government Document Container */}
        <div className="p-3 sm:p-8 bg-white text-slate-900 print:p-0 overflow-x-auto">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex items-center justify-between">
              <CivicEmblem size={52} className="shrink-0" />
              <div className="text-center flex-1 px-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                  የኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ • የአዲስ አበባ ከተማ አስተዳደር
                </h4>
                <h1 className="text-lg sm:text-xl font-extrabold text-blue-950 uppercase mt-0.5">
                  በንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር
                </h1>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  የህብረተሰብ ተሳትፎና በጎ አድራጎት ማስተባበሪያ ጽህፈት ቤት
                </h2>
                <p className="text-[11px] text-slate-500 italic">
                  Nifas Silk-Lafto Sub-City Administration Beneficiary & Fayda Registry System
                </p>
              </div>
              <div className="text-right text-[11px] font-mono border border-slate-300 p-2 rounded bg-slate-50 min-w-[150px]">
                <span className="block font-bold text-blue-950">
                  {subTab === 'directory' ? `ምድብ: ${getCategoryTitle()}` : subTab === 'reports' ? 'ዓይነት: አጠቃላይ ትንታኔ' : 'ዓይነት: የቅጽ ዝርዝር መዋቅር'}
                </span>
                <span className="block text-slate-700">
                  {subTab === 'directory' ? `የተመዝጋቢ ብዛት: ${filteredRecords.length}` : `ጠቅላላ ተመዝጋቢ: ${records.length}`}
                </span>
                <span className="block text-slate-500 text-[10px]">ቀን: {currentDate}</span>
              </div>
            </div>

            <div className="mt-3.5 text-center bg-blue-950 text-white py-1.5 px-4 rounded border-b-2 border-yellow-500 print:bg-slate-900">
              <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
                {subTab === 'directory' && 'የተረጂዎች እና የፋይዳ ብሔራዊ መታወቂያ ምዝገባ ማጠቃለያ ሰንጠረዥ'}
                {subTab === 'reports' && 'የተረጂዎች ስነ-ህዝብ፣ ጤና እና የድጋፍ ስታትስቲክስ ኦፊሴላዊ ማጠቃለያ ሪፖርት'}
                {subTab === 'formBuilder' && 'የተረጂዎች ምዝገባ ቅጽ ኦፊሴላዊ መስኮች እና የመረጃ መዋቅር ሰነድ'}
              </h3>
            </div>
          </div>

          {/* ================= VIEW 1: DIRECTORY SPREADSHEET TABLE ================= */}
          {subTab === 'directory' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-blue-950 text-white print:bg-slate-900 print:text-white text-center font-bold">
                      <th className="border border-slate-400 p-1.5 w-10">ተ.ቁ</th>
                      <th className="border border-slate-400 p-1.5 text-left min-w-[130px]">ሙሉ ስም ከነአያት</th>
                      <th className="border border-slate-400 p-1.5 min-w-[65px]">ወረዳ</th>
                      <th className="border border-slate-400 p-1.5 min-w-[55px]">ቀጠና</th>
                      <th className="border border-slate-400 p-1.5 text-left min-w-[90px]">ልዩ መጠሪያ</th>
                      <th className="border border-slate-400 p-1.5 min-w-[60px]">የቤት ቁጥር</th>
                      <th className="border border-slate-400 p-1.5 font-mono min-w-[130px]">የፋይዳ መታወቂያ</th>
                      <th className="border border-slate-400 p-1.5 w-10">ጾታ</th>
                      <th className="border border-slate-400 p-1.5 w-10">እድሜ</th>
                      <th className="border border-slate-400 p-1.5 min-w-[80px]">የጤና ሁኔታ</th>
                      <th className="border border-slate-400 p-1 w-10">ወንድ</th>
                      <th className="border border-slate-400 p-1 w-10">ሴት</th>
                      <th className="border border-slate-400 p-1 w-12 bg-blue-900 print:bg-slate-800">ድምር</th>
                      <th className="border border-slate-400 p-1.5 min-w-[90px]">ስልክ ቁጥር</th>
                      <th className="border border-slate-400 p-1.5 min-w-[90px]">የድጋፍ ምድብ</th>
                      {customFields.map((cf) => (
                        <th key={cf.id} className="border border-slate-400 p-1.5 min-w-[80px]">
                          {cf.labelAm}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={15 + customFields.length}
                          className="text-center p-6 text-slate-500 font-semibold border border-slate-300"
                        >
                          ምንም መረጃ አልተገኘም (No records match the current filter)
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r, idx) => (
                        <tr
                          key={r.id}
                          className={`border-b border-slate-300 text-slate-900 ${
                            idx % 2 === 1 ? 'bg-slate-50 print:bg-slate-100' : 'bg-white'
                          }`}
                        >
                          <td className="border border-slate-300 p-1 text-center font-mono font-semibold">
                            {r.id}
                          </td>
                          <td className="border border-slate-300 p-1.5 font-bold text-slate-950">
                            {r.fullName}
                          </td>
                          <td className="border border-slate-300 p-1 text-center">{r.woreda}</td>
                          <td className="border border-slate-300 p-1 text-center">{r.blockZone}</td>
                          <td className="border border-slate-300 p-1.5">{r.locality}</td>
                          <td className="border border-slate-300 p-1 text-center">{r.houseNo}</td>
                          <td className="border border-slate-300 p-1 font-mono text-center tracking-tight text-blue-950 font-bold">
                            {formatFaydaId(r.faydaId)}
                          </td>
                          <td className="border border-slate-300 p-1 text-center font-semibold">
                            {r.gender}
                          </td>
                          <td className="border border-slate-300 p-1 text-center">{r.age}</td>
                          <td className="border border-slate-300 p-1 text-center">{r.healthStatus}</td>
                          <td className="border border-slate-300 p-1 text-center">{r.familyMale}</td>
                          <td className="border border-slate-300 p-1 text-center">{r.familyFemale}</td>
                          <td className="border border-slate-300 p-1 text-center font-bold font-mono bg-yellow-50 print:bg-transparent">
                            {r.familyTotal}
                          </td>
                          <td className="border border-slate-300 p-1 font-mono text-center">{r.phone}</td>
                          <td className="border border-slate-300 p-1 text-center font-medium">
                            {r.category}
                          </td>
                          {customFields.map((cf) => (
                            <td key={cf.id} className="border border-slate-300 p-1 text-center">
                              {r.customFields?.[cf.id] !== undefined
                                ? String(r.customFields[cf.id])
                                : '—'}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}

                    {/* Summary / Totals Row */}
                    <tr className="bg-slate-200 print:bg-slate-300 font-bold border-t-2 border-slate-900 text-slate-950">
                      <td colSpan={10} className="border border-slate-400 p-2 text-right uppercase">
                        ጠቅላላ ድምር (Total Summary Counts):
                      </td>
                      <td className="border border-slate-400 p-1 text-center">{totalMaleFamilySum}</td>
                      <td className="border border-slate-400 p-1 text-center">{totalFemaleFamilySum}</td>
                      <td className="border border-slate-400 p-1 text-center font-mono text-xs font-extrabold text-blue-950 bg-yellow-200">
                        {totalFamilySum}
                      </td>
                      <td colSpan={2 + customFields.length} className="border border-slate-400 p-1 text-left text-[10px] pl-2">
                        ጠቅላላ {filteredRecords.length} ተመዝጋቢዎች ተረጋገጡ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: REPORTS & ANALYTICS SUMMARY ================= */}
          {subTab === 'reports' && (
            <div className="space-y-6 text-xs">
              {/* 4 Summary Metric Boxes */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 border border-slate-300 rounded bg-slate-50 text-center">
                  <span className="text-[10px] font-bold text-slate-600 block uppercase">ጠቅላላ ተመዝጋቢዎች</span>
                  <span className="text-xl font-bold font-mono text-blue-950 block mt-1">{stats.totalBeneficiaries}</span>
                  <span className="text-[10px] text-slate-500">100% በመዝገብ የተካተቱ</span>
                </div>
                <div className="p-3 border border-slate-300 rounded bg-slate-50 text-center">
                  <span className="text-[10px] font-bold text-slate-600 block uppercase">ሰሪ ሀይል (Workforce)</span>
                  <span className="text-xl font-bold font-mono text-blue-950 block mt-1">{stats.workforceCount}</span>
                  <span className="text-[10px] text-slate-500">
                    {stats.totalBeneficiaries > 0 ? Math.round((stats.workforceCount / stats.totalBeneficiaries) * 100) : 0}% ድርሻ
                  </span>
                </div>
                <div className="p-3 border border-slate-300 rounded bg-slate-50 text-center">
                  <span className="text-[10px] font-bold text-slate-600 block uppercase">በቀጣይነት የሚረዱ</span>
                  <span className="text-xl font-bold font-mono text-blue-950 block mt-1">{stats.continuousCount}</span>
                  <span className="text-[10px] text-slate-500">
                    {stats.totalBeneficiaries > 0 ? Math.round((stats.continuousCount / stats.totalBeneficiaries) * 100) : 0}% ድርሻ
                  </span>
                </div>
                <div className="p-3 border border-slate-300 rounded bg-slate-50 text-center">
                  <span className="text-[10px] font-bold text-slate-600 block uppercase">ጠቅላላ የቤተሰብ ብዛት</span>
                  <span className="text-xl font-bold font-mono text-blue-950 block mt-1">{stats.totalFamilyMembers}</span>
                  <span className="text-[10px] text-slate-500">አማካይ {stats.averageFamilySize} በቤተሰብ</span>
                </div>
              </div>

              {/* Grid with Demographic Tables */}
              <div className="grid grid-cols-2 gap-5">
                {/* Woreda Distribution Table */}
                <div className="border border-slate-400 rounded overflow-hidden">
                  <div className="bg-slate-100 p-2 font-bold text-blue-950 border-b border-slate-400">
                    የተረጂዎች ስርጭት በወረዳ (Distribution by Woreda)
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-300 text-[10px] font-bold text-slate-700">
                        <th className="p-1.5">ወረዳ</th>
                        <th className="p-1.5 text-center">የተረጂ ብዛት</th>
                        <th className="p-1.5 text-center">መቶኛ (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {stats.woredaDistribution.map((w) => (
                        <tr key={w.woreda}>
                          <td className="p-1.5 font-medium">{w.woreda}</td>
                          <td className="p-1.5 text-center font-mono font-bold text-blue-950">{w.count}</td>
                          <td className="p-1.5 text-center font-mono">{w.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Health Condition Table */}
                <div className="border border-slate-400 rounded overflow-hidden">
                  <div className="bg-slate-100 p-2 font-bold text-blue-950 border-b border-slate-400">
                    የጤና ሁኔታ ምደባ (Health Status Breakdown)
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-300 text-[10px] font-bold text-slate-700">
                        <th className="p-1.5">የጤና ሁኔታ</th>
                        <th className="p-1.5 text-center">የሰው ብዛት</th>
                        <th className="p-1.5 text-center">መቶኛ (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {stats.healthDistribution.map((h) => (
                        <tr key={h.condition}>
                          <td className="p-1.5 font-medium">{h.condition}</td>
                          <td className="p-1.5 text-center font-mono font-bold text-blue-950">{h.count}</td>
                          <td className="p-1.5 text-center font-mono">{h.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gender and Household Breakdown */}
              <div className="border border-slate-400 rounded overflow-hidden">
                <div className="bg-slate-100 p-2 font-bold text-blue-950 border-b border-slate-400">
                  የጾታ እና የቤተሰብ ስብጥር (Gender & Household Demographics)
                </div>
                <div className="p-3 grid grid-cols-4 gap-4 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">ተመዝጋቢ ወንድ (Male)</span>
                    <span className="text-base font-bold font-mono text-blue-950">{stats.genderRatio.male}</span>
                    <span className="text-[10px] text-slate-600 ml-1">({stats.genderRatio.malePercentage}%)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">ተመዝጋቢ ሴት (Female)</span>
                    <span className="text-base font-bold font-mono text-blue-950">{stats.genderRatio.female}</span>
                    <span className="text-[10px] text-slate-600 ml-1">({stats.genderRatio.femalePercentage}%)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">ጠቅላላ የቤተሰብ አባላት</span>
                    <span className="text-base font-bold font-mono text-blue-950">{stats.totalFamilyMembers}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">አማካይ የቤተሰብ መጠን</span>
                    <span className="text-base font-bold font-mono text-blue-950">{stats.averageFamilySize} ነፍስ</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 3: FORM BUILDER SCHEMA SPECIFICATION ================= */}
          {subTab === 'formBuilder' && (
            <div className="space-y-5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-300 rounded leading-relaxed text-slate-700">
                ይህ ሰነድ በንፋስ ስልክ ላፍቶ ክፍለ ከተማ የተረጂዎች እና የፋይዳ ምዝገባ ሲስተም ውስጥ በይፋ የተፈቀዱ እና የሚሰበሰቡ ዋና እና ተለዋዋጭ የመረጃ ፊልዶች ዝርዝር መዋቅር (Form Specification) መሆኑን ያረጋግጣል።
              </div>

              {/* Core Standard Fields */}
              <div className="border border-slate-400 rounded overflow-hidden">
                <div className="bg-slate-100 p-2 font-bold text-blue-950 border-b border-slate-400">
                  1. መደበኛ ኦፊሴላዊ ፊልዶች (Core Standard Fields - 16 Fields)
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300 text-[10px] font-bold text-slate-700">
                      <th className="p-1.5 w-12 text-center">ተ.ቁ</th>
                      <th className="p-1.5">የፊልዱ ስም (Amharic)</th>
                      <th className="p-1.5">Field Name (English)</th>
                      <th className="p-1.5">የመረጃ አይነት (Type)</th>
                      <th className="p-1.5 text-center">ሁኔታ (Requirement)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { no: 1, am: 'ሙሉ ስም ከነአያት', en: 'Full Name with Grandfather', type: 'Text (ጽሁፍ)', req: 'ግዴታ (Required)' },
                      { no: 2, am: 'ጾታ', en: 'Gender', type: 'Toggle (ወንድ / ሴት)', req: 'ግዴታ (Required)' },
                      { no: 3, am: 'እድሜ', en: 'Age', type: 'Number (ቁጥር)', req: 'ግዴታ (Required)' },
                      { no: 4, am: 'ስልክ ቁጥር', en: 'Phone Number', type: 'Tel (ስልክ)', req: 'ግዴታ (Required)' },
                      { no: 5, am: 'የጤና ሁኔታ', en: 'Health Status', type: 'Dropdown Select', req: 'ግዴታ (Required)' },
                      { no: 6, am: 'የድጋፍ ምድብ', en: 'Registry Category', type: 'Radio (በቀጣይነት / ሰሪ ሀይል)', req: 'ግዴታ (Required)' },
                      { no: 7, am: 'ክፍለ ከተማ', en: 'Sub-City', type: 'Fixed (ንፋስ ስልክ ላፍቶ)', req: 'ግዴታ (Required)' },
                      { no: 8, am: 'ወረዳ', en: 'Woreda', type: 'Dropdown (ለቡ 01 - ወረዳ 15)', req: 'ግዴታ (Required)' },
                      { no: 9, am: 'ብሎክ / ቀጠና', en: 'Block / Zone', type: 'Text (ቀጠና)', req: 'አማራጭ (Optional)' },
                      { no: 10, am: 'የአከባቢ ልዩ መጠሪያ', en: 'Locality Landmark', type: 'Text (ልዩ መጠሪያ)', req: 'ግዴታ (Required)' },
                      { no: 11, am: 'የቤት ቁጥር / ሁኔታ', en: 'House No / Status', type: 'Text (ተከራይ ወይም ቁጥር)', req: 'ግዴታ (Required)' },
                      { no: 12, am: 'የፋይዳ መታወቂያ ቁጥር', en: 'Fayda National ID', type: '16-Digit Numeric (ፋይዳ)', req: 'ግዴታ (Required)' },
                      { no: 13, am: 'የቤተሰብ ብዛት - ወንድ', en: 'Family Male', type: 'Number (ቁጥር)', req: 'ግዴታ (Required)' },
                      { no: 14, am: 'የቤተሰብ ብዛት - ሴት', en: 'Family Female', type: 'Number (ቁጥር)', req: 'ግዴታ (Required)' },
                      { no: 15, am: 'ጠቅላላ የቤተሰብ ድምር', en: 'Total Family Size', type: 'Auto-Sum (ራስ ሰር ድምር)', req: 'ራስ ሰር (Auto)' }
                    ].map((f) => (
                      <tr key={f.no}>
                        <td className="p-1.5 text-center font-mono">{f.no}</td>
                        <td className="p-1.5 font-bold text-slate-900">{f.am}</td>
                        <td className="p-1.5 text-slate-600">{f.en}</td>
                        <td className="p-1.5 font-mono text-slate-700">{f.type}</td>
                        <td className="p-1.5 text-center">
                          <span className="font-semibold text-blue-900">{f.req}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Custom Configured Fields */}
              <div className="border border-slate-400 rounded overflow-hidden">
                <div className="bg-slate-100 p-2 font-bold text-blue-950 border-b border-slate-400 flex items-center justify-between">
                  <span>2. በአስተዳዳሪ የተፈጠሩ ተጨማሪ ፊልዶች (Dynamic Custom Fields)</span>
                  <span className="text-[10px] text-slate-500 font-mono">{customFields.length} ፊልዶች ተመዝግበዋል</span>
                </div>
                {customFields.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">ምንም ተጨማሪ ፊልድ አልተጨመረም</div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-300 text-[10px] font-bold text-slate-700">
                        <th className="p-1.5 w-12 text-center">ተ.ቁ</th>
                        <th className="p-1.5">የፊልዱ ስም (Amharic)</th>
                        <th className="p-1.5">Field Name (English)</th>
                        <th className="p-1.5">አይነት (Type)</th>
                        <th className="p-1.5">አማራጮች (Options)</th>
                        <th className="p-1.5 text-center">ግዴታ (Required)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {customFields.map((cf, idx) => (
                        <tr key={cf.id}>
                          <td className="p-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="p-1.5 font-bold text-slate-900">{cf.labelAm}</td>
                          <td className="p-1.5 text-slate-600">{cf.labelEn}</td>
                          <td className="p-1.5 font-mono text-slate-700">{cf.type}</td>
                          <td className="p-1.5 text-slate-600 max-w-xs truncate">
                            {cf.options ? cf.options.join(', ') : '—'}
                          </td>
                          <td className="p-1.5 text-center font-semibold">
                            {cf.required ? (
                              <span className="text-red-700 font-bold">ግዴታ (Yes)</span>
                            ) : (
                              <span className="text-slate-500">አማራጭ (No)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Official Signatures & Seal Block */}
          <div className="pt-8 mt-6 border-t border-slate-300 grid grid-cols-4 gap-4 text-center text-xs text-slate-800">
            <div>
              <p className="font-bold">ያዘጋጀው ባለሙያ</p>
              <div className="mt-8 border-b border-slate-800 w-3/4 mx-auto"></div>
              <p className="text-[10px] text-slate-500 mt-1">ስምና ፊርማ</p>
            </div>
            <div>
              <p className="font-bold">ያረጋገጠው ቡድን መሪ</p>
              <div className="mt-8 border-b border-slate-800 w-3/4 mx-auto"></div>
              <p className="text-[10px] text-slate-500 mt-1">ስምና ፊርማ</p>
            </div>
            <div>
              <p className="font-bold">ያጸደቀው የጽ/ቤት ኃላፊ</p>
              <div className="mt-8 border-b border-slate-800 w-3/4 mx-auto"></div>
              <p className="text-[10px] text-slate-500 mt-1">ስምና ፊርማ</p>
            </div>
            <div>
              <p className="font-bold">የክፍለ ከተማው ማህተም</p>
              <div className="mt-1 w-20 h-20 mx-auto border-2 border-dashed border-slate-400 rounded-full flex items-center justify-center text-[9px] text-slate-400">
                ክፍለ ከተማ ማህተም
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
