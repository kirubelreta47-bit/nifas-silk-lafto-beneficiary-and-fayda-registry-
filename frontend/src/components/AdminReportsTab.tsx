import React from 'react';
import { BeneficiaryRecord } from '../types/registry';
import { computeRegistryStats } from '../utils/registryLogic';
import {
  Users,
  Briefcase,
  HeartPulse,
  Home,
  PieChart,
  BarChart3,
  TrendingUp,
  MapPin,
  Activity,
  FileText,
  Printer
} from 'lucide-react';

interface AdminReportsTabProps {
  records: BeneficiaryRecord[];
  onExportPdf: () => void;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({ records, onExportPdf }) => {
  const stats = computeRegistryStats(records);

  return (
    <div className="space-y-6">
      {/* Top Section Control Bar with Download Button directly on the selected Reports section */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <h2 className="text-sm sm:text-base font-bold text-blue-950">
              የሪፖርት እና ስታትስቲክስ ትንታኔ (Statistical Analytics & Summary)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            የንፋስ ስልክ ላፍቶ ክፍለ ከተማ አጠቃላይ የተረጂዎች፣ የወረዳ ስርጭት እና የጤና ሁኔታ ስታትስቲክስ
          </p>
        </div>

        <button
          type="button"
          onClick={onExportPdf}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer border-b-2 border-yellow-500 shrink-0 self-start sm:self-auto"
          title="ኦፊሴላዊ የትንታኔ ሪፖርት PDF አውርድ ወይም አትም"
        >
          <FileText className="w-4 h-4 text-yellow-400" />
          <span>የትንታኔ PDF አውርድ / አትም</span>
          <Printer className="w-3.5 h-3.5 text-yellow-400/80" />
        </button>
      </div>
      {/* 4 KPI Summary Cards (White cards with Navy icons and Yellow accent bars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Registered Beneficiaries */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ጠቅላላ ተመዝጋቢዎች
              </p>
              <p className="text-xs text-slate-400">Total Beneficiaries</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-950 mt-2 font-mono">
                {stats.totalBeneficiaries}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-950 text-white flex items-center justify-center shadow-inner">
              <Users className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>ተ.ቁ 1 እስከ {stats.totalBeneficiaries}</span>
            <span className="font-semibold text-blue-900">100% ተመዝግቧል</span>
          </div>
        </div>

        {/* Card 2: Able-Bodied Workforce */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-900"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ሰሪ ሀይል (ስራ ፈላጊ)
              </p>
              <p className="text-xs text-slate-400">Able-Bodied Workforce</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-950 mt-2 font-mono">
                {stats.workforceCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-inner">
              <Briefcase className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>ከተመዝጋቢው ውስጥ</span>
            <span className="font-bold text-blue-900">
              {stats.totalBeneficiaries > 0
                ? Math.round((stats.workforceCount / stats.totalBeneficiaries) * 100)
                : 0}%
            </span>
          </div>
        </div>

        {/* Card 3: Continuous Support */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                በቀጣይነት የሚረዱ
              </p>
              <p className="text-xs text-slate-400">Continuous Support</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-950 mt-2 font-mono">
                {stats.continuousCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-950 text-white flex items-center justify-center shadow-inner">
              <HeartPulse className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>አረጋውያንና ህሙማን</span>
            <span className="font-bold text-blue-900">
              {stats.totalBeneficiaries > 0
                ? Math.round((stats.continuousCount / stats.totalBeneficiaries) * 100)
                : 0}%
            </span>
          </div>
        </div>

        {/* Card 4: Total Household Members Reached */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ጠቅላላ የቤተሰብ ብዛት
              </p>
              <p className="text-xs text-slate-400">Household Members</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-950 mt-2 font-mono">
                {stats.totalFamilyMembers}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-inner">
              <Home className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>አማካይ በቤተሰብ</span>
            <span className="font-bold text-blue-900">{stats.averageFamilySize} ነፍስ</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Woreda Distribution */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-900" />
              <h4 className="text-sm font-bold text-blue-950">
                የተረጂዎች ስርጭት በወረዳ (Distribution by Woreda)
              </h4>
            </div>
            <span className="text-xs text-slate-500">
              {stats.woredaDistribution.length} ወረዳዎች
            </span>
          </div>

          <div className="space-y-3">
            {stats.woredaDistribution.map((item) => (
              <div key={item.woreda} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{item.woreda}</span>
                  <span className="font-mono text-slate-600">
                    <strong className="text-blue-950">{item.count}</strong> ተረጂዎች ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-900 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(item.percentage, 6)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Condition Breakdown */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              <h4 className="text-sm font-bold text-blue-950">
                የጤና ሁኔታ ምደባ (Health Status Breakdown)
              </h4>
            </div>
            <span className="text-xs text-slate-500">
              {stats.healthDistribution.length} ምድቦች
            </span>
          </div>

          <div className="space-y-3">
            {stats.healthDistribution.map((item) => (
              <div key={item.condition} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{item.condition}</span>
                  <span className="font-mono text-slate-600">
                    <strong className="text-blue-950">{item.count}</strong> ሰው ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      item.condition === 'ጤነኛ' ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                    style={{ width: `${Math.max(item.percentage, 6)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Demographics & Ratio */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-900" />
              <h4 className="text-sm font-bold text-blue-950">
                የጾታ ስብጥር (Gender Ratio)
              </h4>
            </div>
            <span className="text-xs text-slate-500">የተመዝጋቢዎች ጾታ</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200">
              <span className="text-xs font-semibold text-blue-950 block">ወንድ (Male)</span>
              <span className="text-2xl font-bold font-mono text-blue-950 mt-1 block">
                {stats.genderRatio.male}
              </span>
              <span className="text-xs text-blue-700 font-bold">{stats.genderRatio.malePercentage}%</span>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
              <span className="text-xs font-semibold text-amber-950 block">ሴት (Female)</span>
              <span className="text-2xl font-bold font-mono text-amber-950 mt-1 block">
                {stats.genderRatio.female}
              </span>
              <span className="text-xs text-amber-700 font-bold">{stats.genderRatio.femalePercentage}%</span>
            </div>
          </div>

          <div className="w-full flex h-4 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-blue-900 text-[10px] text-white flex items-center justify-center font-bold"
              style={{ width: `${stats.genderRatio.malePercentage}%` }}
            >
              {stats.genderRatio.malePercentage > 15 ? `${stats.genderRatio.malePercentage}%` : ''}
            </div>
            <div
              className="bg-amber-500 text-[10px] text-blue-950 flex items-center justify-center font-bold"
              style={{ width: `${stats.genderRatio.femalePercentage}%` }}
            >
              {stats.genderRatio.femalePercentage > 15 ? `${stats.genderRatio.femalePercentage}%` : ''}
            </div>
          </div>
        </div>

        {/* Support Category Ratio */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-600" />
              <h4 className="text-sm font-bold text-blue-950">
                የድጋፍ ምድብ ስብጥር (Category Proportions)
              </h4>
            </div>
            <span className="text-xs text-slate-500">2 ዋና ዋና ምድቦች</span>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-950 block">በቀጣይነት የሚረዱ</span>
                <span className="text-[11px] text-slate-500">አረጋውያንና ቋሚ ድጋፍ ፈላጊዎች</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-blue-950 block">
                  {stats.continuousCount}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {stats.totalBeneficiaries > 0 ? Math.round((stats.continuousCount / stats.totalBeneficiaries) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-950 block">ሰሪ ሀይል</span>
                <span className="text-[11px] text-slate-500">የስራ እድልና ስልጠና ፈላጊዎች</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-blue-950 block">
                  {stats.workforceCount}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {stats.totalBeneficiaries > 0 ? Math.round((stats.workforceCount / stats.totalBeneficiaries) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
