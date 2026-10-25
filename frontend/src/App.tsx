import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { RegistrationForm } from './components/RegistrationForm';
import { AdminPortal } from './components/AdminPortal';
import { RegistrationSuccessModal } from './components/RegistrationSuccessModal';
import { AdminLoginPage } from './components/AdminLoginPage';
import { BeneficiaryRecord, CustomFormField, AdminUser } from './types/registry';
import { INITIAL_BENEFICIARIES, INITIAL_CUSTOM_FIELDS } from './data/initialRecords';
import { CivicEmblem } from './components/CivicEmblem';
import { ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
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
  checkDatabaseHealth,
  getCurrentAdminApi,
  logoutAdminApi
} from './services/api';

const STORAGE_KEY_RECORDS = 'nsl_beneficiaries_registry_v1';
const STORAGE_KEY_CUSTOM_FIELDS = 'nsl_custom_form_fields_v1';

const getInitialRoute = (): 'public' | 'admin' => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return 'admin';
  }
  return 'public';
};

export default function App() {
  const [currentView, setCurrentView] = useState<'public' | 'admin'>(getInitialRoute);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load beneficiaries from localStorage or fall back to pre-populated records
  const [records, setRecords] = useState<BeneficiaryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved records from localStorage', e);
    }
    return INITIAL_BENEFICIARIES;
  });

  // Load custom form fields from localStorage or fall back to defaults
  const [customFields, setCustomFields] = useState<CustomFormField[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_FIELDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved custom fields from localStorage', e);
    }
    return INITIAL_CUSTOM_FIELDS;
  });

  // Modal for recent submission confirmation
  const [recentSubmission, setRecentSubmission] = useState<BeneficiaryRecord | null>(null);

  // Sync to database on mount
  const syncWithDatabase = useCallback(async () => {
    try {
      const isHealthy = await checkDatabaseHealth();
      setIsDbConnected(isHealthy);
      if (isHealthy) {
        const [dbRecords, dbFields] = await Promise.all([
          fetchBeneficiariesApi(),
          fetchCustomFieldsApi()
        ]);
        if (Array.isArray(dbRecords) && dbRecords.length > 0) {
          setRecords(dbRecords);
        }
        if (Array.isArray(dbFields) && dbFields.length > 0) {
          setCustomFields(dbFields);
        }
      }
    } catch (err) {
      console.warn('Database sync warning, using local fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for active admin session on mount
  useEffect(() => {
    getCurrentAdminApi().then((user) => {
      if (user) {
        setCurrentAdmin(user);
      }
    });
  }, []);

  // Sync route with URL navigation (/ and /admin)
  const navigateView = (view: 'public' | 'admin') => {
    setCurrentView(view);
    const targetPath = view === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        setCurrentView('admin');
      } else {
        setCurrentView('public');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentAdmin(user);
    navigateView('admin');
  };

  const handleLogout = async () => {
    await logoutAdminApi();
    setCurrentAdmin(null);
    navigateView('public');
  };

  // Sync to localStorage as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving records to localStorage', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_FIELDS, JSON.stringify(customFields));
    } catch (e) {
      console.error('Error saving custom fields to localStorage', e);
    }
  }, [customFields]);

  // Calculate next Serial ID
  const nextId = records.length > 0
    ? Math.max(...records.map((r) => r.id || 0)) + 1
    : 1;

  // Add Beneficiary Handler (with PostgreSQL sync)
  const handleAddRecord = async (recordData: Omit<BeneficiaryRecord, 'id'>) => {
    if (isDbConnected) {
      try {
        const created = await createBeneficiaryApi(recordData);
        setRecords((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
        setRecentSubmission(created);
        return;
      } catch (err: any) {
        console.error('Database insert failed, saving locally:', err);
        alert(err.message || 'ስህተት ተፈጥሯል፤ እባክዎ እንደገና ይሞክሩ');
        return;
      }
    }

    const newRecord: BeneficiaryRecord = {
      ...recordData,
      id: nextId
    };
    setRecords((prev) => [newRecord, ...prev]);
    setRecentSubmission(newRecord);
  };

  // Update Beneficiary Handler
  const handleUpdateRecord = async (updated: BeneficiaryRecord) => {
    if (isDbConnected) {
      try {
        const saved = await updateBeneficiaryApi(updated);
        setRecords((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
        return;
      } catch (err) {
        console.error('Database update failed, updating locally:', err);
      }
    }
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  // Delete Beneficiary Handler
  const onDeleteRecord = async (id: number) => {
    if (isDbConnected) {
      try {
        await deleteBeneficiaryApi(id);
      } catch (err) {
        console.error('Database delete failed, deleting locally:', err);
      }
    }
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Reset Demo Data
  const handleResetDemoData = async () => {
    if (window.confirm('ሁሉንም መረጃዎች ወደ መጀመሪያው የንፋስ ስልክ ላፍቶ ናሙና መረጃዎች መመለስ ይፈልጋሉ? (Reset all records in database?)')) {
      if (isDbConnected) {
        try {
          const res = await resetDemoDataApi();
          setRecords(res.records);
          setCustomFields(res.customFields);
          localStorage.removeItem(STORAGE_KEY_RECORDS);
          localStorage.removeItem(STORAGE_KEY_CUSTOM_FIELDS);
          return;
        } catch (err) {
          console.error('Failed to reset demo data in database:', err);
        }
      }
      setRecords(INITIAL_BENEFICIARIES);
      setCustomFields(INITIAL_CUSTOM_FIELDS);
      localStorage.removeItem(STORAGE_KEY_RECORDS);
      localStorage.removeItem(STORAGE_KEY_CUSTOM_FIELDS);
    }
  };

  // Custom Field Management
  const handleAddField = async (newField: CustomFormField) => {
    if (isDbConnected) {
      try {
        const created = await createCustomFieldApi(newField);
        setCustomFields((prev) => [...prev, created]);
        return;
      } catch (err) {
        console.error('Failed to create field in database:', err);
      }
    }
    setCustomFields((prev) => [...prev, newField]);
  };

  const handleDeleteField = async (id: string) => {
    if (isDbConnected) {
      try {
        await deleteCustomFieldApi(id);
      } catch (err) {
        console.error('Failed to delete field in database:', err);
      }
    }
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    const next = [...customFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < next.length) {
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      setCustomFields(next);

      if (isDbConnected) {
        try {
          await reorderCustomFieldsApi(next.map((f) => f.id));
        } catch (err) {
          console.error('Failed to reorder fields in database:', err);
        }
      }
    }
  };

  // If visiting /admin without active login session, render the dedicated /admin login screen
  if (currentView === 'admin' && !currentAdmin) {
    return (
      <AdminLoginPage
        onLoginSuccess={handleLoginSuccess}
        onGoHome={() => navigateView('public')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-900 selection:text-white">
      {/* Top Navigation Header */}
      <Header
        currentView={currentView}
        onViewChange={navigateView}
        totalRecordsCount={records.length}
        isDbConnected={isDbConnected}
        currentUser={currentAdmin}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'public' ? (
          <RegistrationForm
            customFields={customFields}
            onSubmit={handleAddRecord}
            nextId={nextId}
          />
        ) : (
          <AdminPortal
            records={records}
            customFields={customFields}
            onAddRecord={handleAddRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={onDeleteRecord}
            onResetDemoData={handleResetDemoData}
            onAddField={handleAddField}
            onDeleteField={handleDeleteField}
            onMoveField={handleMoveField}
            nextId={nextId}
          />
        )}
      </main>

      {/* Registration Confirmed Modal with PDF Slip Download */}
      {recentSubmission && (
        <RegistrationSuccessModal
          record={recentSubmission}
          customFields={customFields}
          onRegisterAnother={() => setRecentSubmission(null)}
          onGoToAdmin={() => {
            setRecentSubmission(null);
            navigateView('admin');
          }}
          onClose={() => setRecentSubmission(null)}
        />
      )}

      {/* Official Government Footer */}
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
                  • ህዝባዊ የመመዝገቢያ ቅጽ (Public Registration Form)
                </button>
                {currentAdmin && (
                  <button
                    type="button"
                    onClick={() => navigateView('admin')}
                    className="text-left text-blue-300 hover:text-white transition-colors cursor-pointer"
                  >
                    • የአስተዳዳሪ ማስተዳደሪያ ፖርታል (/admin Portal)
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="text-left text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
                >
                  • የናሙና ዳታዎችን መልስ (Reset Demo Data)
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
