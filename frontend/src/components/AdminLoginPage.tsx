import React, { useState } from 'react';
import { CivicEmblem } from './CivicEmblem';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, KeyRound, Sparkles, ArrowLeft } from 'lucide-react';
import { loginAdminApi } from '../services/api';
import { AdminUser } from '../types/registry';

interface AdminLoginPageProps {
  onLoginSuccess: (user: AdminUser) => void;
  onGoHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onGoHome
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    <div className="min-h-screen flex flex-col justify-between bg-slate-900 text-slate-100 selection:bg-yellow-500 selection:text-blue-950">
      {/* Top Bar with Back to Home button */}
      <div className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>ወደ ህዝባዊ ቅጽ ተመለስ (Public Portal)</span>
        </button>

        <div className="text-right text-[11px] text-slate-400 font-mono hidden sm:block">
          ROUTE: <span className="text-yellow-400">/admin</span>
        </div>
      </div>

      {/* Main Centered Login Box */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Ribbon */}
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-7 text-center border-b-4 border-yellow-500">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-white/10 rounded-2xl ring-1 ring-white/20 shadow-inner">
                <CivicEmblem size={56} />
              </div>
            </div>

            <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 mb-2">
              የተቆጣጣሪዎችና ሰራተኞች ፖርታል
            </span>

            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              የንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              የተረጂዎች ምዝገባ አስተዳዳሪ መግቢያ (/admin Authentication)
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8 space-y-5">
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
                    <span>ይግቡ (Sign In to /admin)</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                <span>የናሙና መግቢያዎች (Quick Demo Credentials):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => autofillCredentials('admin', '123321123')}
                  className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-900 hover:bg-blue-50/50 transition-all cursor-pointer group"
                >
                  <div className="font-bold text-blue-950 group-hover:text-blue-900">👑 ዋና አስተዳዳሪ (Super Admin)</div>
                  <div className="text-slate-500 font-mono text-[10px] mt-0.5">admin / 123321123</div>
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
              <span>የተፈቀደላቸው የክፍለ ከተማውና የወረዳ ሰራተኞች ብቻ የሚገቡበት</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="p-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} በንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር | Nifas Silk-Lafto Sub-City
      </div>
    </div>
  );
};
