import React, { useEffect, useMemo, useState } from 'react';
import { CustomFormField, RegistryStats } from '../types/registry';
import { fetchReportSliceApi, ReportSlice } from '../services/api';
import { BarChart3, FileText, Plus, Printer, Table2, Trash2, X } from 'lucide-react';

interface AdminReportsTabProps {
  stats: RegistryStats;
  customFields: CustomFormField[];
  onExportPdf: () => void;
}

interface ReportCardConfig {
  id: string;
  groupBy: string;
  splitBy: string;
  metric: string;
  view: 'bar' | 'table';
  top: number;
}

const STORAGE_KEY = 'nsl-report-cards-v1';

const BASE_DIMENSIONS = [
  { value: 'woreda', label: 'ወረዳ' },
  { value: 'category', label: 'የድጋፍ ምድብ' },
  { value: 'gender', label: 'ጾታ' },
  { value: 'health', label: 'የጤና ሁኔታ' },
  { value: 'age_band', label: 'የዕድሜ ክልል' },
  { value: 'block_zone', label: 'ቀጠና' },
  { value: 'locality', label: 'ሰፈር' },
  { value: 'aid_type', label: 'የእርዳታ አይነት' },
  { value: 'education', label: 'የትምህርት ደረጃ' },
  { value: 'registration_year', label: 'የምዝገባ ዓመት' }
];

const METRICS = [
  { value: 'count', label: 'የሰው ብዛት' },
  { value: 'family', label: 'የቤተሰብ ብዛት' },
  { value: 'family_male', label: 'የቤተሰብ ወንድ' },
  { value: 'family_female', label: 'የቤተሰብ ሴት' },
  { value: 'avg_age', label: 'አማካይ ዕድሜ' },
  { value: 'avg_family', label: 'አማካይ የቤተሰብ መጠን' }
];

const SERIES_COLORS = ['#172554', '#eab308', '#0f766e', '#b45309', '#334155', '#be123c'];

const DEFAULT_CARDS: ReportCardConfig[] = [
  { id: 'woreda-count', groupBy: 'woreda', splitBy: 'none', metric: 'count', view: 'bar', top: 10 },
  { id: 'category-gender', groupBy: 'category', splitBy: 'gender', metric: 'count', view: 'bar', top: 10 },
  { id: 'health-category', groupBy: 'health', splitBy: 'category', metric: 'count', view: 'table', top: 10 },
  { id: 'age-gender', groupBy: 'age_band', splitBy: 'gender', metric: 'count', view: 'bar', top: 10 }
];

