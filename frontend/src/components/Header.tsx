import React from 'react';
import { CivicEmblem } from './CivicEmblem';
import { AdminUser } from '../types/registry';
import { ClipboardList, Building2, TableProperties, LogOut } from 'lucide-react';

interface HeaderProps {
  currentView: 'public' | 'admin';
  onViewChange: (view: 'public' | 'admin') => void;
  totalRecordsCount: number;
  currentAdmin: AdminUser;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  totalRecordsCount,
  currentAdmin,
  onLogout
}) => {
  const roleLabel = currentAdmin.role === 'admin' || currentAdmin.role === 'super_admin' ? 'አስተዳዳሪ' : 'መዝጋቢ';

  return (
    <header className="bg-blue-950 text-white border-b-4 border-yellow-500 shadow-md no-print sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <CivicEmblem size={36} className="shrink-0 drop-shadow-sm sm:hidden" />
          <CivicEmblem size={48} className="shrink-0 drop-shadow-sm hidden sm:block" />
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-yellow-400">
              የአዲስ አበባ ከተማ አስተዳደር
            </p>
            <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white truncate">
              በንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር
            </h1>
            <p className="text-[11px] sm:text-xs text-blue-100/90 font-medium hidden sm:flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span className="truncate">የተረጂዎች እና የፋይዳ ምዝገባ</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <nav className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-blue-900/80 border border-blue-800" aria-label="ዋና ክፍሎች">
            <button
              type="button"
              onClick={() => onViewChange('public')}
              aria-current={currentView === 'public' ? 'page' : undefined}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                currentView === 'public'
                  ? 'bg-yellow-400 text-blue-950'
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>ምዝገባ</span>
            </button>
            <button
              type="button"
              onClick={() => onViewChange('admin')}
              aria-current={currentView === 'admin' ? 'page' : undefined}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-yellow-400 text-blue-950'
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <TableProperties className="w-4 h-4" />
              <span>መዝገብ</span>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                currentView === 'admin' ? 'bg-blue-950 text-yellow-300' : 'bg-blue-950/70 text-yellow-300'
              }`}>
                {totalRecordsCount.toLocaleString('en-US')}
              </span>
            </button>
          </nav>

          <div className="flex items-center justify-between sm:justify-start gap-2 px-2 py-1.5 rounded-xl bg-blue-900/50 border border-blue-800">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate max-w-[10rem]">{currentAdmin.fullName || currentAdmin.username}</p>
              <p className="text-[10px] text-yellow-300">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-950 bg-yellow-400 hover:bg-yellow-300 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              ውጣ
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
