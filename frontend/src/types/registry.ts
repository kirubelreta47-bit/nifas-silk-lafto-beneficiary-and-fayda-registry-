export type Gender = 'ወ' | 'ሴ';

export type CategoryType = 'ሰሪ ሀይል' | 'በቀጣይነት የሚረዱ';

export interface CustomFormField {
  id: string;
  labelAm: string;
  labelEn: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  options?: string[]; // comma-separated options when adding
  required: boolean;
  defaultValue?: string | number | boolean;
}

export interface BeneficiaryRecord {
  id: number;
  fullName: string;
  subCity: string;
  woreda: string;
  blockZone: string;
  locality: string;
  houseNo: string;
  faydaId: string; // 16 digits
  gender: Gender;
  age: number;
  healthStatus: string;
  familyMale: number;
  familyFemale: number;
  familyTotal: number;
  phone: string;
  category: CategoryType;
  registrationDate?: string;
  customFields?: Record<string, any>;
}

export interface RegistryStats {
  totalBeneficiaries: number;
  workforceCount: number;
  continuousCount: number;
  totalFamilyMembers: number;
  maleBeneficiaries: number;
  femaleBeneficiaries: number;
  averageFamilySize: number;
  woredaDistribution: { woreda: string; count: number; percentage: number }[];
  healthDistribution: { condition: string; count: number; percentage: number }[];
  genderRatio: { male: number; female: number; malePercentage: number; femalePercentage: number };
}

export interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: 'super_admin' | 'woreda_officer' | string;
  woreda?: string;
}
