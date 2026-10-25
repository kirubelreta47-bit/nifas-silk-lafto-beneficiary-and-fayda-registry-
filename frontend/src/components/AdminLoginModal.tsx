import React, { useState } from 'react';
import { CivicEmblem } from './CivicEmblem';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, X, KeyRound, Sparkles } from 'lucide-react';
import { loginAdminApi } from '../services/api';
import { AdminUser } from '../types/registry';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage('እባክዎ የተጠቃሚ ስም እና የይለፍ ቃል ያስገቡ (Please enter username and password)');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await loginAdminApi(usernameOrEmail.trim(), password);
      onLoginSuccess(response.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል ነው (Invalid credentials)');
    } finally {
      setIsLoading(false);
    }
  };

  const autofillCredentials = (u: string, p: string) => {
    setUsernameOrEmail(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-6 pb-7 text-center relative border-b-4 border-yellow-500">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-3">
            <div className="p-2.5 bg-white/10 rounded-2xl ring-1 ring-white/20 shadow-inner">
              <CivicEmblem size={52} />
            </div>
          </div>

          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 mb-1.5">
            የተቆጣጣሪዎችና ሰራተኞች ፖርታል
          </span>

          <h3 className="text-lg font-bold text-white tracking-tight">
            የንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር
          </h3>
          <p className="text-xs text-blue-200 mt-0.5">
            የተረጂዎች ምዝገባ አስተዳዳሪ መግቢያ (Staff Authentication)
          </p>
        </div>

        {/* Body Form */}
        <div className="p-6 sm:p-7 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                የተጠቃሚ ስም ወይም ኢሜይል <span className="text-slate-400 font-normal">(Username / Email)</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="admin ወይም woreda01..."
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                የይለፍ ቃል <span className="text-slate-400 font-normal">(Password)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all font-medium text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-950 hover:bg-blue-900 active:bg-blue-950 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>በማረጋገጥ ላይ... (Verifying)</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-yellow-400" />
                  <span>ይግቡ (Sign In to Admin Portal)</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Card for Easy Evaluation */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
              <span>የናሙና መግቢያዎች (Quick Demo Credentials):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => autofillCredentials('admin', 'Admin@2024')}
                className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-900 hover:bg-blue-50/50 transition-all cursor-pointer group"
              >
                <div className="font-bold text-blue-950 group-hover:text-blue-900">👑 ዋና አስተዳዳሪ (Super Admin)</div>
                <div className="text-slate-500 font-mono text-[10px] mt-0.5">admin / Admin@2024</div>
              </button>

              <button
                type="button"
                onClick={() => autofillCredentials('woreda01', 'Woreda@2024')}
                className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-900 hover:bg-blue-50/50 transition-all cursor-pointer group"
              >
                <div className="font-bold text-blue-950 group-hover:text-blue-900">🏢 ወረዳ 01 መዝጋቢ (Officer)</div>
                <div className="text-slate-500 font-mono text-[10px] mt-0.5">woreda01 / Woreda@2024</div>
              </button>
            </div>
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ይህ ፖርታል በይለፍ ቃል የተጠበቀ የሲቪክ መረጃ አስተዳደር ነው</span>
          </div>
        </div>
      </div>
    </div>
  );
};
