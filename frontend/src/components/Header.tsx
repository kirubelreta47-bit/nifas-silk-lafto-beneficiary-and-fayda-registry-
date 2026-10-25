import React from 'react';
import { CivicEmblem } from './CivicEmblem';
import { ClipboardList, ShieldCheck, Building2, LogOut, UserCheck } from 'lucide-react';
import { AdminUser } from '../types/registry';

interface HeaderProps {
  currentView: 'public' | 'admin';
  onViewChange: (view: 'public' | 'admin') => void;
  totalRecordsCount: number;
  currentUser: AdminUser | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  currentUser,
  onLogout
}) => {
  return (
    <header className="bg-blue-950 text-white border-b-2 sm:border-b-4 border-yellow-500 shadow-md no-print sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-3 gap-2">
          {/* Official Seal and Sub-City Title */}
          <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0">
            <CivicEmblem size={32} className="shrink-0 drop-shadow-sm sm:hidden" />
            <CivicEmblem size={46} className="shrink-0 drop-shadow-sm hidden sm:block" />
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] sm:text-xs uppercase tracking-wider font-semibold text-yellow-400 bg-blue-900/80 px-1.5 sm:px-2 py-0.2 rounded border border-yellow-500/30 whitespace-nowrap">
                  የአዲስ አበባ ከተማ አስተዳደር
                </span>
                <span className="text-xs text-blue-200 hidden md:inline">
                  Addis Ababa City Administration
                </span>
              </div>
              <h1 className="text-xs sm:text-base md:text-lg font-bold tracking-tight text-white flex items-baseline gap-1 mt-0.5 truncate">
                <span className="truncate">በንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር</span>
                <span className="text-blue-300 font-normal text-xs sm:text-sm hidden lg:inline">|</span>
                <span className="text-blue-200 font-medium text-xs sm:text-sm hidden lg:inline">Nifas Silk-Lafto Sub-City</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-yellow-300/90 font-medium hidden sm:flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span className="truncate">የተረጂዎች እና የፋይዳ ምዝገባ ሲስተም (Beneficiary & Fayda Registry)</span>
              </p>
            </div>
          </div>

          {/* Navigation & Auth Section */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {currentUser ? (
              /* Authenticated Staff View Controls on /admin */
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Admin User Badge */}
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-900/90 border border-blue-700 text-xs text-blue-100">
                  <UserCheck className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="font-semibold text-white truncate max-w-[120px]">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-yellow-300 bg-blue-950 px-1 py-0.2 rounded">
                    {currentUser.role === 'super_admin' ? 'ዋና' : currentUser.woreda || 'መዝጋቢ'}
                  </span>
                </div>

                {currentView === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => onViewChange('public')}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-blue-200 hover:text-white transition-all cursor-pointer border border-blue-700/60"
                    title="View public registration intake form"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="hidden sm:inline">ህዝባዊ ቅጽ</span>
                    <span className="sm:hidden text-[10px]">ቅጽ</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onViewChange('admin')}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-blue-950 transition-all cursor-pointer shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">አስተዳዳሪ (/admin)</span>
                    <span className="sm:hidden text-[10px]">አስተዳዳሪ</span>
                  </button>
                )}

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-900/70 hover:bg-rose-800 text-rose-200 hover:text-white border border-rose-700/60 transition-all cursor-pointer flex items-center gap-1"
                  title="Sign out of Admin Portal"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ውጣ</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onViewChange('admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-blue-950 transition-all cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>የአስተዳዳሪ መግቢያ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
