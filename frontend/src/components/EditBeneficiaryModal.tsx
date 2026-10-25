import React, { useState, useId } from 'react';
import { BeneficiaryRecord, CustomFormField, Gender, CategoryType } from '../types/registry';
import { WOREDA_OPTIONS, HEALTH_OPTIONS } from '../data/initialRecords';
import { isValidFaydaId, calculateFamilyTotal, sanitizeDigits } from '../utils/registryLogic';
import { X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EditBeneficiaryModalProps {
  record: BeneficiaryRecord;
  customFields: CustomFormField[];
  onSave: (updated: BeneficiaryRecord) => void;
  onClose: () => void;
}

export const EditBeneficiaryModal: React.FC<EditBeneficiaryModalProps> = ({
  record,
  customFields,
  onSave,
  onClose
}) => {
  const [fullName, setFullName] = useState(record.fullName);
  const [subCity, setSubCity] = useState(record.subCity);
  const [woreda, setWoreda] = useState(record.woreda);
  const [blockZone, setBlockZone] = useState(record.blockZone);
  const [locality, setLocality] = useState(record.locality);
  const [houseNo, setHouseNo] = useState(record.houseNo);
  const [faydaId, setFaydaId] = useState(record.faydaId);
  const [gender, setGender] = useState<Gender>(record.gender);
  const [age, setAge] = useState<number | ''>(record.age);
  const [healthStatus, setHealthStatus] = useState(record.healthStatus);
  const [familyMale, setFamilyMale] = useState<number | ''>(record.familyMale);
  const [familyFemale, setFamilyFemale] = useState<number | ''>(record.familyFemale);
  const [phone, setPhone] = useState(record.phone);
  const [category, setCategory] = useState<CategoryType>(record.category);
  const [customValues, setCustomValues] = useState<Record<string, any>>(record.customFields || {});

  const [errors, setErrors] = useState<Record<string, string>>({});

  const nameInputId = useId();
  const faydaInputId = useId();
  const phoneInputId = useId();
  const ageInputId = useId();

  const familyTotal = calculateFamilyTotal(familyMale || 0, familyFemale || 0);

  const handleFaydaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = sanitizeDigits(e.target.value).slice(0, 16);
    setFaydaId(raw);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'ስም ማስገባት ግዴታ ነው';
    if (!faydaId || faydaId.length !== 16) newErrors.faydaId = 'የፋይዳ ቁጥር 16 ድጅት መሆን አለበት';
    if (!phone.trim()) newErrors.phone = 'ስልክ ቁጥር ማስገባት ግዴታ ነው';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...record,
      fullName: fullName.trim(),
      subCity,
      woreda,
      blockZone: blockZone.trim(),
      locality: locality.trim(),
      houseNo: houseNo.trim(),
      faydaId,
      gender,
      age: Number(age || 0),
      healthStatus,
      familyMale: Number(familyMale || 0),
      familyFemale: Number(familyFemale || 0),
      familyTotal,
      phone: phone.trim(),
      category,
      customFields: customValues
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between border-b-2 border-yellow-500">
          <div>
            <span className="text-xs font-mono text-yellow-400 bg-blue-900 px-2 py-0.5 rounded">
              መዝገብ #{record.id}
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              የተረጂ መረጃ ማስተካከያ (Edit Beneficiary Record)
            </h3>
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

        {/* Edit Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label htmlFor={nameInputId} className="block text-xs font-bold text-slate-800 uppercase mb-1">
                ሙሉ ስም ከነአያት (Full Name) *
              </label>
              <input
                id={nameInputId}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              />
              {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
            </div>

            {/* Fayda ID */}
            <div>
              <label htmlFor={faydaInputId} className="block text-xs font-bold text-slate-800 uppercase mb-1">
                የፋይዳ መታወቂያ (16 አሃዞች) *
              </label>
              <input
                id={faydaInputId}
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={faydaId}
                onChange={handleFaydaChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm tracking-wider focus:outline-none focus:border-blue-900"
              />
              <span className="text-[11px] text-slate-500 font-mono">{faydaId.length}/16 ድጅቶች</span>
              {errors.faydaId && <p className="text-xs text-red-600 mt-1">{errors.faydaId}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor={phoneInputId} className="block text-xs font-bold text-slate-800 uppercase mb-1">
                ስልክ ቁጥር (Phone Number) *
              </label>
              <input
                id={phoneInputId}
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                ጾታ (Gender) *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
              >
                <option value="ወ">ወንድ (ወ)</option>
                <option value="ሴ">ሴት (ሴ)</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label htmlFor={ageInputId} className="block text-xs font-bold text-slate-800 uppercase mb-1">
                እድሜ (Age) *
              </label>
              <input
                id={ageInputId}
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* Woreda */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                ወረዳ (Woreda)
              </label>
              <select
                value={woreda}
                onChange={(e) => setWoreda(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
              >
                {WOREDA_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Block / Zone */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                ቀጠና / ብሎክ (Zone)
              </label>
              <input
                type="text"
                value={blockZone}
                onChange={(e) => setBlockZone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* Locality */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                የአከባቢ ልዩ መጠሪያ (Locality)
              </label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* House No */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                የቤት ቁጥር / ሁኔታ (House No)
              </label>
              <input
                type="text"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* Health Status */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                የጤና ሁኔታ (Health Status)
              </label>
              <select
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
              >
                {HEALTH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                የድጋፍ ምድብ (Category Sheet)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900 font-bold"
              >
                <option value="በቀጣይነት የሚረዱ">በቀጣይነት የሚረዱ (Continuous Support)</option>
                <option value="ሰሪ ሀይል">ሰሪ ሀይል (Workforce Group)</option>
              </select>
            </div>

            {/* Family Members Breakdown */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                ቤተሰብ ወንድ (Male Family)
              </label>
              <input
                type="number"
                min="0"
                value={familyMale}
                onChange={(e) => setFamilyMale(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                ቤተሰብ ሴት (Female Family)
              </label>
              <input
                type="number"
                min="0"
                value={familyFemale}
                onChange={(e) => setFamilyFemale(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* Dynamic Custom Fields */}
            {customFields.map((cf) => (
              <div key={cf.id}>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                  {cf.labelAm} ({cf.labelEn})
                </label>
                {cf.type === 'select' ? (
                  <select
                    value={customValues[cf.id] ?? ''}
                    onChange={(e) => setCustomValues({ ...customValues, [cf.id]: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
                  >
                    <option value="">-- ይምረጡ --</option>
                    {cf.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={cf.type === 'number' ? 'number' : 'text'}
                    value={customValues[cf.id] ?? ''}
                    onChange={(e) => setCustomValues({ ...customValues, [cf.id]: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-900"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-yellow-900 font-medium">
            ድምር የቤተሰብ ብዛት: <strong>{familyTotal}</strong> (ወንድ {familyMale || 0} + ሴት {familyFemale || 0})
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              ይቅር (Cancel)
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs shadow-sm cursor-pointer border-b-2 border-yellow-500"
            >
              <Save className="w-4 h-4 text-yellow-400" />
              <span>ለውጦቹን መዝግብ (Save Changes)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
