import React, { useState } from 'react';
import { BeneficiaryRecord, CustomFormField } from '../types/registry';
import { formatFaydaId } from '../utils/registryLogic';
import { EditBeneficiaryModal } from './EditBeneficiaryModal';
import { OfficialSlipPrintView } from './OfficialSlipPrintView';
import {
  Search,
  Edit2,
  Trash2,
  FileText,
  FileSpreadsheet,
  Printer,
  LayoutGrid,
  List,
  Phone,
  Copy,
  Check,
  Users,
  MapPin,
  Heart
} from 'lucide-react';

interface AdminDirectoryTabProps {
  filteredRecords: BeneficiaryRecord[];
  totalRecordsCount: number;
  customFields: CustomFormField[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onUpdateRecord: (updated: BeneficiaryRecord) => void;
  onDeleteRecord: (id: number) => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export const AdminDirectoryTab: React.FC<AdminDirectoryTabProps> = ({
  filteredRecords,
  totalRecordsCount,
  customFields,
  searchQuery,
  onSearchChange,
  onUpdateRecord,
  onDeleteRecord,
  onExportPdf,
  onExportExcel
}) => {
  // Modals state
  const [editingRecord, setEditingRecord] = useState<BeneficiaryRecord | null>(null);
  const [viewingSlipRecord, setViewingSlipRecord] = useState<BeneficiaryRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<BeneficiaryRecord | null>(null);
  const [copiedFaydaId, setCopiedFaydaId] = useState<number | null>(null);
  // View mode: 'auto' adapts based on screen size (cards on mobile, table on desktop)
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  const handleCopyFayda = (id: number, fayda: string) => {
    navigator.clipboard.writeText(fayda);
    setCopiedFaydaId(id);
    setTimeout(() => setCopiedFaydaId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Download Control Bar directly on the selected Directory section */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="በስም፣ በ16-አሃዝ ፋይዳ፣ በስልክ ወይም በሰፈር ይፈልጉ (Search Name, Fayda ID)..."
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50/50 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              አጽዳ
            </button>
          )}
        </div>

        {/* View mode toggle + Download Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* Layout switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'cards' || (viewMode === 'auto')
                  ? 'bg-white text-blue-950 shadow-xs md:text-slate-600 md:bg-transparent md:shadow-none'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="የካርድ እይታ (Card View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">ካርዶች</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="የሰንጠረዥ እይታ (Table View)"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">ሰንጠረዥ</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onExportExcel}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            title="Download UTF-8 BOM CSV compatible with Microsoft Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Excel (.csv)</span>
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer border-b-2 border-yellow-500"
            title="የተመረጡ ተመዝጋቢዎች ሰንጠረዥ PDF አውርድ ወይም አትም"
          >
            <FileText className="w-3.5 h-3.5 text-yellow-400" />
            <span>PDF ሪፖርት</span>
            <Printer className="w-3 h-3 text-yellow-400/80" />
          </button>
        </div>
      </div>

      {/* ==================== MOBILE/TABLET RESPONSIVE CARDS VIEW ==================== */}
      <div className={viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block md:hidden'}>
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-500">
            የተፈለገው መረጃ አልተገኘም (No records matched your search query).
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredRecords.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-3.5 space-y-3"
              >
                {/* Card Header: Name + Category */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        #{r.id}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {r.fullName}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {r.gender} • {r.age} ዓመት • {r.healthStatus}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.category === 'ሰሪ ሀይል'
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                  }`}>
                    {r.category}
                  </span>
                </div>

                {/* Fayda ID Bar with One-Tap Copy */}
                <div className="bg-slate-50 rounded-lg p-2 flex items-center justify-between border border-slate-200/80">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">
                      የፋይዳ ቁጥር (Fayda ID)
                    </span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-blue-950 tracking-wide block truncate">
                      {formatFaydaId(r.faydaId)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyFayda(r.id, r.faydaId)}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                    title="ፋይዳ ቁጥር ኮፒ አድርግ"
                  >
                    {copiedFaydaId === r.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">አድራሻ</span>
                    <span className="font-medium text-slate-900 text-[11px]">
                      {r.woreda}፣ ቀጠና {r.blockZone}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {r.locality || '—'} (ቤት: {r.houseNo || '—'})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">ስልክ ቁጥር</span>
                    <a
                      href={`tel:${r.phone}`}
                      className="font-mono font-medium text-blue-700 hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 shrink-0" />
                      <span>{r.phone}</span>
                    </a>
                  </div>

                  <div className="col-span-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600">የቤተሰብ ብዛት:</span>
                      <span className="font-bold text-blue-950 font-mono">
                        {r.familyTotal} (ወ: {r.familyMale} / ሴ: {r.familyFemale})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setViewingSlipRecord(r)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-yellow-400" />
                    <span>ወረቀት (Slip)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingRecord(r)}
                    className="p-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="አስተካክል (Edit)"
                  >
                    <Edit2 className="w-4 h-4 text-amber-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordToDelete(r)}
                    className="p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="ሰርዝ (Delete)"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================== DESKTOP SPREADSHEET TABLE ==================== */}
      <div className={`bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden ${
        viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden md:block'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-blue-950 text-white font-bold tracking-wider text-[11px] border-b-2 border-yellow-500 whitespace-nowrap">
                <th className="py-3 px-2.5 text-center w-12 border-r border-blue-900">ተ.ቁ</th>
                <th className="py-3 px-3 min-w-[140px] border-r border-blue-900">ሙሉ ስም ከነአያት</th>
                <th className="py-3 px-2.5 min-w-[70px] border-r border-blue-900 text-center">ወረዳ</th>
                <th className="py-3 px-2.5 min-w-[60px] border-r border-blue-900 text-center">ቀጠና</th>
                <th className="py-3 px-3 min-w-[100px] border-r border-blue-900">ልዩ መጠሪያ</th>
                <th className="py-3 px-2.5 min-w-[65px] border-r border-blue-900 text-center">የቤት ቁጥር</th>
                <th className="py-3 px-3 min-w-[140px] border-r border-blue-900 text-center">የፋይዳ መታወቂያ</th>
                <th className="py-3 px-2 text-center w-10 border-r border-blue-900">ጾታ</th>
                <th className="py-3 px-2 text-center w-10 border-r border-blue-900">እድሜ</th>
                <th className="py-3 px-2.5 min-w-[80px] border-r border-blue-900 text-center">የጤና ሁኔታ</th>
                <th className="py-3 px-2 text-center w-10 border-r border-blue-900">ወ</th>
                <th className="py-3 px-2 text-center w-10 border-r border-blue-900">ሴ</th>
                <th className="py-3 px-2.5 text-center w-12 border-r border-blue-900 bg-blue-900 text-yellow-400 font-extrabold">ድምር</th>
                <th className="py-3 px-3 min-w-[95px] border-r border-blue-900 text-center">ስልክ ቁጥር</th>
                <th className="py-3 px-3 min-w-[95px] border-r border-blue-900 text-center">ምድብ</th>
                {customFields.map((cf) => (
                  <th key={cf.id} className="py-3 px-3 min-w-[120px] max-w-[160px] truncate border-r border-blue-900 text-center" title={`${cf.labelAm} (${cf.labelEn})`}>
                    {cf.labelAm}
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[105px] sticky right-0 bg-blue-950 border-l border-blue-900">
                  ተግባራት
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={16 + customFields.length}
                    className="py-12 text-center text-slate-500 font-medium bg-slate-50"
                  >
                    የተፈለገው መረጃ አልተገኘም (No records matched your search query or sidebar filter).
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                  >
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-600 border-r border-slate-100">
                      {r.id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                      {r.fullName}
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {r.woreda}
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {r.blockZone}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 border-r border-slate-100 whitespace-nowrap">
                      {r.locality}
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {r.houseNo}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-950 border-r border-slate-100 tracking-tight whitespace-nowrap">
                      {formatFaydaId(r.faydaId)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-800 border-r border-slate-100 whitespace-nowrap">
                      {r.gender}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {r.age}
                    </td>
                    <td className="py-2.5 px-2.5 text-center border-r border-slate-100 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        r.healthStatus === 'ጤነኛ'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {r.healthStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {r.familyMale}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {r.familyFemale}
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-mono font-bold text-blue-950 bg-yellow-50/60 border-r border-slate-100 whitespace-nowrap">
                      {r.familyTotal}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {r.phone}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.category === 'ሰሪ ሀይል'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                      }`}>
                        {r.category}
                      </span>
                    </td>
                    {customFields.map((cf) => (
                      <td key={cf.id} className="py-2.5 px-3 text-center text-slate-700 border-r border-slate-100 whitespace-nowrap">
                        {r.customFields?.[cf.id] !== undefined ? String(r.customFields[cf.id]) : '—'}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] border-l border-slate-200">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingSlipRecord(r)}
                          className="p-1.5 text-blue-900 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                          title="የምዝገባ ወረቀት አሳይ / አትም (View Official Slip)"
                          aria-label={`View slip for ${r.fullName}`}
                        >
                          <FileText className="w-4 h-4 text-blue-900" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRecord(r)}
                          className="p-1.5 text-amber-700 hover:bg-amber-50 rounded cursor-pointer transition-colors"
                          title="አስተካክል (Edit Beneficiary)"
                          aria-label={`Edit ${r.fullName}`}
                        >
                          <Edit2 className="w-4 h-4 text-amber-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecordToDelete(r)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                          title="ሰርዝ (Delete Beneficiary)"
                          aria-label={`Delete ${r.fullName}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Beneficiary Modal */}
      {editingRecord && (
        <EditBeneficiaryModal
          record={editingRecord}
          customFields={customFields}
          onSave={(updated) => {
            onUpdateRecord(updated);
            setEditingRecord(null);
          }}
          onClose={() => setEditingRecord(null)}
        />
      )}

      {/* Individual Slip Print View Modal */}
      {viewingSlipRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-6 max-h-[90vh] overflow-y-auto">
            <OfficialSlipPrintView
              record={viewingSlipRecord}
              customFields={customFields}
              onClose={() => setViewingSlipRecord(null)}
              isStandaloneModal={true}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-4 border-red-600 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900">
              ተረጂውን ከመዝገብ መሰረዝ ይፈልጋሉ?
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              <strong>{recordToDelete.fullName}</strong> (የፋይዳ ቁጥር: {formatFaydaId(recordToDelete.faydaId)}) የሚለውን መዝገብ ሙሉ ለሙሉ ለመሰረዝ እርግጠኛ ነዎት?
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ይቅር (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteRecord(recordToDelete.id);
                  setRecordToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs cursor-pointer"
              >
                አዎ ሰርዝ (Yes, Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
