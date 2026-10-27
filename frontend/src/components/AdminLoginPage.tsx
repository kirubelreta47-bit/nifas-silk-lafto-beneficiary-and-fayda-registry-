import React, { useState } from 'react';
import { CivicEmblem } from './CivicEmblem';
import { Lock, User, Eye, EyeOff, AlertCircle, KeyRound, MapPin } from 'lucide-react';
import { loginAdminApi } from '../services/api';
import { AdminUser } from '../types/registry';

interface AdminLoginPageProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage('የተጠቃሚ ስም እና የይለፍ ቃል ያስገቡ');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await loginAdminApi(usernameOrEmail.trim(), password);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'የተጠቃሚ ስም ወይም የይለፍ ቃል ትክክል አይደለም');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,32rem)]">
      <section className="bg-blue-950 text-white px-6 py-8 sm:px-10 sm:py-12 flex flex-col justify-between border-b-4 lg:border-b-0 lg:border-r-4 border-yellow-500">
        <div className="flex items-center gap-3">
          <CivicEmblem size={44} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-yellow-400">የአዲስ አበባ ከተማ አስተዳደር</p>
            <h1 className="text-base sm:text-lg font-bold leading-snug">በንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር</h1>
          </div>
        </div>

        <div className="max-w-xl py-10">
          <p className="text-yellow-400 text-xs font-bold tracking-[0.18em] uppercase">የሰራተኞች መግቢያ</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold leading-tight">
            የተረጂዎች እና የፋይዳ ምዝገባ
          </h2>
          <p className="mt-4 text-sm text-blue-100 leading-relaxed max-w-md">
            ምዝገባውን ለመሙላት እና የመዝገብ ዝርዝሩን ለማየት በተሰጠዎት መለያ ይግቡ።
          </p>
        </div>

        <p className="flex items-start gap-2 text-xs text-blue-100">
          <MapPin className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <span>ሃይሌ ጋርመንት፣ ንፋስ ስልክ ላፍቶ፣ አዲስ አበባ</span>
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="text-xl font-bold text-blue-950">ይግቡ</h3>
            <p className="text-xs text-slate-500 mt-1">የተጠቃሚ ስም እና የይለፍ ቃል</p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800" role="alert">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label htmlFor="staff-username" className="block text-xs font-bold text-slate-700 mb-1.5">
              የተጠቃሚ ስም ወይም ኢሜይል
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="staff-username"
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="staff-password" className="block text-xs font-bold text-slate-700 mb-1.5">
              የይለፍ ቃል
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((open) => !open)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                aria-label={showPassword ? 'የይለፍ ቃሉን ደብቅ' : 'የይለፍ ቃሉን አሳይ'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-950 hover:bg-blue-900 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>በማረጋገጥ ላይ...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-yellow-400" />
                ወደ ሲስተሙ ይግቡ
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
};
