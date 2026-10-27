import React, { useState, useId } from 'react';
import {
  BeneficiaryRecord,
  CustomFormField,
  Gender,
  CategoryType
} from '../types/registry';
import {
  WOREDA_OPTIONS,
  HEALTH_OPTIONS
} from '../data/initialRecords';
import {
  isValidFaydaId,
  formatFaydaId,
  calculateFamilyTotal,
  sanitizeDigits
} from '../utils/registryLogic';
import {
  User,
  MapPin,
  CreditCard,
  Users,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface RegistrationFormProps {
  customFields: CustomFormField[];
  onSubmit: (record: Omit<BeneficiaryRecord, 'id'>) => void;
  nextId: number;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  customFields,
  onSubmit,
  nextId
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [subCity, setSubCity] = useState('ንፋስ ስልክ ላፍቶ');
  const [woreda, setWoreda] = useState('ለቡ 01');
  const [blockZone, setBlockZone] = useState('ቀጠና 1');
  const [locality, setLocality] = useState('');
  const [houseNo, setHouseNo] = useState('ተከራይ');
  const [faydaId, setFaydaId] = useState('');
  const [gender, setGender] = useState<Gender>('ሴ');
  const [age, setAge] = useState<number | ''>(35);
  const [healthStatus, setHealthStatus] = useState('ጤነኛ');
  const [familyMale, setFamilyMale] = useState<number | ''>(1);
  const [familyFemale, setFamilyFemale] = useState<number | ''>(2);
  const [phone, setPhone] = useState('09');
  const [category, setCategory] = useState<CategoryType>('በቀጣይነት የሚረዱ');
  const [customValues, setCustomValues] = useState<Record<string, any>>({});

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedAttempt, setSubmittedAttempt] = useState(false);

  // Accessible IDs
  const nameId = useId();
  const faydaInputId = useId();
  const phoneId = useId();
  const ageId = useId();
  const localityId = useId();
  const houseId = useId();
  const zoneId = useId();

  // Real-time calculated family total
  const familyTotal = calculateFamilyTotal(familyMale || 0, familyFemale || 0);

  const handleFaydaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = sanitizeDigits(e.target.value).slice(0, 16);
    setFaydaId(raw);
    if (submittedAttempt) {
      if (raw.length === 16) {
        setErrors((prev) => ({ ...prev, faydaId: '' }));
      } else {
        setErrors((prev) => ({ ...prev, faydaId: 'የፋይዳ ቁጥር 16 ድጅት መሆን አለበት' }));
      }
    }
  };

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomValues((prev) => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const resetForm = () => {
    setFullName('');
    setLocality('');
    setHouseNo('ተከራይ');
    setFaydaId('');
    setAge(35);
    setFamilyMale(1);
    setFamilyFemale(2);
    setPhone('09');
    setCustomValues({});
    setErrors({});
    setSubmittedAttempt(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedAttempt(true);

    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'እባክዎ ሙሉ ስም ከነአያት ያስገቡ';
    }
    if (!locality.trim()) {
      newErrors.locality = 'የአከባቢው ልዩ መጠሪያ ያስገቡ';
    }
    if (!houseNo.trim()) {
      newErrors.houseNo = 'የቤት ቁጥር ወይም ሁኔታ ያስገቡ';
    }
    if (!faydaId || faydaId.length !== 16) {
      newErrors.faydaId = 'የፋይዳ ቁጥር ልክ 16 ድጅት መሆን አለበት';
    }
    if (!phone || phone.trim().length < 9) {
      newErrors.phone = 'ትክክለኛ ስልክ ቁጥር ያስገቡ';
    }
    if (!age || Number(age) < 1) {
      newErrors.age = 'ትክክለኛ እድሜ ያስገቡ';
    }

    customFields.forEach((cf) => {
      if (cf.required) {
        const val = customValues[cf.id];
        if (val === undefined || val === '' || val === null) {
          newErrors[cf.id] = `${cf.labelAm} ማስገባት ግዴታ ነው`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      fullName: fullName.trim(),
      subCity,
      woreda,
      blockZone,
      locality: locality.trim(),
      houseNo: houseNo.trim(),
      faydaId,
      gender,
      age: Number(age),
      healthStatus,
      familyMale: Number(familyMale || 0),
      familyFemale: Number(familyFemale || 0),
      familyTotal,
      phone: phone.trim(),
      category,
      registrationDate: new Date().toISOString().split('T')[0],
      customFields: customValues
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Streamlined Screen-Fit Registration Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Compact Banner */}
        <div className="bg-blue-950 px-5 py-3 text-white border-b-2 border-yellow-500 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                የተረጂዎች እና የፋይዳ ብሔራዊ መታወቂያ ምዝገባ
              </h2>
              <p className="text-xs text-blue-200 leading-tight">
                Nifas Silk-Lafto Sub-City Beneficiary & National Fayda ID Enrollment Form
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Form for Screen Fit View */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Personal Information (6 Cols) */}
            <div className="lg:col-span-6 space-y-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <User className="w-4 h-4 text-blue-900" />
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                  1. የግል እና የስነ-ህዝብ መረጃ <span className="text-slate-500 font-normal normal-case">(Personal Details)</span>
                </h3>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor={nameId} className="block text-xs font-semibold text-slate-800 mb-1">
                  ሙሉ ስም ከነአያት <span className="text-red-600">*</span>
                  <span className="text-slate-400 font-normal ml-1">(Full Name)</span>
                </label>
                <input
                  id={nameId}
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors({ ...errors, fullName: '' });
                  }}
                  placeholder="ለምሳሌ: ጊዜ ጥላሁን ገላይ"
                  className={`w-full px-3 py-2 rounded-lg border text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 ${
                    errors.fullName ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-900 focus:ring-blue-900'
                  }`}
                />
                {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
              </div>

              {/* Gender, Age, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    ጾታ <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-white p-0.5 rounded-lg border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setGender('ወ')}
                      className={`py-1.5 text-xs font-bold rounded transition-all cursor-pointer text-center ${
                        gender === 'ወ'
                          ? 'bg-blue-950 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ወ (M)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('ሴ')}
                      className={`py-1.5 text-xs font-bold rounded transition-all cursor-pointer text-center ${
                        gender === 'ሴ'
                          ? 'bg-blue-950 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ሴ (F)
                    </button>
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label htmlFor={ageId} className="block text-xs font-semibold text-slate-800 mb-1">
                    እድሜ <span className="text-red-600">*</span>
                  </label>
                  <input
                    id={ageId}
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:border-blue-900"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor={phoneId} className="block text-xs font-semibold text-slate-800 mb-1">
                    ስልክ <span className="text-red-600">*</span>
                  </label>
                  <input
                    id={phoneId}
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    placeholder="09..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              {/* Health Condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  የጤና ሁኔታ <span className="text-red-600">*</span>
                  <span className="text-slate-400 font-normal ml-1">(Health Status)</span>
                </label>
                <select
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-900"
                >
                  {HEALTH_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Radio Buttons */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  የድጋፍ ምድብ (Category) <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      category === 'በቀጣይነት የሚረዱ'
                        ? 'bg-blue-50 border-blue-900 ring-1 ring-blue-900'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={category === 'በቀጣይነት የሚረዱ'}
                      onChange={() => setCategory('በቀጣይነት የሚረዱ')}
                      className="text-blue-950 focus:ring-blue-950"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-900 leading-tight">በቀጣይነት የሚረዱ</span>
                      <span className="block text-[10px] text-slate-500">Continuous Support</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      category === 'ሰሪ ሀይል'
                        ? 'bg-blue-50 border-blue-900 ring-1 ring-blue-900'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={category === 'ሰሪ ሀይል'}
                      onChange={() => setCategory('ሰሪ ሀይል')}
                      className="text-blue-950 focus:ring-blue-950"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-900 leading-tight">ሰሪ ሀይል</span>
                      <span className="block text-[10px] text-slate-500">Workforce Group</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Address, Fayda ID, and Family counts (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Section 2: Residential Address */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <MapPin className="w-4 h-4 text-blue-900" />
                  <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                    2. የመኖሪያ አድራሻ <span className="text-slate-500 font-normal normal-case">(Residential Address)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      ክፍለ ከተማ
                    </label>
                    <input
                      type="text"
                      value={subCity}
                      readOnly
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 bg-slate-100 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      ወረዳ <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={woreda}
                      onChange={(e) => setWoreda(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-900"
                    >
                      {WOREDA_OPTIONS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={zoneId} className="block text-xs font-semibold text-slate-800 mb-1">
                      ቀጠና
                    </label>
                    <input
                      id={zoneId}
                      type="text"
                      value={blockZone}
                      onChange={(e) => setBlockZone(e.target.value)}
                      placeholder="ቀጠና 1"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={localityId} className="block text-xs font-semibold text-slate-800 mb-1">
                      የአከባቢ ልዩ መጠሪያ <span className="text-red-600">*</span>
                    </label>
                    <input
                      id={localityId}
                      type="text"
                      value={locality}
                      onChange={(e) => {
                        setLocality(e.target.value);
                        if (errors.locality) setErrors({ ...errors, locality: '' });
                      }}
                      placeholder="ለምሳሌ: አብርሀሙ ስላሴ"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-900"
                    />
                    {errors.locality && <p className="text-xs text-red-600 mt-0.5">{errors.locality}</p>}
                  </div>

                  <div>
                    <label htmlFor={houseId} className="block text-xs font-semibold text-slate-800 mb-1">
                      የቤት ቁጥር / ሁኔታ <span className="text-red-600">*</span>
                    </label>
                    <input
                      id={houseId}
                      type="text"
                      value={houseNo}
                      onChange={(e) => {
                        setHouseNo(e.target.value);
                        if (errors.houseNo) setErrors({ ...errors, houseNo: '' });
                      }}
                      placeholder="ተከራይ ወይም 240/1"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-900"
                    />
                    {errors.houseNo && <p className="text-xs text-red-600 mt-0.5">{errors.houseNo}</p>}
                  </div>
                </div>
              </div>

              {/* Section 3: 16-Digit Fayda National ID */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-900" />
                    <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                      3. የፋይዳ ብሔራዊ መታወቂያ <span className="text-slate-500 font-normal normal-case">(16-Digit Fayda ID)</span>
                    </h3>
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    faydaId.length === 16
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  }`}>
                    {faydaId.length} / 16 ድጅት
                  </span>
                </div>

                <div className="relative">
                  <input
                    id={faydaInputId}
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={faydaId}
                    onChange={handleFaydaChange}
                    placeholder="5475904205272936"
                    className={`w-full px-3 py-2 rounded-lg border font-mono text-sm tracking-widest text-blue-950 bg-white focus:outline-none ${
                      isValidFaydaId(faydaId)
                        ? 'border-green-600 ring-1 ring-green-600'
                        : 'border-slate-300 focus:border-blue-900'
                    }`}
                  />
                </div>

                {faydaId.length > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>ቅርጸት: <strong className="font-mono text-blue-950">{formatFaydaId(faydaId)}</strong></span>
                    {faydaId.length === 16 && (
                      <span className="text-green-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ትክክለኛ 16 አሃዝ
                      </span>
                    )}
                  </div>
                )}
                {errors.faydaId && <p className="text-xs text-red-600 mt-1">{errors.faydaId}</p>}
              </div>

              {/* Section 4: Household Demographics & Live Auto-Sum */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-3">
                  <Users className="w-4 h-4 text-blue-900" />
                  <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                    4. የቤተሰብ ብዛት <span className="text-slate-500 font-normal normal-case">(Family Size & Auto-Sum)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  {/* Male count */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      ወንድ (Male)
                    </label>
                    <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
                      <button
                        type="button"
                        onClick={() => setFamilyMale((m) => Math.max(0, (Number(m) || 0) - 1))}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-sm transition-colors cursor-pointer select-none"
                        aria-label="Decrease male family members"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={familyMale}
                        onChange={(e) => setFamilyMale(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="w-full text-center py-2 text-xs sm:text-sm font-bold text-slate-900 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setFamilyMale((m) => (Number(m) || 0) + 1)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-sm transition-colors cursor-pointer select-none"
                        aria-label="Increase male family members"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Female count */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      ሴት (Female)
                    </label>
                    <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
                      <button
                        type="button"
                        onClick={() => setFamilyFemale((f) => Math.max(0, (Number(f) || 0) - 1))}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-sm transition-colors cursor-pointer select-none"
                        aria-label="Decrease female family members"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={familyFemale}
                        onChange={(e) => setFamilyFemale(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="w-full text-center py-2 text-xs sm:text-sm font-bold text-slate-900 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setFamilyFemale((f) => (Number(f) || 0) + 1)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-sm transition-colors cursor-pointer select-none"
                        aria-label="Increase female family members"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Real-time Total Card */}
                  <div className="bg-yellow-100/90 border border-yellow-300 p-2.5 rounded-xl text-center shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-yellow-950 block">ጠቅላላ የቤተሰብ ድምር</span>
                    <span className="text-xl font-extrabold font-mono text-blue-950 block leading-tight">
                      {familyTotal}
                    </span>
                    <span className="text-[10px] text-yellow-900 font-medium">አባላት (Total Members)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Custom Dynamic Fields (rendered if configured by admin) */}
          {customFields.length > 0 && (
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                <Sparkles className="w-4 h-4 text-yellow-600" />
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                  5. ተጨማሪ መረጃ <span className="text-slate-500 font-normal normal-case">(Admin Dynamic Fields)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {customFields.map((field) => {
                  const val = customValues[field.id] ?? field.defaultValue ?? '';
                  const err = errors[field.id];

                  return (
                    <div key={field.id} className={field.type === 'checkbox' ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        {field.labelAm}
                        {field.required && <span className="text-red-600 ml-1">*</span>}
                        <span className="text-slate-400 font-normal ml-1">({field.labelEn})</span>
                      </label>

                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          placeholder={`${field.labelAm} ያስገቡ`}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:border-blue-900"
                        />
                      )}

                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:border-blue-900"
                        />
                      )}

                      {field.type === 'select' && (
                        <select
                          value={val}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:border-blue-900"
                        >
                          <option value="">-- ይምረጡ (Select Option) --</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {field.type === 'checkbox' && (
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
                            className="w-4 h-4 text-blue-950 rounded border-slate-300"
                          />
                          <span className="text-xs text-slate-800 font-medium">{field.labelAm}</span>
                        </label>
                      )}
                      {err && <p className="text-xs text-red-600 mt-0.5">{err}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>ቅጹን አጽዳ (Reset)</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer border-b-2 border-yellow-500"
            >
              <Send className="w-4 h-4 text-yellow-400" />
              <span>ምዝገባውን አረጋግጥና መዝግብ (Submit Registration)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
