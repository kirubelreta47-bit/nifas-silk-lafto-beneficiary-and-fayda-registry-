import React, { useMemo, useRef, useState } from 'react';
import { BeneficiaryRecord, CustomFormField } from '../types/registry';
import { ImportRowDraft, SpreadsheetImportResult } from '../utils/registryLogic';
import { downloadImportTemplate, parseSpreadsheetBuffer } from '../utils/excelImport';
import { importBeneficiariesApi } from '../services/api';
import { formatFaydaId } from '../utils/registryLogic';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X
} from 'lucide-react';

interface ImportExcelModalProps {
  customFields: CustomFormField[];
  existingRecords: BeneficiaryRecord[];
  onImported: (created: BeneficiaryRecord[]) => void;
  onClose: () => void;
}

type ImportPhase = 'choose' | 'preview' | 'importing' | 'done';

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  customFields,
  existingRecords,
  onImported,
  onClose
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<ImportPhase>('choose');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [readError, setReadError] = useState('');
  const [parsed, setParsed] = useState<SpreadsheetImportResult | null>(null);
  const [serverMessage, setServerMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [skippedNotes, setSkippedNotes] = useState<string[]>([]);

  const existingFaydaIds = useMemo(
    () => existingRecords.map((record) => record.faydaId),
    [existingRecords]
  );

  const readFile = async (file: File) => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls') && !lower.endsWith('.csv')) {
      setReadError('የ Excel ፋይል ይምረጡ (.xlsx, .xls) ወይም .csv');
      setParsed(null);
      setPhase('choose');
      return;
    }

    setReadError('');
    setServerMessage('');
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const result = await parseSpreadsheetBuffer(buffer, file.name, customFields, existingFaydaIds);
      setParsed(result);
      setPhase('preview');
    } catch (err) {
      console.error('Excel parse failed:', err);
      setReadError('ፋይሉን ማንበብ አልተቻለም። .xlsx፣ .xls ወይም .csv መሆኑን ያረጋግጡ');
      setParsed(null);
      setPhase('choose');
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    const records = parsed.rows
      .filter((row) => row.status === 'ready' && row.record)
      .map((row) => ({ ...row.record!, sourceRow: row.rowNumber }));

    if (records.length === 0 || parsed.fileError) return;

    setPhase('importing');
    setServerMessage('');
    try {
      const result = await importBeneficiariesApi(records);
      const notes = [
        ...result.skipped.map((item) => `ረድፍ ${item.row ?? '—'}: ${item.faydaId || ''} — ${item.reason}`),
        ...result.rejected.map((item) => `ረድፍ ${item.row ?? '—'}: ${item.faydaId || ''} — ${item.reason}`)
      ];
      setImportedCount(result.created.length);
      setSkippedNotes(notes);
      setPhase('done');
      if (result.created.length > 0) onImported(result.created);
    } catch (err: any) {
      setServerMessage(err.message || 'ማስገባቱ አልተሳካም');
      setPhase('preview');
    }
  };

  const previewRows = parsed?.rows.slice(0, 80) ?? [];
  const hiddenCount = (parsed?.rows.length ?? 0) - previewRows.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        <div className="bg-blue-950 text-white px-5 py-4 flex items-center justify-between border-b-2 border-yellow-500 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileSpreadsheet className="w-5 h-5 text-yellow-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                ከ Excel መዝገብ አስገባ
              </h3>
              <p className="text-[11px] text-blue-200">Import beneficiaries from Excel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-900 rounded-lg cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {phase !== 'done' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                ሙሉ ስም፣ የ16 አሃዝ ፋይዳ ቁጥር እና ስልክ ያስፈልጋሉ። የፋይዳ ዓምዱ በ Excel ውስጥ እንደ ጽሑፍ (Text) መሆን አለበት።
              </p>
              <button
                type="button"
                onClick={() => downloadImportTemplate(customFields)}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-blue-950 text-blue-950 bg-white hover:bg-blue-50 font-bold text-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                የናሙና ቅጽ (.xlsx)
              </button>
            </div>
          )}

          {phase === 'choose' || phase === 'preview' ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) void readFile(file);
              }}
              className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                isDragging ? 'border-yellow-500 bg-yellow-50' : 'border-slate-300 bg-white'
              }`}
            >
              <Upload className="w-6 h-6 mx-auto text-blue-950" />
              <p className="mt-2 text-sm font-bold text-slate-800">ፋይል ይጎትቱ ወይም ይምረጡ</p>
              <p className="text-[11px] text-slate-500 mt-1">.xlsx, .xls, .csv</p>
              {fileName && <p className="text-xs font-semibold text-blue-950 mt-2">{fileName}</p>}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-950 text-white text-xs font-bold cursor-pointer border-b-2 border-yellow-500"
              >
                ፋይል ምረጥ
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void readFile(file);
                  event.target.value = '';
                }}
              />
            </div>
          ) : null}

          {readError && (
            <p className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {readError}
            </p>
          )}

          {serverMessage && (
            <p className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {serverMessage}
            </p>
          )}

          {parsed && phase !== 'choose' && (
            <div className="space-y-3">
              {parsed.fileError && (
                <p className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {parsed.fileError}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2">
                <SummaryChip label="ዝግጁ" value={parsed.readyCount} tone="ready" />
                <SummaryChip label="የተደገመ" value={parsed.duplicateCount} tone="duplicate" />
                <SummaryChip label="ስህተት" value={parsed.invalidCount} tone="invalid" />
              </div>

              {parsed.unrecognizedHeaders.length > 0 && (
                <p className="text-[11px] text-slate-500">
                  ያልተጠቀሙ አምዶች: {parsed.unrecognizedHeaders.join('፣ ')}
                </p>
              )}

              {previewRows.length > 0 && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left font-semibold px-3 py-2">ረድፍ</th>
                        <th className="text-left font-semibold px-3 py-2">ሙሉ ስም</th>
                        <th className="text-left font-semibold px-3 py-2">ፋይዳ</th>
                        <th className="text-left font-semibold px-3 py-2">ስልክ</th>
                        <th className="text-left font-semibold px-3 py-2">ሁኔታ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row) => (
                        <PreviewRow key={`${row.rowNumber}-${row.faydaId}`} row={row} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {hiddenCount > 0 && (
                <p className="text-[11px] text-slate-500">ተጨማሪ {hiddenCount} ረድፎች በቅድመ እይታ አልታዩም። ሁሉም ዝግጁ የሆኑ ረድፎች ይገባሉ።</p>
              )}
            </div>
          )}

          {phase === 'done' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 space-y-2">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4" />
                {importedCount} ተመዝጋቢዎች ወደ መዝገብ ገብተዋል
              </p>
              {skippedNotes.length > 0 && (
                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-5">
                  {skippedNotes.slice(0, 12).map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {phase === 'done' ? 'ዝጋ' : 'ይቅር'}
          </button>
          {phase !== 'done' && (
            <button
              type="button"
              onClick={() => void handleImport()}
              disabled={phase === 'importing' || !parsed || parsed.readyCount === 0 || Boolean(parsed.fileError)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer"
            >
              {phase === 'importing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {parsed && parsed.readyCount > 0 ? `${parsed.readyCount} አስገባ` : 'አስገባ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function SummaryChip({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: 'ready' | 'duplicate' | 'invalid';
}) {
  const toneClass = tone === 'ready'
    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
    : tone === 'duplicate'
      ? 'bg-amber-50 text-amber-900 border-amber-200'
      : 'bg-red-50 text-red-800 border-red-200';

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-semibold">{label}</p>
      <p className="text-lg font-bold font-mono leading-tight">{value}</p>
    </div>
  );
}

function PreviewRow({ row }: { row: ImportRowDraft }) {
  const label = row.status === 'ready' ? 'ዝግጁ' : row.status === 'duplicate' ? 'ተደጋጋሚ' : 'ስህተት';
  const badge = row.status === 'ready'
    ? 'bg-emerald-100 text-emerald-800'
    : row.status === 'duplicate'
      ? 'bg-amber-100 text-amber-900'
      : 'bg-red-100 text-red-800';

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-3 py-2 font-mono text-slate-500">{row.rowNumber}</td>
      <td className="px-3 py-2 text-slate-900">{row.fullName || '—'}</td>
      <td className="px-3 py-2 font-mono text-slate-700">{row.faydaId ? formatFaydaId(row.faydaId) : '—'}</td>
      <td className="px-3 py-2 font-mono text-slate-700">{row.phone || '—'}</td>
      <td className="px-3 py-2">
        <span className={`inline-flex px-1.5 py-0.5 rounded font-bold ${badge}`}>{label}</span>
        {row.errors[0] && <p className="text-[11px] text-red-700 mt-1">{row.errors[0]}</p>}
        {row.warnings[0] && row.status === 'ready' && (
          <p className="text-[11px] text-amber-800 mt-1">{row.warnings[0]}</p>
        )}
      </td>
    </tr>
  );
}
