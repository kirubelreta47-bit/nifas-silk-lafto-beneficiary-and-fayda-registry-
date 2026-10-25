import React from 'react';
import { BeneficiaryRecord } from '../types/registry';
import { formatFaydaId } from '../utils/registryLogic';
import { CheckCircle2, UserPlus, X, CreditCard } from 'lucide-react';

interface RegistrationSuccessModalProps {
  record: BeneficiaryRecord;
  onRegisterAnother: () => void;
  onClose: () => void;
}

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  record,
  onRegisterAnother,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-t-8 border-green-600 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-100 bg-slate-50/60">
          <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner ring-4 ring-green-50">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-800 bg-green-100 px-3.5 py-1 rounded-full border border-green-300">
            ተመዝግቧል • Registered
          </span>
          <h3 className="text-xl font-extrabold text-blue-950 mt-3">
            {record.fullName}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            በንፋስ ስልክ ላፍቶ ክፍለ ከተማ የተረጂዎች ሲስተም ውስጥ በተሳካ ሁኔታ ተመዝግቧል።
          </p>
        </div>

        {/* Quick Summary Info */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-900" />
                የፋይዳ ቁጥር (Fayda ID):
              </span>
              <span className="font-mono font-bold text-blue-950">
                {formatFaydaId(record.faydaId)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
              <span className="text-slate-600 font-medium">ወረዳ እና ቀጠና:</span>
              <span className="font-semibold text-slate-900">{record.woreda} • {record.blockZone}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600 font-medium">የድጋፍ ምድብ (Category):</span>
              <span className="font-bold text-blue-900 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300 text-[11px]">
                {record.category}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onRegisterAnother}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-yellow-400" />
              <span>አዲስ ምዝገባ ጨምር (Add New Registration)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              <span>ጨርስ (Done)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
