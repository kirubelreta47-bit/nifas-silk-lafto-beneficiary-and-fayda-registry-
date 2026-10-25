import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { RegistrationForm } from './components/RegistrationForm';
import { AdminPortal } from './components/AdminPortal';
import { RegistrationSuccessModal } from './components/RegistrationSuccessModal';
import { AdminLoginPage } from './components/AdminLoginPage';
import { BeneficiaryRecord, CustomFormField, AdminUser } from './types/registry';
import { INITIAL_BENEFICIARIES, INITIAL_CUSTOM_FIELDS } from './data/initialRecords';
import { CivicEmblem } from './components/CivicEmblem';
import { ShieldCheck, Phone, Mail, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import {
  fetchBeneficiariesApi,
  createBeneficiaryApi,
  updateBeneficiaryApi,
  deleteBeneficiaryApi,
  fetchCustomFieldsApi,
  createCustomFieldApi,
  deleteCustomFieldApi,
  reorderCustomFieldsApi,
  resetDemoDataApi,
  getCurrentAdminApi,
  logoutAdminApi
} from './services/api';

export default function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [currentView, setCurrentView] = useState<'public' | 'admin'>('public');

  const [records, setRecords] = useState<BeneficiaryRecord[]>(INITIAL_BENEFICIARIES);
  const [customFields, setCustomFields] = useState<CustomFormField[]>(INITIAL_CUSTOM_FIELDS);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal for recent submission confirmation
  const [recentSubmission, setRecentSubmission] = useState<BeneficiaryRecord | null>(null);

  // 1. Initial Authentication Check on Load
  useEffect(() => {
    let isMounted = true;
    getCurrentAdminApi()
      .then((user) => {
        if (!isMounted) return;
        if (user) {
          setCurrentAdmin(user);
          const isAdmin = user.role === 'admin' || user.role === 'super_admin';
          if (isAdmin && window.location.pathname.startsWith('/admin')) {
            setCurrentView('admin');
          } else {
            setCurrentView(isAdmin && window.location.pathname.startsWith('/admin') ? 'admin' : 'public');
          }
        } else {
          setCurrentAdmin(null);
        }
      })
      .catch(() => {
        if (isMounted) setCurrentAdmin(null);
      })
      .finally(() => {
        if (isMounted) setIsCheckingAuth(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load real data from backend API once authenticated
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [dbRecords, dbFields] = await Promise.all([
        fetchBeneficiariesApi(),
        fetchCustomFieldsApi()
      ]);
      if (Array.isArray(dbRecords)) {
        setRecords(dbRecords);
      }
      if (Array.isArray(dbFields) && dbFields.length > 0) {
        setCustomFields(dbFields);
      }
    } catch (err: any) {
      console.error('Failed to load data from server:', err);
      setFetchError(err.message || 'ከዳታቤዝ መረጃ ማምጣት አልተቻለም');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentAdmin) {
      loadData();
    }
  }, [currentAdmin, loadData]);

  // Sync route with URL navigation (/ and /admin)
  const navigateView = (view: 'public' | 'admin') => {
    const isAdmin = currentAdmin?.role === 'admin' || currentAdmin?.role === 'super_admin';
    // User role can only access public registration form
    const allowedView = !isAdmin ? 'public' : view;

    setCurrentView(allowedView);
    const targetPath = allowedView === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const isAdmin = currentAdmin?.role === 'admin' || currentAdmin?.role === 'super_admin';
      if (path.startsWith('/admin') && isAdmin) {
        setCurrentView('admin');
      } else {
        setCurrentView('public');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentAdmin]);

  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentAdmin(user);
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (isAdmin) {
      navigateView('admin');
    } else {
      navigateView('public');
    }
  };

  const handleLogout = async () => {
    await logoutAdminApi();
    setCurrentAdmin(null);
    setCurrentView('public');
  };

  // Calculate next Serial ID for display
  const nextId = records.length > 0
    ? Math.max(...records.map((r) => r.id || 0)) + 1
    : 1;

  // Add Beneficiary Handler (direct database call)
  const handleAddRecord = async (recordData: Omit<BeneficiaryRecord, 'id'>) => {
    try {
      const created = await createBeneficiaryApi(recordData);
      setRecords((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setRecentSubmission(created);
    } catch (err: any) {
      console.error('Registration failed:', err);
      alert(err.message || 'ምዝገባው አልተሳካም። እባክዎ እንደገና ይሞክሩ።');
    }
  };

  // Update Beneficiary Handler
  const handleUpdateRecord = async (updated: BeneficiaryRecord) => {
    try {
      const saved = await updateBeneficiaryApi(updated);
      setRecords((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
    } catch (err: any) {
      console.error('Update failed:', err);
      alert(err.message || 'መረጃውን ማደስ አልተሳካም');
    }
  };

  // Delete Beneficiary Handler
  const onDeleteRecord = async (id: number) => {
    try {
      await deleteBeneficiaryApi(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(err.message || 'መረጃውን መሰረዝ አልተሳካም');
    }
  };

  // Reset Demo Data
  const handleResetDemoData = async () => {
    if (window.confirm('ሁሉንም መረጃዎች ወደ መጀመሪያው የንፋስ ስልክ ላፍቶ ናሙና መረጃዎች መመለስ ይፈልጋሉ? (Reset all records in database?)')) {
      try {
        const res = await resetDemoDataApi();
        setRecords(res.records);
        setCustomFields(res.customFields);
      } catch (err: any) {
        console.error('Failed to reset demo data:', err);
        alert(err.message || 'ናሙና ዳታዎችን መመለስ አልተቻለም');
      }
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

  // 3. Fast Loading Screen on mount while checking session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-950 text-white p-4 selection:bg-yellow-500">
        <CivicEmblem size={64} className="animate-pulse drop-shadow-lg" />
        <h2 className="text-sm sm:text-base font-bold mt-4 tracking-tight text-white">
          በንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር
        </h2>
        <p className="text-xs text-yellow-400 mt-1">
          የተረጂዎች እና የፋይዳ ምዝገባ ሲስተም (Beneficiary & Fayda Registry)
        </p>
        <div className="w-6 h-6 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mt-6" />
      </div>
    );
  }

  // 4. Strict Authentication Gate: If not authenticated, render Login Page only
  if (!currentAdmin) {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentAdmin.role === 'admin' || currentAdmin.role === 'super_admin';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-900 selection:text-white">
      {/* Top Navigation Header */}
      <Header
        currentView={currentView}
        onViewChange={navigateView}
        totalRecordsCount={records.length}
        currentUser={currentAdmin}
        onLogout={handleLogout}
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
            onClick={loadData}
            className="flex items-center gap-1 font-bold underline hover:text-rose-950 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> እንደገና ሞክር (Retry)
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'admin' && isAdmin ? (
          <AdminPortal
            records={records}
            customFields={customFields}
            currentAdmin={currentAdmin}
            onAddRecord={handleAddRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={onDeleteRecord}
            onResetDemoData={handleResetDemoData}
            onAddField={handleAddField}
            onDeleteField={handleDeleteField}
            onMoveField={handleMoveField}
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
                አድራሻ እና የስራ ሰዓት (Office Location)
              </h5>
              <p className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>አዲስ አበባ፣ ንፋስ ስልክ ላፍቶ ክፍለ ከተማ ዋና መ/ቤት፣ ለቡ መብራት ኃይል አደባባይ አጠገብ</span>
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
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => navigateView('admin')}
                    className="text-left text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
                  >
                    • የአስተዳዳሪ ፖርታል (Admin Portal)
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  • ከሲስተሙ ውጣ (Logout)
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <p>
              © {new Date().getFullYear()} በንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር። መብቱ በህግ የተጠበቀ ነው።
            </p>
            <p className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-yellow-500" />
              <span>ኦፊሴላዊ የሲቪክ መረጃ አስተዳደር ሲስተም</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
