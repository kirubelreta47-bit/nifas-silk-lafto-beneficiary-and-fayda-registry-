import React, { useState } from 'react';
import { BeneficiaryRecord, CustomFormField } from '../types/registry';
import { CivicEmblem } from './CivicEmblem';
import { formatFaydaId } from '../utils/registryLogic';
import {
  Printer,
  X,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Share2,
  FileText,
  Smartphone,
  Phone,
  MapPin,
  Users,
  Heart,
  Calendar,
  CreditCard,
  QrCode
} from 'lucide-react';

interface OfficialSlipPrintViewProps {
  record: BeneficiaryRecord;
  customFields?: CustomFormField[];
  onClose?: () => void;
  isStandaloneModal?: boolean;
}

export const OfficialSlipPrintView: React.FC<OfficialSlipPrintViewProps> = ({
  record,
  customFields = [],
  onClose,
  isStandaloneModal = false
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'card' | 'document'>('card');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSealVerified, setIsSealVerified] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const currentDate = record.registrationDate || new Date().toISOString().split('T')[0];
  const refNumber = `NSL-REG-2024-${String(record.id).padStart(5, '0')}`;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShare = () => {
    const summaryText = `የተረጂ ኦፊሴላዊ ምዝገባ መረጃ:
ስም: ${record.fullName}
የፋይዳ ቁጥር: ${formatFaydaId(record.faydaId)}
ማጣቀሻ ቁጥር: ${refNumber}
ወረዳ: ${record.woreda} | ቀጠና: ${record.blockZone}
ምድብ: ${record.category}
የቤተሰብ ብዛት: ${record.familyTotal}
በንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር`;

    if (navigator.share) {
      navigator.share({
        title: `ምዝገባ ማረጋገጫ - ${record.fullName}`,
        text: summaryText
      }).catch(() => {});
    } else {
      handleCopy(summaryText, 'summary');
    }
  };

  return (
    <div className={isStandaloneModal ? 'p-2 sm:p-5 max-w-5xl mx-auto' : ''}>
      {/* ===================== INTERACTIVE TOP ACTION BAR (Hidden in Print) ===================== */}
      <div className="no-print bg-slate-900 text-white rounded-2xl p-3 sm:p-4 mb-4 shadow-lg border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Title & Badge */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>ኦፊሴላዊ የምዝገባ ደብዳቤ / ወረቀት</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  የተረጋገጠ (Verified)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Official Registration Confirmation & Verification Slip
              </p>
            </div>
          </div>

          {/* Close button if modal */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-auto"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Interactive Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          {/* Mode Switcher: Mobile Card vs Official Paper Sheet */}
          <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>ተንቀሳቃሽ እይታ (Mobile View)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('document')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'document'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>የወረቀት እይታ (Paper Sheet)</span>
            </button>
          </div>

          {/* Action Buttons: Zoom, Share, Print */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Zoom Controls (Active in Document View) */}
            {viewMode === 'document' && (
              <div className="hidden sm:flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1.5 text-slate-200">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                  className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="p-1 text-[10px] text-yellow-400 hover:text-yellow-300 font-bold px-1.5 cursor-pointer"
                  title="Reset Zoom"
                >
                  100%
                </button>
              </div>
            )}

            {/* Quick Share / Copy Summary */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="Share or copy text summary"
            >
              {copiedField === 'summary' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">ተገልብጧል!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>አጋራ (Share)</span>
                </>
              )}
            </button>

            {/* Print / Save PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-500 text-blue-950 font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-950" />
              <span>አትም / PDF አስቀምጥ</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== VIEW 1: INTERACTIVE MOBILE CARD VIEW (Screen View) ===================== */}
      {viewMode === 'card' && (
        <div className="no-print space-y-4 animate-in fade-in duration-200">
          {/* Main Beneficiary Header Card */}
          <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            {/* Background Decorative Watermark */}
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <CivicEmblem size={200} />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-2xl ring-1 ring-white/20 shadow-inner">
                    <CivicEmblem size={44} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider">
                      የአዲስ አበባ ከተማ • ንፋስ ስልክ ላፍቶ
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                      {record.fullName}
                    </h2>
                    <p className="text-xs text-blue-200 font-medium">
                      {record.gender === 'ወ' ? 'ወንድ' : 'ሴት'} • {record.age} ዓመት
                    </p>
                  </div>
                </div>

                <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500 text-blue-950 shadow-sm">
                  {record.category}
                </span>
              </div>

              {/* Fayda ID High-Contrast Interactive Chip */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-yellow-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-blue-200 uppercase font-semibold">የፋይዳ ብሔራዊ መታወቂያ (Fayda ID)</div>
                    <div className="text-base sm:text-lg font-mono font-extrabold tracking-wider text-yellow-300">
                      {formatFaydaId(record.faydaId)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(record.faydaId, 'fayda')}
                  className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Copy 16-digit Fayda ID"
                >
                  {copiedField === 'fayda' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="text-emerald-300 text-[11px]">ተገልብጧል</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">ገልብጥ</span>
                    </>
                  )}
                </button>
              </div>

              {/* Reference & Date Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 pt-1 border-t border-white/10 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">ማጣቀሻ:</span>
                  <strong className="text-white">{refNumber}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{currentDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Information Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: አድራሻ እና መገኛ */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950 uppercase border-b border-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-yellow-600" />
                <span>የመኖሪያ አድራሻ (Location Details)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">ወረዳ (Woreda):</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{record.woreda}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">ብሎክ / ቀጠና (Block/Zone):</span>
                  <span className="font-semibold text-slate-900">{record.blockZone}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">ልዩ መጠሪያ (Locality):</span>
                  <span className="font-semibold text-slate-900">{record.locality || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">የቤት ቁጥር / ሁኔታ:</span>
                  <span className="font-semibold text-slate-900">{record.houseNo || 'ተከራይ'}</span>
                </div>
              </div>
            </div>

            {/* Card 2: ቤተሰብ እና ስልክ */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950 uppercase border-b border-slate-100 pb-2">
                <Users className="w-4 h-4 text-blue-700" />
                <span>የቤተሰብ እና የጤና መረጃ</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">ጠቅላላ የቤተሰብ ብዛት:</span>
                  <span className="font-bold text-blue-950 text-sm bg-yellow-100 px-2.5 py-0.5 rounded-lg border border-yellow-300">
                    {record.familyTotal} አባላት
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 text-[11px] text-slate-600">
                  <span>ስብጥር: ወንድ: <strong>{record.familyMale}</strong></span>
                  <span>ሴት: <strong>{record.familyFemale}</strong></span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    የጤና ሁኔታ:
                  </span>
                  <span className="font-semibold text-slate-900">{record.healthStatus}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    ስልክ ቁጥር:
                  </span>
                  <a
                    href={`tel:${record.phone}`}
                    className="font-mono font-bold text-blue-700 hover:underline"
                  >
                    {record.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Dynamic Custom Fields (if present) */}
          {customFields.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs font-bold text-slate-800 uppercase border-b border-slate-100 pb-2">
                ተጨማሪ የድጋፍ መረጃዎች (Additional Details)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {customFields.map((cf) => (
                  <div key={cf.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-500 block text-[11px]">{cf.labelAm} ({cf.labelEn}):</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {record.customFields?.[cf.id] !== undefined ? String(record.customFields[cf.id]) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Official Digital Seal Card */}
          <div
            onClick={() => setIsSealVerified(!isSealVerified)}
            className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-emerald-50 transition-colors"
            title="Click to toggle security verification badge"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <span>በንፋስ ስልክ ላፍቶ ዲጂታል ሲስተም የተረጋገጠ</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  ይህ ሰነድ ኦፊሴላዊ የፋይዳ ብሔራዊ መታወቂያ የተረጋገጠለት ሲቪክ ማረጋገጫ ወረቀት ነው።
                </p>
                <div className="text-[10px] font-mono text-emerald-700 mt-1">
                  SEC-HASH: {record.faydaId.slice(0, 4)}-{record.faydaId.slice(12, 16)}-{record.id}
                </div>
              </div>
            </div>

            <div className="hidden sm:block text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900 border border-emerald-400">
                ✓ ትክክለኛ ሰነድ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: AUTHENTIC PRINTABLE A4 GOVERNMENT DOCUMENT ===================== */}
      <div
        className={`${
          viewMode === 'card' ? 'hidden print:block' : 'block'
        } bg-white text-slate-900 transition-transform origin-top`}
        style={viewMode === 'document' ? { transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' } : {}}
      >
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 sm:p-8 text-slate-900 shadow-md print:shadow-none print:border-2 print:border-black print:p-6 print:m-0 print:rounded-none">
          {/* Document Header with Emblems & Reference */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <CivicEmblem size={56} className="shrink-0" />
              <div className="text-center flex-1 px-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-tight">
                  የኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ • የአዲስ አበባ ከተማ አስተዳደር
                </h3>
                <h1 className="text-base sm:text-xl font-extrabold text-blue-950 mt-0.5 uppercase tracking-wide">
                  በንፋስ ስልክ ላፍቶ ክፍለ ከተማ አስተዳደር
                </h1>
                <h2 className="text-xs sm:text-sm font-semibold text-slate-800">
                  የህብረተሰብ ተሳትፎና በጎ አድራጎት ማስተባበሪያ ጽህፈት ቤት
                </h2>
                <p className="text-[11px] text-slate-500 italic mt-0.5">
                  Nifas Silk-Lafto Sub-City Beneficiary & National Fayda ID Registry
                </p>
              </div>

              {/* Barcode & Reference Card */}
              <div className="text-center sm:text-right border border-slate-300 p-2.5 rounded-xl bg-slate-50 text-[11px] font-mono leading-tight shrink-0 shadow-xs">
                <span className="block text-[10px] uppercase font-bold text-blue-950">ማጣቀሻ ቁጥር (Ref No):</span>
                <span className="text-slate-950 font-extrabold text-xs">{refNumber}</span>
                <span className="block text-[10px] text-slate-500 mt-1">ቀን: {currentDate}</span>
              </div>
            </div>

            {/* Official Ribbon Title */}
            <div className="mt-4 text-center bg-blue-950 text-white py-2 px-4 rounded-xl border-b-2 border-yellow-500 print:bg-slate-900">
              <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
                የተረጂዎች ምዝገባ እና የፋይዳ ብሔራዊ መታወቂያ ኦፊሴላዊ ማረጋገጫ ሰነድ
              </h2>
            </div>
          </div>

          {/* High-Definition Official Civic Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-slate-400">
              <tbody>
                {/* Row 1: ተ.ቁ እና ሙሉ ስም */}
                <tr className="border-b border-slate-300">
                  <td className="w-1/4 p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ተ.ቁ (Serial No)
                  </td>
                  <td className="w-1/4 p-2.5 font-mono font-bold text-blue-950 border-r border-slate-300">
                    #{record.id}
                  </td>
                  <td className="w-1/4 p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ሙሉ ስም ከነአያት (Full Name)
                  </td>
                  <td className="w-1/4 p-2.5 font-bold text-slate-950 text-sm">
                    {record.fullName}
                  </td>
                </tr>

                {/* Row 2: ፋይዳ መታወቂያ እና ጾታ/እድሜ */}
                <tr className="border-b border-slate-300 bg-yellow-50/40 print:bg-transparent">
                  <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    የፋይዳ መታወቂያ (Fayda ID)
                  </td>
                  <td className="p-2.5 font-mono font-bold text-sm text-blue-950 border-r border-slate-300">
                    {formatFaydaId(record.faydaId)}
                  </td>
                  <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ጾታ እና እድሜ (Gender & Age)
                  </td>
                  <td className="p-2.5 text-slate-900">
                    {record.gender === 'ወ' ? 'ወንድ (ወ)' : 'ሴት (ሴ)'} • {record.age} ዓመት
                  </td>
                </tr>

                {/* Row 3: አድራሻ (ክፍለ ከተማ እና ወረዳ) */}
                <tr className="border-b border-slate-300">
                  <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ክፍለ ከተማ (Sub-City)
                  </td>
                  <td className="p-2.5 text-slate-900 border-r border-slate-300">
                    {record.subCity}
                  </td>
                  <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ወረዳ (Woreda)
                  </td>
                  <td className="p-2.5 font-semibold text-slate-900">
                    {record.woreda}
                  </td>
                </tr>

                {/* Row 4: ቀጠና እና ልዩ መጠሪያ */}
                <tr className="border-b border-slate-300">
                  <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ብሎክ / ቀጠና (Block/Zone)
                  </td>
                  <td className="p-2.5 text-slate-900 border-r border-slate-300">
                    {record.blockZone}
                  </td>
                  <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ልዩ መጠሪያ (Locality)
                  </td>
                  <td className="p-2.5 text-slate-900">
                    {record.locality || '—'}
                  </td>
                </tr>

                {/* Row 5: የቤት ቁጥር እና ስልክ */}
                <tr className="border-b border-slate-300">
                  <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    የቤት ቁጥር / ሁኔታ (House No)
                  </td>
                  <td className="p-2.5 text-slate-900 border-r border-slate-300">
                    {record.houseNo || 'ተከራይ'}
                  </td>
                  <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ስልክ ቁጥር (Phone Number)
                  </td>
                  <td className="p-2.5 font-mono text-slate-900">
                    {record.phone}
                  </td>
                </tr>

                {/* Row 6: የጤና ሁኔታ እና የምዝገባ ምድብ */}
                <tr className="border-b border-slate-300">
                  <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    የጤና ሁኔታ (Health Status)
                  </td>
                  <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-300">
                    {record.healthStatus}
                  </td>
                  <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    የምዝገባ ምድብ (Category Sheet)
                  </td>
                  <td className="p-2.5 font-bold text-blue-950">
                    {record.category}
                  </td>
                </tr>

                {/* Row 7: የቤተሰብ ብዛት ማጠቃለያ */}
                <tr className="border-b border-slate-300 bg-slate-50">
                  <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    የቤተሰብ ብዛት (Family Counts)
                  </td>
                  <td colSpan={3} className="p-2.5 text-slate-900">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <span>ወንድ (Male): <strong>{record.familyMale}</strong></span>
                      <span>ሴት (Female): <strong>{record.familyFemale}</strong></span>
                      <span className="font-bold text-blue-950 bg-yellow-100 px-2.5 py-0.5 rounded border border-yellow-300">
                        ጠቅላላ ድምር: {record.familyTotal} አባላት
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Custom dynamic fields if present */}
                {customFields.length > 0 && customFields.map((cf) => (
                  <tr key={cf.id} className="border-b border-slate-300">
                    <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                      {cf.labelAm} ({cf.labelEn})
                    </td>
                    <td colSpan={3} className="p-2.5 text-slate-900">
                      {record.customFields?.[cf.id] !== undefined
                        ? String(record.customFields[cf.id])
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Verification Notice */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-300 rounded-xl text-[11px] text-slate-600 leading-relaxed">
            <strong className="text-slate-900">ኦፊሴላዊ ማረጋገጫ: </strong>
            ይህ ሰነድ በንፋስ ስልክ ላፍቶ ክፍለ ከተማ የተረጂዎችና የፋይዳ ብሔራዊ መታወቂያ ምዝገባ ሲስተም ውስጥ በይፋ የተመዘገበ እና የተረጋገጠ መረጃ መሆኑን ያረጋግጣል።
          </div>

          {/* Signatures & Official Stamp Grid */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-slate-800">
            <div className="space-y-6">
              <p className="font-bold">የመዝጋቢው ፊርማ (Registrar)</p>
              <div className="border-b border-slate-900 w-3/4 mx-auto"></div>
              <p className="text-[10px] text-slate-500">ስምና ፊርማ</p>
            </div>

            <div className="space-y-6">
              <p className="font-bold">የወረዳው አስተባባሪ (Woreda Officer)</p>
              <div className="border-b border-slate-900 w-3/4 mx-auto"></div>
              <p className="text-[10px] text-slate-500">ስምና ፊርማ</p>
            </div>

            <div className="space-y-2">
              <p className="font-bold">ክፍለ ከተማ ማህተም (Official Stamp)</p>
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto border-2 border-dashed border-slate-400 rounded-full flex items-center justify-center text-[10px] text-slate-400 font-bold p-1">
                የክፍለ ከተማው ማህተም
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
