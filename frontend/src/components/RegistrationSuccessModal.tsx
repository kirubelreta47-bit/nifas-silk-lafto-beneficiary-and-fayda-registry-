import React, { useState } from 'react';
import { BeneficiaryRecord, CustomFormField } from '../types/registry';
import { OfficialSlipPrintView } from './OfficialSlipPrintView';
import { formatFaydaId } from '../utils/registryLogic';
import {
  CheckCircle2,
  Printer,
  UserPlus,
  ShieldCheck,
  FileSpreadsheet,
  X,
  CreditCard
} from 'lucide-react';

interface RegistrationSuccessModalProps {
  record: BeneficiaryRecord;
  customFields: CustomFormField[];
  onRegisterAnother: () => void;
  onGoToAdmin: () => void;
  onClose: () => void;
}

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  record,
  customFields,
  onRegisterAnother,
  onGoToAdmin,
  onClose
}) => {
  const [showSlipPreview, setShowSlipPreview] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      {showSlipPreview ? (
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-2 sm:my-8 max-h-[95vh] overflow-y-auto">
          <OfficialSlipPrintView
            record={record}
            customFields={customFields}
            onClose={() => setShowSlipPreview(false)}
            isStandaloneModal={true}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border-t-8 border-yellow-500 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 text-center border-b border-slate-100 bg-slate-50/50">
            <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-300">
              ምዝገባው ተረጋግጧል • Registration Confirmed
            </span>
            <h3 className="text-xl font-extrabold text-blue-950 mt-3">
              {record.fullName}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              በንፋስ ስልክ ላፍቶ ክፍለ ከተማ የተረጂዎች ሲስተም ውስጥ በተሳካ ሁኔታ ተመዝግቧል።
            </p>
          </div>

          {/* Quick Summary Box */}
          <div className="p-6 space-y-4">
            <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-blue-100">
                <span className="text-slate-600 font-medium">የተመዝጋቢ ተ.ቁ (Serial No):</span>
                <span className="font-mono font-bold text-blue-950 text-sm">#{record.id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-blue-100">
                <span className="text-slate-600 font-medium flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-900" />
                  የፋይዳ መታወቂያ (Fayda ID):
                </span>
                <span className="font-mono font-bold text-blue-950">
                  {formatFaydaId(record.faydaId)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-blue-100">
                <span className="text-slate-600 font-medium">ወረዳ እና ቀጠና:</span>
                <span className="font-semibold text-slate-900">{record.woreda} • {record.blockZone}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-blue-100">
                <span className="text-slate-600 font-medium">የድጋፍ ምድብ (Category):</span>
                <span className="font-bold text-blue-900 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300">
                  {record.category}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 font-medium">ጠቅላላ የቤተሰብ ብዛት:</span>
                <span className="font-bold text-slate-900">{record.familyTotal} አባላት</span>
              </div>
            </div>

            {/* Primary Action: Download/Print Official PDF Slip */}
            <button
              type="button"
              onClick={() => setShowSlipPreview(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer border-b-2 border-yellow-500"
            >
              <Printer className="w-5 h-5 text-yellow-400" />
              <span>ኦፊሴላዊ የምዝገባ ወረቀት አውርድ / አትም (Official PDF Slip)</span>
            </button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onRegisterAnother}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-slate-500" />
                <span>ሌላ ሰው መዝግብ</span>
              </button>

              <button
                type="button"
                onClick={onGoToAdmin}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-blue-950 text-xs font-bold shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-blue-950" />
                <span>ወደ አስተዳዳሪ ገጽ</span>
              </button>
            </div>
          </div>

          {/* Close button */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-right">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              ዝጋ (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
