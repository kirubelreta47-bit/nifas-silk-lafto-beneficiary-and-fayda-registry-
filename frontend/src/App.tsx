import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { RegistrationForm } from './components/RegistrationForm';
import { AdminPortal, DirectoryQuery } from './components/AdminPortal';
import { AdminLoginPage } from './components/AdminLoginPage';
import { RegistrationSuccessModal } from './components/RegistrationSuccessModal';
import { BeneficiaryRecord, CustomFormField, AdminUser, RegistryStats } from './types/registry';
import { INITIAL_CUSTOM_FIELDS } from './data/initialRecords';
import { CivicEmblem } from './components/CivicEmblem';
import { Phone, Mail, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import {
  fetchBeneficiariesApi,
  fetchRegistryStatsApi,
  createBeneficiaryApi,
  updateBeneficiaryApi,
  deleteBeneficiaryApi,
  fetchCustomFieldsApi,
  createCustomFieldApi,
  deleteCustomFieldApi,
  reorderCustomFieldsApi,
  getCurrentAdminApi,
  logoutAdminApi
} from './services/api';

const EMPTY_STATS: RegistryStats = {
  totalBeneficiaries: 0,
  workforceCount: 0,
  continuousCount: 0,
  totalFamilyMembers: 0,
  maleBeneficiaries: 0,
  femaleBeneficiaries: 0,
  averageFamilySize: 0,
  woredaDistribution: [],
  healthDistribution: [],
  genderRatio: { male: 0, female: 0, malePercentage: 0, femalePercentage: 0 }
};

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [currentView, setCurrentView] = useState<'public' | 'admin'>(
    window.location.pathname.startsWith('/admin') ? 'admin' : 'public'
  );

  const [records, setRecords] = useState<BeneficiaryRecord[]>([]);
  const [directoryTotal, setDirectoryTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [stats, setStats] = useState<RegistryStats>(EMPTY_STATS);
  const [nextId, setNextId] = useState(1);
  const [customFields, setCustomFields] = useState<CustomFormField[]>(INITIAL_CUSTOM_FIELDS);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const directoryQueryRef = useRef<DirectoryQuery>({
    page: 1,
    limit: 40,
    search: '',
    category: 'all',
    woreda: 'all',
    health: 'all'
  });

  // Modal for recent submission confirmation
  const [recentSubmission, setRecentSubmission] = useState<BeneficiaryRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    getCurrentAdminApi()
      .then((existing) => {
        if (isMounted) setCurrentAdmin(existing);
      })
      .finally(() => {
        if (isMounted) setAuthReady(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const loadStats = useCallback(async () => {
    const next = await fetchRegistryStatsApi();
    setStats(next);
    setNextId(next.nextId || 1);
  }, []);

  const loadDirectory = useCallback(async (query: DirectoryQuery) => {
    directoryQueryRef.current = query;
    setListLoading(true);
    setFetchError(null);
    try {
      const category = query.category === 'workforce'
        ? 'ሰሪ ሀይል'
        : query.category === 'continuous'
          ? 'በቀጣይነት የሚረዱ'
          : '';
      const page = await fetchBeneficiariesApi({
        search: query.search,
        woreda: query.woreda,
        healthStatus: query.health,
        category,
        page: query.page,
        limit: query.limit
      });
      setRecords(page.records);
      setDirectoryTotal(page.total);
    } catch (err: any) {
      console.error('Failed to load directory page:', err);
      setFetchError(err.message || 'ከዳታቤዝ መረጃ ማምጣት አልተቻለም');
    } finally {
      setListLoading(false);
    }
  }, []);

  const refreshRegistry = useCallback(async () => {
    await Promise.all([loadStats(), loadDirectory(directoryQueryRef.current)]);
  }, [loadStats, loadDirectory]);

  useEffect(() => {
    if (!currentAdmin) return;
    let isMounted = true;
    Promise.all([fetchRegistryStatsApi(), fetchCustomFieldsApi()])
      .then(([nextStats, dbFields]) => {
        if (!isMounted) return;
        setStats(nextStats);
        setNextId(nextStats.nextId || 1);
        if (Array.isArray(dbFields) && dbFields.length > 0) setCustomFields(dbFields);
      })
      .catch((err: any) => {
        if (isMounted) setFetchError(err.message || 'ከዳታቤዝ መረጃ ማምጣት አልተቻለም');
      });
    return () => {
      isMounted = false;
    };
  }, [currentAdmin]);

  const handleLogout = async () => {
    await logoutAdminApi();
    setCurrentAdmin(null);
    setRecords([]);
    setDirectoryTotal(0);
    setStats(EMPTY_STATS);
    setRecentSubmission(null);
    setFetchError(null);
    navigateView('public');
  };

  const navigateView = (view: 'public' | 'admin') => {
    setCurrentView(view);
    const targetPath = view === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(window.location.pathname.startsWith('/admin') ? 'admin' : 'public');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleImportRecords = async (_created: BeneficiaryRecord[]) => {
    await refreshRegistry();
  };

  const handleAddRecord = async (recordData: Omit<BeneficiaryRecord, 'id'>) => {
    try {
      const created = await createBeneficiaryApi(recordData);
      setRecentSubmission(created);
      await refreshRegistry();
    } catch (err: any) {
      console.error('Registration failed:', err);
      alert(err.message || 'ምዝገባው አልተሳካም። እባክዎ እንደገና ይሞክሩ።');
    }
  };

  const handleUpdateRecord = async (updated: BeneficiaryRecord) => {
    try {
      await updateBeneficiaryApi(updated);
      await refreshRegistry();
    } catch (err: any) {
      console.error('Update failed:', err);
      alert(err.message || 'መረጃውን ማደስ አልተሳካም');
    }
  };

  const onDeleteRecord = async (id: number) => {
    try {
      await deleteBeneficiaryApi(id);
      await refreshRegistry();
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(err.message || 'መረጃውን መሰረዝ አልተሳካም');
    }
  };

  // Custom Field Management
  const handleAddField = async (newField: CustomFormField) => {
    try {
      const created = await createCustomFieldApi(newField);
      setCustomFields((prev) => [...prev, created]);
    } catch (err: any) {
      console.error('Create field failed:', err);
      alert(err.message || 'አዲስ ቅጽ መጨመር አልተሳካም');
    }
  };

  const handleDeleteField = async (id: string) => {
    try {
      await deleteCustomFieldApi(id);
      setCustomFields((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      console.error('Delete field failed:', err);
      alert(err.message || 'ቅጹን መሰረዝ አልተሳካም');
    }
  };

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    const next = [...customFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < next.length) {
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      setCustomFields(next);
      try {
        await reorderCustomFieldsApi(next.map((f) => f.id));
      } catch (err: any) {
        console.error('Failed to reorder fields in database:', err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-900 selection:text-white">
      {!authReady ? (
        <div className="min-h-screen bg-blue-950 text-white flex items-center justify-center">
          <p className="text-sm font-bold text-yellow-300">መግቢያ በመፈተሽ ላይ...</p>
        </div>
      ) : !currentAdmin ? (
        <AdminLoginPage onLoginSuccess={setCurrentAdmin} />
      ) : (
        <>
      <Header
        currentView={currentView}
        onViewChange={navigateView}
        totalRecordsCount={stats.totalBeneficiaries}
        currentAdmin={currentAdmin}
        onLogout={() => { void handleLogout(); }}
      />

      {/* Connection Error Banner if Backend has an issue */}
      {fetchError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => { void refreshRegistry(); }}
            className="flex items-center gap-1 font-bold underline hover:text-rose-950 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> እንደገና ሞክር (Retry)
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'admin' ? (
          <AdminPortal
            records={records}
            directoryTotal={directoryTotal}
            listLoading={listLoading}
            stats={stats}
            customFields={customFields}
            onDirectoryQuery={loadDirectory}
            currentAdmin={currentAdmin}
            onAddRecord={handleAddRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={onDeleteRecord}
            onAddField={handleAddField}
            onDeleteField={handleDeleteField}
            onMoveField={handleMoveField}
            onImportRecords={handleImportRecords}
            nextId={nextId}
          />
        ) : (
          <RegistrationForm
            onSubmit={handleAddRecord}
            customFields={customFields}
            nextId={nextId}
          />
        )}
      </main>

      {/* Registration Confirmed Modal */}
      {recentSubmission && (
        <RegistrationSuccessModal
          record={recentSubmission}
          onRegisterAnother={() => setRecentSubmission(null)}
          onClose={() => setRecentSubmission(null)}
        />
      )}

      {/* Official Government Footer: Blue & Gold */}
      <footer className="no-print bg-slate-900 text-slate-300 border-t-4 border-yellow-500 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            {/* Institution Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CivicEmblem size={40} />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    በንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር
                  </h4>
                  <p className="text-xs text-yellow-400">
                    Nifas Silk-Lafto Sub-City Administration
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                የተረጂዎች እና የፋይዳ ብሔራዊ መታወቂያ ምዝገባና ማስተባበሪያ ዲጂታል ሲስተም። በክፍለ ከተማው የሚገኙ 18,000+ ተረጂዎችን መረጃ ዲጂታላይዝ በማድረግ ቀልጣፋ ድጋፍ ለመስጠት የተዘጋጀ።
              </p>
            </div>

            {/* Sub-City Offices & Contact */}
            <div className="space-y-2 text-xs">
              <h5 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-1.5">
                አድራሻ (Location)
              </h5>
              <p className="font-bold text-yellow-400">ሃይሌ ጋርመንት · Hayle Garment</p>
              <p className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>አዲስ አበባ፣ ንፋስ ስልክ ላፍቶ ክፍለ ከተማ፣ ሃይሌ ጋርመንት አደባባይ</span>
              </p>
              <p className="flex items-center gap-2 text-slate-400">
                <Phone className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>ስልክ: +251 11 442 0000 / 011 442 0001</span>
              </p>
              <p className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>ኢሜይል: info@nslsubcity.gov.et</span>
              </p>
            </div>

            {/* Quick Links & Switch */}
            <div className="space-y-3 text-xs">
              <h5 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-1.5">
                ፈጣን መዳረሻ (Navigation)
              </h5>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigateView('public')}
                  className="text-left text-blue-300 hover:text-white transition-colors cursor-pointer"
                >
                  • የምዝገባ ቅጽ (Registration Form)
                </button>
                <button
                  type="button"
                  onClick={() => navigateView('admin')}
                  className="text-left text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
                >
                  • የተመዝጋቢዎች ዝርዝር (Registry)
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <p>
              © {new Date().getFullYear()} በንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር። መብቱ በህግ የተጠበቀ ነው።
            </p>
            <p className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-4 h-4 text-yellow-500 shrink-0" />
              <span>ሃይሌ ጋርመንት፣ ንፋስ ስልክ ላፍቶ፣ አዲስ አበባ</span>
            </p>
          </div>
        </div>
      </footer>
        </>
      )}
    </div>
  );
}
