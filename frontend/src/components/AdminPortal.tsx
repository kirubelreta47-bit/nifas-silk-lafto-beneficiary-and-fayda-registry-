import React, { useEffect, useState } from 'react';
import { BeneficiaryRecord, CustomFormField, RegistryStats } from '../types/registry';
import { WOREDA_OPTIONS, HEALTH_OPTIONS } from '../data/initialRecords';
import {
  generateCsvExport,
  downloadCsv
} from '../utils/registryLogic';
import { fetchBeneficiariesApi } from '../services/api';
import { AdminDirectoryTab } from './AdminDirectoryTab';
import { AdminReportsTab } from './AdminReportsTab';
import { AdminFormBuilderTab } from './AdminFormBuilderTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminPdfExportModal } from './AdminPdfExportModal';
import { ImportExcelModal } from './ImportExcelModal';
import { RegistrationForm } from './RegistrationForm';
import {
  TableProperties,
  BarChart2,
  Sliders,
  Shield,
  PlusCircle,
  FileSpreadsheet,
  Upload,
  RotateCcw,
  X,
  Layers,
  Filter,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';
import { AdminUser } from '../types/registry';

export interface DirectoryQuery {
  page: number;
  limit: number;
  search: string;
  category: 'all' | 'workforce' | 'continuous';
  woreda: string;
  health: string;
}

interface AdminPortalProps {
  records: BeneficiaryRecord[];
  directoryTotal: number;
  listLoading: boolean;
  stats: RegistryStats;
  customFields: CustomFormField[];
  currentAdmin?: AdminUser | null;
  onDirectoryQuery: (query: DirectoryQuery) => void;
  onAddRecord: (record: Omit<BeneficiaryRecord, 'id'>) => void;
  onUpdateRecord: (updated: BeneficiaryRecord) => void;
  onDeleteRecord: (id: number) => void;
  onResetDemoData: () => void;
  onAddField: (field: CustomFormField) => void;
  onDeleteField: (id: string) => void;
  onMoveField: (index: number, direction: 'up' | 'down') => void;
  onImportRecords: (created: BeneficiaryRecord[]) => void;
  nextId: number;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  records,
  directoryTotal,
  listLoading,
  stats,
  customFields,
  currentAdmin = null,
  onDirectoryQuery,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onResetDemoData,
  onAddField,
  onDeleteField,
  onMoveField,
  onImportRecords,
  nextId
}) => {
  // Main section state
  const [subTab, setSubTab] = useState<'directory' | 'reports' | 'formBuilder' | 'users'>('directory');

  // Directory filter states (housed in sidebar)
  const [activeCategory, setActiveCategory] = useState<'all' | 'workforce' | 'continuous'>('all');
  const [woredaFilter, setWoredaFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 40;
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Add Beneficiary Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  // Universal PDF Export Modal state (available for all selected menu parts)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const allCount = stats.totalBeneficiaries;
  const workforceCount = stats.workforceCount;
  const continuousCount = stats.continuousCount;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    onDirectoryQuery({
      page,
      limit: pageSize,
      search: debouncedSearch,
      category: activeCategory,
      woreda: woredaFilter,
      health: healthFilter
    });
  }, [page, pageSize, debouncedSearch, activeCategory, woredaFilter, healthFilter, onDirectoryQuery]);

  const categoryParam = activeCategory === 'workforce'
    ? 'ሰሪ ሀይል'
    : activeCategory === 'continuous'
      ? 'በቀጣይነት የሚረዱ'
      : '';

  const handleExportExcel = async () => {
    try {
      const exported = await fetchBeneficiariesApi({
        search: debouncedSearch,
        woreda: woredaFilter,
        healthStatus: healthFilter,
        category: categoryParam,
        exportAll: true
      });
      const csvContent = generateCsvExport(exported.records, customFields);
      const dateStr = new Date().toISOString().split('T')[0];
      const categoryName = activeCategory === 'all' ? 'All' : activeCategory === 'workforce' ? 'Workforce' : 'Continuous';
      downloadCsv(csvContent, `Nifas_Silk_Lafto_Registry_${categoryName}_${dateStr}.csv`);
    } catch (err: any) {
      alert(err.message || 'Excel መላክ አልተሳካም');
    }
  };

  const handleAddModalSubmit = (newRec: Omit<BeneficiaryRecord, 'id'>) => {
    onAddRecord(newRec);
    setIsAddModalOpen(false);
  };

  const hasActiveFilters = activeCategory !== 'all' || woredaFilter !== 'all' || healthFilter !== 'all' || searchQuery !== '';

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ===================== SIDEBAR ===================== */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs lg:sticky lg:top-28">
          {/* Institution / Section Badge */}
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-950 text-yellow-400 flex items-center justify-center font-bold text-xs shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-950 leading-tight">
                የአስተዳዳሪ ማስተባበሪያ
              </h2>
              <p className="text-[11px] text-slate-500 leading-tight">Admin Management Panel</p>
            </div>
          </div>

          {/* Group 1: Main Section Tabs */}
          <div className="space-y-1">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
              ክፍሎች (Sections)
            </span>

            <button
              type="button"
              onClick={() => setSubTab('directory')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                subTab === 'directory'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TableProperties className="w-4 h-4 text-yellow-400" />
                <span>የተመዝጋቢዎች ዝርዝር</span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                subTab === 'directory' ? 'bg-yellow-400 text-blue-950' : 'bg-slate-100 text-slate-700'
              }`}>
                {allCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('reports')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                subTab === 'reports'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-4 h-4 text-yellow-400" />
                <span>ሪፖርት እና ትንታኔ</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('formBuilder')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                subTab === 'formBuilder'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-yellow-400" />
                <span>ቅጽ ማስተካከያ</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                {customFields.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('users')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                subTab === 'users'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-yellow-400" />
                <span>ተጠቃሚዎች (Users)</span>
              </div>
            </button>
          </div>

          {/* Mobile Collapsible Toggle for Categories & Filters */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="lg:hidden w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-900" />
              <span>ማጣሪያዎች እና ምድቦች (Filters & Categories)</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              )}
            </span>
            {isMobileFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Group 2 & 3: Collapsible on Mobile, Always Visible on Desktop */}
          <div className={`${isMobileFiltersOpen ? 'block' : 'hidden'} lg:block space-y-4`}>
            {/* Group 2: Category Sheets Selection */}
            <div className="pt-3 border-t border-slate-100 space-y-1">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>የድጋፍ ምድብ (Category)</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setPage(1);
                  if (subTab !== 'directory') setSubTab('directory');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === 'all' && subTab === 'directory'
                    ? 'bg-blue-100/70 text-blue-950 font-bold border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>ጠቅላላ (All)</span>
                <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.2 rounded border border-slate-200 text-slate-700">
                  {allCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategory('workforce');
                  setPage(1);
                  if (subTab !== 'directory') setSubTab('directory');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === 'workforce' && subTab === 'directory'
                    ? 'bg-blue-100/70 text-blue-950 font-bold border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>ሰሪ ሀይል (Workforce)</span>
                <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.2 rounded border border-slate-200 text-blue-950">
                  {workforceCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategory('continuous');
                  setPage(1);
                  if (subTab !== 'directory') setSubTab('directory');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === 'continuous' && subTab === 'directory'
                    ? 'bg-blue-100/70 text-blue-950 font-bold border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>በቀጣይነት የሚረዱ (Continuous)</span>
                <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.2 rounded border border-slate-200 text-blue-950">
                  {continuousCount}
                </span>
              </button>
            </div>

            {/* Group 3: Woreda & Health Dropdown Filters */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>ማጣሪያዎች (Filters)</span>
              </span>

            {/* Woreda Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 px-1">
                ወረዳ (Woreda)
              </label>
              <select
                value={woredaFilter}
                onChange={(e) => {
                  setWoredaFilter(e.target.value);
                  setPage(1);
                  if (subTab !== 'directory') setSubTab('directory');
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-900"
              >
                <option value="all">ሁሉም ወረዳዎች (All Woredas)</option>
                {WOREDA_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Health Status Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 px-1">
                የጤና ሁኔታ (Health Status)
              </label>
              <select
                value={healthFilter}
                onChange={(e) => {
                  setHealthFilter(e.target.value);
                  setPage(1);
                  if (subTab !== 'directory') setSubTab('directory');
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-900"
              >
                <option value="all">ሁሉም የጤና ሁኔታዎች (All Health)</option>
                {HEALTH_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Filter Indicator */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>የተገኙ ተመዝጋቢዎች:</span>
                <span className="font-mono font-bold text-blue-950">
                  {directoryTotal} ከ {allCount} ውስጥ
                </span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('all');
                    setWoredaFilter('all');
                    setHealthFilter('all');
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="mt-1.5 text-[11px] text-blue-900 hover:underline font-semibold block text-left cursor-pointer"
                >
                  ማጣሪያዎችን አጽዳ (Reset Filters)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Group 4: Quick Actions */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
              ተግባራት (Actions)
            </span>

            {/* Add Beneficiary Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer border-b-2 border-yellow-500"
            >
              <PlusCircle className="w-4 h-4 text-yellow-400" />
              <span>አዲስ ተመዝጋቢ ጨምር (Add Beneficiary)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubTab('directory');
                setIsImportModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>ከ Excel አስገባ (Import Excel)</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              type="button"
              onClick={onResetDemoData}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title="የናሙና ዳታዎችን መልስ (Reset Demo Data)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>ዳታውን አድስ (Reset Data)</span>
            </button>
          </div>
        </aside>

        {/* ===================== MAIN CONTENT AREA ===================== */}
        <main className="flex-1 min-w-0 w-full space-y-4">
          {subTab === 'directory' && (
            <AdminDirectoryTab
              filteredRecords={records}
              filteredTotal={directoryTotal}
              page={page}
              pageSize={pageSize}
              listLoading={listLoading}
              customFields={customFields}
              searchQuery={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPage(1);
              }}
              onPageChange={setPage}
              onUpdateRecord={onUpdateRecord}
              onDeleteRecord={onDeleteRecord}
              onExportPdf={() => setIsPdfModalOpen(true)}
              onExportExcel={() => { void handleExportExcel(); }}
              onImportExcel={() => setIsImportModalOpen(true)}
            />
          )}

          {subTab === 'reports' && (
            <AdminReportsTab
              stats={stats}
              onExportPdf={() => setIsPdfModalOpen(true)}
            />
          )}

          {subTab === 'formBuilder' && (
            <AdminFormBuilderTab
              customFields={customFields}
              onAddField={onAddField}
              onDeleteField={onDeleteField}
              onMoveField={onMoveField}
              onExportPdf={() => setIsPdfModalOpen(true)}
            />
          )}

          {subTab === 'users' && (
            <AdminUsersTab currentAdmin={currentAdmin} />
          )}
        </main>
      </div>

      {/* Universal Section PDF Export & Print Modal */}
      {isPdfModalOpen && (
        <AdminPdfExportModal
          subTab={subTab}
          activeCategory={activeCategory}
          records={records}
          filteredRecords={records}
          stats={stats}
          customFields={customFields}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}

      {isImportModalOpen && (
        <ImportExcelModal
          customFields={customFields}
          existingRecords={records}
          onImported={onImportRecords}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {/* Add Beneficiary Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between border-b-2 border-yellow-500 sticky top-0 z-10">
              <h3 className="text-base font-bold text-white">
                አዲስ ተረጂ ወደ መዝገብ አስገባ (Add New Beneficiary to Registry)
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-900 rounded-lg cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 sm:p-4">
              <RegistrationForm
                customFields={customFields}
                onSubmit={handleAddModalSubmit}
                nextId={nextId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
