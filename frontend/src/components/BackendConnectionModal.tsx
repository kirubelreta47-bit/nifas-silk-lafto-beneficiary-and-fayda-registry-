import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, Globe, Link2 } from 'lucide-react';
import { getApiBaseUrl, setCustomBackendUrl, checkDatabaseHealth } from '../services/api';

interface BackendConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDbConnected: boolean;
  onRefreshConnection: () => Promise<void>;
}

export const BackendConnectionModal: React.FC<BackendConnectionModalProps> = ({
  isOpen,
  onClose,
  isDbConnected,
  onRefreshConnection
}) => {
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const cleanUrl = apiUrl.trim().replace(/\/+$/, '');
    setCustomBackendUrl(cleanUrl);

    try {
      const isHealthy = await checkDatabaseHealth();
      if (isHealthy) {
        setTestResult({
          success: true,
          message: 'በተሳካ ሁኔታ ከPostgreSQL (Neon) ዳታቤዝ ጋር ተገናኝቷል! (Connected successfully!)'
        });
        await onRefreshConnection();
      } else {
        setTestResult({
          success: false,
          message: 'ሰርቨሩ ምላሽ አልሰጠም። እባክዎ የRender URL ትክክል መሆኑን እና Render መነሳቱን ያረጋግጡ። (Server unreachable. Ensure Render backend is live).'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'ግንኙነት አልተሳካም (Connection failed)'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetToDefault = async () => {
    setCustomBackendUrl('');
    setApiUrl(getApiBaseUrl());
    setIsTesting(true);
    await onRefreshConnection();
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 to-indigo-950 text-white p-5 flex items-center justify-between border-b-2 border-yellow-500">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Database className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">የዳታቤዝ እና የሰርቨር ግንኙነት (Database Connection)</h3>
              <p className="text-[11px] text-blue-200">Neon PostgreSQL & Render API Configuration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50">
            <span className="font-semibold text-slate-700">የአሁን ግንኙነት ሁኔታ (Current Status):</span>
            {isDbConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Neon PostgreSQL ተገናኝቷል
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                አልተገናኘም (Offline / Local Mode)
              </span>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-3.5">
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-900" />
                የBackend API URL (Render or Localhost):
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                በRender የተሰጠዎትን የBackend URL እዚህ ያስገቡ (ለምሳሌ: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-900 font-mono">https://nsl-fayda-backend.onrender.com/api</code>)
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://your-backend.onrender.com/api"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white shadow-xs"
                />
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isTesting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {isTesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />
                ) : (
                  <Link2 className="w-4 h-4 text-yellow-400" />
                )}
                <span>{isTesting ? 'በመሞከር ላይ...' : 'አስቀምጥና አገናኝ (Save & Connect)'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                title="Reset to default environment URL"
              >
                መልስ (Reset)
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
          >
            ዝጋ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
