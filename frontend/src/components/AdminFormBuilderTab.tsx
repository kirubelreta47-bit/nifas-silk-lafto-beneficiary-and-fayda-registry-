import React, { useState } from 'react';
import { CustomFormField } from '../types/registry';
import {
  Sparkles,
  PlusCircle,
  Trash2,
  MoveUp,
  MoveDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  FileText,
  Printer
} from 'lucide-react';

interface AdminFormBuilderTabProps {
  customFields: CustomFormField[];
  onAddField: (field: CustomFormField) => void;
  onDeleteField: (id: string) => void;
  onMoveField: (index: number, direction: 'up' | 'down') => void;
  onExportPdf: () => void;
}

export const AdminFormBuilderTab: React.FC<AdminFormBuilderTabProps> = ({
  customFields,
  onAddField,
  onDeleteField,
  onMoveField,
  onExportPdf
}) => {
  const [labelAm, setLabelAm] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'select' | 'checkbox'>('text');
  const [optionsStr, setOptionsStr] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!labelAm.trim()) {
      setError('የፊልዱን ስም በአማርኛ ያስገቡ (Amharic label required)');
      return;
    }

    if (!labelEn.trim()) {
      setError('የፊልዱን ስም በእንግሊዝኛ ያስገቡ (English label required)');
      return;
    }

    let parsedOptions: string[] | undefined = undefined;
    if (fieldType === 'select') {
      const split = optionsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (split.length < 2) {
        setError('ለተቆልቋይ ዝርዝር (Select) ቢያንስ 2 አማራጮችን በነጠላ ሰረዝ ለይተው ያስገቡ');
        return;
      }
      parsedOptions = split;
    }

    // Generate unique ID
    const fieldId = `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    onAddField({
      id: fieldId,
      labelAm: labelAm.trim(),
      labelEn: labelEn.trim(),
      type: fieldType,
      options: parsedOptions,
      required: isRequired,
      defaultValue: fieldType === 'checkbox' ? false : ''
    });

    setLabelAm('');
    setLabelEn('');
    setFieldType('text');
    setOptionsStr('');
    setIsRequired(false);
    setSuccessMsg('አዲስ ፊልድ በተሳካ ሁኔታ ተፈጥሯል! አሁን በመመዝገቢያ ቅጽ እና በሰንጠረዥ ላይ ይታያል።');

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  return (
    <div className="space-y-8">
      {/* Introduction Card with Download Button directly on the selected Form Builder section */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 rounded-xl p-5 sm:p-6 text-white border-b-2 border-yellow-500 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-yellow-500 text-blue-950 rounded-xl shadow-md shrink-0">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-bold">
                ተለዋዋጭ የቅጽ ማስተካከያ (Dynamic Form Builder)
              </h3>
              <span className="text-xs bg-yellow-400 text-blue-950 font-bold px-2 py-0.5 rounded-full font-mono">
                {customFields.length} ተጨማሪ ፊልዶች
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
              ኮድ ሳይጻፍ አዳዲስ የመረጃ ፊልዶችን ወደ ህዝባዊ የመመዝገቢያ ቅጹ ማከል ይችላሉ። እዚህ የሚጨመሩ ፊልዶች በቅጹ እና በሰንጠረዡ ውስጥ አዲስ አምድ (Column) ሆነው ይካተታሉ።
            </p>
          </div>
        </div>

        {/* Download Button directly on this selected section */}
        <button
          type="button"
          onClick={onExportPdf}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shadow-xs transition-all cursor-pointer border border-yellow-400/40 shrink-0 self-start md:self-auto"
          title="የቅጽ መዋቅር እና ዝርዝር በ PDF አውርድ ወይም አትም"
        >
          <FileText className="w-4 h-4 text-yellow-300" />
          <span>የቅጽ መዋቅር PDF አውርድ / አትም</span>
          <Printer className="w-3.5 h-3.5 text-yellow-300/80" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form to Add New Field */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-slate-200 p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
            <PlusCircle className="w-5 h-5 text-blue-950" />
            <h4 className="text-sm font-bold text-blue-950">
              አዲስ ፊልድ ፍጠር (Add New Field)
            </h4>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateField} className="space-y-4 text-xs">
            {/* Amharic Label */}
            <div>
              <label className="block font-bold text-slate-800 uppercase mb-1">
                የፊልዱ ስም በአማርኛ (Label in Amharic) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={labelAm}
                onChange={(e) => setLabelAm(e.target.value)}
                placeholder="ለምሳሌ: የቤተሰብ ወርሃዊ ገቢ ወይም የድጋፍ አይነት"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* English Label */}
            <div>
              <label className="block font-bold text-slate-800 uppercase mb-1">
                የፊልዱ ስም በእንግሊዝኛ (Label in English) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
                placeholder="e.g., Monthly Household Income"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* Field Type */}
            <div>
              <label className="block font-bold text-slate-800 uppercase mb-1">
                የፊልዱ አይነት (Field Type) <span className="text-red-600">*</span>
              </label>
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-900"
              >
                <option value="text">የጽሁፍ መስክ (Text Input)</option>
                <option value="number">የቁጥር መስክ (Number Input)</option>
                <option value="select">ተቆልቋይ ዝርዝር (Dropdown Select)</option>
                <option value="checkbox">ምርጫ ሳጥን (Checkbox / Boolean)</option>
              </select>
            </div>

            {/* Options (Only if type is select) */}
            {fieldType === 'select' && (
              <div>
                <label className="block font-bold text-slate-800 uppercase mb-1">
                  የተቆልቋይ አማራጮች (በነጠላ ሰረዝ ለይተው ያስገቡ) <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={optionsStr}
                  onChange={(e) => setOptionsStr(e.target.value)}
                  placeholder="አማራጭ 1, አማራጭ 2, አማራጭ 3"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-900"
                />
                <span className="text-[11px] text-slate-500">ምሳሌ: ዝቅተኛ, መካከለኛ, ከፍተኛ</span>
              </div>
            )}

            {/* Required Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                />
                <span className="text-xs font-semibold text-slate-800">
                  ማስገባት ግዴታ ይሁን (Required Field)?
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs shadow-sm cursor-pointer border-b-2 border-yellow-500"
            >
              <PlusCircle className="w-4 h-4 text-yellow-400" />
              <span>ፊልዱን ጨምር (Add Custom Field)</span>
            </button>
          </form>
        </div>

        {/* Existing Custom Fields List */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-slate-200 p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <h4 className="text-sm font-bold text-blue-950">
                የተፈጠሩ ተጨማሪ ፊልዶች (Active Custom Fields)
              </h4>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {customFields.length} ፊልዶች
            </span>
          </div>

          {customFields.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ምንም ተጨማሪ ፊልድ አልተጨመረም። በግራ በኩል ባለው ቅጽ በመጠቀም አዲስ ፊልድ መፍጠር ይችላሉ።
            </div>
          ) : (
            <div className="space-y-3">
              {customFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {field.labelAm}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({field.labelEn})
                      </span>
                      {field.required && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded border border-red-200">
                          ግዴታ (Required)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-medium text-[11px]">
                        አይነት: {field.type}
                      </span>
                      {field.options && (
                        <span className="text-slate-500 text-[11px] truncate max-w-xs">
                          አማራጮች: {field.options.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reorder and Delete controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onMoveField(idx, 'up')}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="ወደ ላይ ውሰድ (Move Up)"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === customFields.length - 1}
                      onClick={() => onMoveField(idx, 'down')}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="ወደ ታች ውሰድ (Move Down)"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteField(field.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded ml-1 cursor-pointer"
                      title="ፊልዱን ሰርዝ (Delete Field)"
                      aria-label={`Delete ${field.labelAm}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