function makeId(): string {
  return `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

function formatMetric(value: number, metric: string): string {
  if (metric.startsWith('avg')) return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
  return formatCount(Math.round(value));
}

function share(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function isKnownDimension(value: string, extra: { value: string }[]): boolean {
  if (BASE_DIMENSIONS.some((item) => item.value === value) || extra.some((item) => item.value === value)) return true;
  return /^field:[a-zA-Z0-9_-]{1,64}$/.test(value);
}

function loadCards(extra: { value: string }[]): ReportCardConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CARDS;
    return parsed.slice(0, 8).map((card) => {
      const groupBy = isKnownDimension(card.groupBy, extra) ? card.groupBy : 'woreda';
      let splitBy = card.splitBy === 'none' || isKnownDimension(card.splitBy, extra) ? card.splitBy : 'none';
      if (splitBy === groupBy) splitBy = 'none';
      const metric = METRICS.some((item) => item.value === card.metric) ? card.metric : 'count';
      const top = [8, 12, 20].includes(Number(card.top)) ? Number(card.top) : 10;
      return {
        id: typeof card.id === 'string' ? card.id : makeId(),
        groupBy,
        splitBy,
        metric,
        view: card.view === 'table' ? 'table' : 'bar',
        top
      };
    });
  } catch {
    return DEFAULT_CARDS;
  }
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({ stats, customFields, onExportPdf }) => {
  const dimensions = useMemo(() => {
    const extra = customFields
      .filter((field) => /^[a-zA-Z0-9_-]{1,64}$/.test(field.id) && field.id !== 'aidType' && field.id !== 'educationLevel')
      .map((field) => ({ value: `field:${field.id}`, label: field.labelAm || field.labelEn }));
    return [...BASE_DIMENSIONS, ...extra];
  }, [customFields]);

  const [cards, setCards] = useState<ReportCardConfig[]>(() => loadCards([]));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  const updateCard = (id: string, patch: Partial<ReportCardConfig>) => {
    setCards((current) => current.map((card) => {
      if (card.id !== id) return card;
      const next = { ...card, ...patch };
      if (next.groupBy === next.splitBy) next.splitBy = 'none';
      return next;
    }));
  };

  const addCard = () => {
    setCards((current) => [
      ...current,
      { id: makeId(), groupBy: 'locality', splitBy: 'category', metric: 'count', view: 'bar', top: 10 }
    ].slice(0, 8));
  };

  const workforceShare = share(stats.workforceCount, stats.totalBeneficiaries);
  const continuousShare = share(stats.continuousCount, stats.totalBeneficiaries);

  return (
    <div className="space-y-4">
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="h-1.5 bg-yellow-500" />
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-yellow-700">ንፋስ ስልክ ላፍቶ</p>
            <h2 className="text-lg sm:text-xl font-bold text-blue-950 mt-1">የመዝገብ ሪፖርት</h2>
            <p className="text-xs text-slate-500 mt-1">ሁለት መስኮችን ይምረጡ፣ ወይም አንዱን አንስተው በአንድ መስክ ብቻ ያሳዩ</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addCard}
              disabled={cards.length >= 8}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-blue-950 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              ንጽጽር ጨምር
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs cursor-pointer"
            >
              <FileText className="w-4 h-4 text-yellow-400" />
              ማጠቃለያ አትም
              <Printer className="w-3.5 h-3.5 text-yellow-400/80" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          <Metric label="ተመዝጋቢዎች" value={formatCount(stats.totalBeneficiaries)} note="በመዝገብ ላይ" />
          <Metric label="ሰሪ ሀይል" value={formatCount(stats.workforceCount)} note={`${workforceShare}%`} />
          <Metric label="በቀጣይነት የሚረዱ" value={formatCount(stats.continuousCount)} note={`${continuousShare}%`} />
          <Metric label="የቤተሰብ አባላት" value={formatCount(stats.totalFamilyMembers)} note={`አማካይ ${stats.averageFamilySize}`} />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {cards.map((card) => (
          <ReportCard
            key={card.id}
            card={card}
            dimensions={dimensions}
            canRemove={cards.length > 1}
            onChange={(patch) => updateCard(card.id, patch)}
            onRemove={() => setCards((current) => current.filter((item) => item.id !== card.id))}
          />
        ))}
      </div>
    </div>
  );
};

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="px-4 sm:px-5 py-4">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl sm:text-3xl font-bold text-blue-950 tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{note}</p>
    </div>
  );
}

function ReportCard({
  card,
  dimensions,
  canRemove,
  onChange,
  onRemove
}: {
  card: ReportCardConfig;
  dimensions: { value: string; label: string }[];
  canRemove: boolean;
  onChange: (patch: Partial<ReportCardConfig>) => void;
  onRemove: () => void;
}) {
  const [data, setData] = useState<ReportSlice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const metricLabel = METRICS.find((item) => item.value === card.metric)?.label || 'ብዛት';
  const groupLabel = dimensions.find((item) => item.value === card.groupBy)?.label || 'ምድብ';
  const splitLabel = card.splitBy === 'none'
    ? ''
    : dimensions.find((item) => item.value === card.splitBy)?.label || '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchReportSliceApi({
      groupBy: card.groupBy,
      splitBy: card.splitBy,
      metric: card.metric,
      top: card.top
    })
      .then((slice) => {
        if (!cancelled) setData(slice);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message || 'ሪፖርቱን ማምጣት አልተቻለም');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [card.groupBy, card.splitBy, card.metric, card.top]);

  const maxTotal = Math.max(...(data?.rows.map((row) => row.total) || [0]), 0);

  return (
    <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
      <div className="h-1 bg-blue-950" />
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-blue-950">
              {groupLabel}{splitLabel ? ` ከ ${splitLabel} ጋር` : ''}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{metricLabel}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onChange({ view: 'bar' })}
              aria-pressed={card.view === 'bar'}
              className={`p-1.5 rounded-lg cursor-pointer ${card.view === 'bar' ? 'bg-blue-950 text-yellow-300' : 'text-slate-500 hover:bg-slate-100'}`}
              title="ግራፍ"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange({ view: 'table' })}
              aria-pressed={card.view === 'table'}
              className={`p-1.5 rounded-lg cursor-pointer ${card.view === 'table' ? 'bg-blue-950 text-yellow-300' : 'text-slate-500 hover:bg-slate-100'}`}
              title="ሰንጠረዥ"
            >
              <Table2 className="w-4 h-4" />
            </button>
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                title="አስወግድ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Field label="መስክ 1">
            <div className="flex gap-1">
              <select
                value={card.groupBy}
                onChange={(event) => onChange({ groupBy: event.target.value })}
                className="min-w-0 flex-1 px-2.5 py-2 rounded-lg border border-blue-900 bg-white text-xs font-semibold text-slate-800"
              >
                {dimensions
                  .filter((item) => item.value !== card.splitBy)
                  .map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => onChange({ groupBy: card.splitBy, splitBy: 'none' })}
                disabled={card.splitBy === 'none'}
                className="px-2 rounded-lg border border-slate-300 text-slate-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 cursor-pointer"
                title="ይህን ምርጫ አንሳ"
                aria-label="የመጀመሪያውን መስክ አንሳ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </Field>
          <Field label="መስክ 2">
            <div className="flex gap-1">
              <select
                value={card.splitBy}
                onChange={(event) => onChange({ splitBy: event.target.value })}
                className="min-w-0 flex-1 px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
              >
                <option value="none">ምርጫ የለም</option>
                {dimensions
                  .filter((item) => item.value !== card.groupBy)
                  .map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => onChange({ splitBy: 'none' })}
                disabled={card.splitBy === 'none'}
                className="px-2 rounded-lg border border-slate-300 text-slate-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 cursor-pointer"
                title="ይህን ምርጫ አንሳ"
                aria-label="ሁለተኛውን መስክ አንሳ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </Field>
          <Field label="የሚቆጠረው">
            <select
              value={card.metric}
              onChange={(event) => onChange({ metric: event.target.value })}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
            >
              {METRICS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </Field>
          <Field label="ስንት ቡድን">
            <select
              value={card.top}
              onChange={(event) => onChange({ top: Number(event.target.value) })}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
            >
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={12}>12</option>
              <option value={20}>20</option>
            </select>
          </Field>
        </div>
        <p className="text-[11px] text-slate-500">
          {card.splitBy === 'none'
            ? 'አንድ መስክ ብቻ ተመርጧል። ሁለተኛ መስክ ብትመርጥ ግራፉ በሁለቱ ብቻ ይታያል።'
            : 'ግራፉ በተመረጡት ሁለት መስኮች ብቻ ይታያል። አንዱን ማንሳትም ይቻላል።'}
        </p>
      </div>

      <div className="p-4 flex-1">
        {loading && <p className="text-xs text-slate-500">በማዘጋጀት ላይ...</p>}
        {!loading && error && <p className="text-xs text-rose-700">{error}</p>}
        {!loading && !error && data && data.rows.length === 0 && (
          <p className="text-xs text-slate-500">ለዚህ ምርጫ መረጃ የለም</p>
        )}
        {!loading && !error && data && data.rows.length > 0 && card.view === 'bar' && (
          <BarView data={data} metric={card.metric} maxTotal={maxTotal} />
        )}
        {!loading && !error && data && data.rows.length > 0 && card.view === 'table' && (
          <TableView data={data} metric={card.metric} />
        )}
        {!loading && !error && data?.truncated && (
          <p className="mt-3 text-[11px] text-slate-500">የቀሩት ቡድኖች በ«ሌሎች» ውስጥ ተጠቃለዋል ወይም ከዝርዝሩ ውጭ ናቸው።</p>
        )}
      </div>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

function BarView({ data, metric, maxTotal }: { data: ReportSlice; metric: string; maxTotal: number }) {
  return (
    <div className="space-y-3">
      {data.series.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {data.series.map((key, index) => (
            <span key={key} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }} />
              {key}
            </span>
          ))}
        </div>
      )}
      {data.rows.map((row) => {
        const width = maxTotal > 0 ? Math.max((row.total / maxTotal) * 100, row.total > 0 ? 2 : 0) : 0;
        return (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-xs mb-1">
              <span className="font-bold text-slate-800 truncate">{row.label}</span>
              <span className="font-mono text-slate-600 shrink-0">
                {formatMetric(row.total, metric)}
                <span className="text-slate-400"> · {formatCount(row.people)}</span>
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              {data.series.length === 0 || metric.startsWith('avg') ? (
                <div className="h-full bg-blue-950 rounded-full" style={{ width: `${width}%` }} />
              ) : (
                <div className="h-full flex" style={{ width: `${width}%` }}>
                  {data.series.map((key, index) => {
                    const part = row.parts.find((item) => item.key === key);
                    const portion = row.total > 0 && part ? (part.value / row.total) * 100 : 0;
                    if (!portion) return null;
                    return (
                      <div
                        key={key}
                        className="h-full"
                        style={{ width: `${portion}%`, backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
                        title={`${key}: ${formatMetric(part?.value || 0, metric)}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            {metric.startsWith('avg') && data.series.length > 0 && (
              <p className="mt-1 text-[10px] text-slate-500 truncate">
                {data.series.map((key) => {
                  const part = row.parts.find((item) => item.key === key);
                  return `${key} ${part ? formatMetric(part.value, metric) : '—'}`;
                }).join(' · ')}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TableView({ data, metric }: { data: ReportSlice; metric: string }) {
  return (
    <div className="overflow-auto max-h-80 border border-slate-200 rounded-xl">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-600 sticky top-0">
          <tr>
            <th className="text-left font-bold px-3 py-2">ቡድን</th>
            {data.series.map((key) => (
              <th key={key} className="text-right font-bold px-3 py-2 whitespace-nowrap">{key}</th>
            ))}
            <th className="text-right font-bold px-3 py-2">ድምር</th>
            <th className="text-right font-bold px-3 py-2">ሰዎች</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.rows.map((row) => (
            <tr key={row.label}>
              <td className="px-3 py-2 font-semibold text-slate-800">{row.label}</td>
              {data.series.map((key) => {
                const part = row.parts.find((item) => item.key === key);
                return (
                  <td key={key} className="px-3 py-2 text-right font-mono text-slate-700">
                    {part ? formatMetric(part.value, metric) : '—'}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-right font-mono font-bold text-blue-950">{formatMetric(row.total, metric)}</td>
              <td className="px-3 py-2 text-right font-mono text-slate-500">{formatCount(row.people)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
