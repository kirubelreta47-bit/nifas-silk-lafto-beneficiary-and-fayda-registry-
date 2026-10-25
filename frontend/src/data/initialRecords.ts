import { BeneficiaryRecord, CustomFormField } from '../types/registry';

export const INITIAL_BENEFICIARIES: BeneficiaryRecord[] = [
  {
    id: 1,
    fullName: 'ጊዜ ጥላሁን ገላይ',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 01',
    blockZone: 'ቀጠና 1',
    locality: 'አብርሀሙ ስላሴ',
    houseNo: 'ተከራይ',
    faydaId: '5475904205272936',
    gender: 'ወ',
    age: 38,
    healthStatus: 'አካል ጉዳት',
    familyMale: 1,
    familyFemale: 1,
    familyTotal: 2,
    phone: '0931753611',
    category: 'በቀጣይነት የሚረዱ',
    registrationDate: '2024-03-12',
    customFields: {
      aidType: 'የምግብና የህክምና ድጋፍ',
      educationLevel: '1-8ኛ ክፍል'
    }
  },
  {
    id: 2,
    fullName: 'መኪያ መሀመድ ኡመር',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 01',
    blockZone: 'ቀጠና 1',
    locality: 'አብርሀሙ ስላሴ',
    houseNo: 'ተከራይ',
    faydaId: '5806440932751690',
    gender: 'ሴ',
    age: 42,
    healthStatus: 'ልብ ድካም',
    familyMale: 5,
    familyFemale: 4,
    familyTotal: 9,
    phone: '0919341737',
    category: 'በቀጣይነት የሚረዱ',
    registrationDate: '2024-03-14',
    customFields: {
      aidType: 'የገንዘብና የምግብ ድጋፍ',
      educationLevel: 'ያልተማረ/ች'
    }
  },
  {
    id: 3,
    fullName: 'ገ/የሱስ ዘውዱ ግዛው',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 01',
    blockZone: 'ቀጠና 1',
    locality: 'አብርሀሙ ስላሴ',
    houseNo: 'ተከራይ',
    faydaId: '4629530890715634',
    gender: 'ሴ',
    age: 42,
    healthStatus: 'አካል ጉዳት',
    familyMale: 3,
    familyFemale: 2,
    familyTotal: 5,
    phone: '0921733468',
    category: 'በቀጣይነት የሚረዱ',
    registrationDate: '2024-03-15',
    customFields: {
      aidType: 'የጤና እና የትምህርት ድጋፍ',
      educationLevel: '9-12ኛ ክፍል'
    }
  },
  {
    id: 4,
    fullName: 'አመቤት ደገፉ ኤርገዶ',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 01',
    blockZone: 'ቀጠና 1',
    locality: 'ቆርቆሮ ሰፈር',
    houseNo: 'ተከራይ',
    faydaId: '2763784207941036',
    gender: 'ሴ',
    age: 34,
    healthStatus: 'ጤነኛ',
    familyMale: 2,
    familyFemale: 1,
    familyTotal: 3,
    phone: '0902399053',
    category: 'ሰሪ ሀይል',
    registrationDate: '2024-03-18',
    customFields: {
      aidType: 'የስራ እድልና ስልጠና',
      educationLevel: '9-12ኛ ክፍል'
    }
  },
  {
    id: 5,
    fullName: 'ሙሂባ ሀዋስ ቡሽራ',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 01',
    blockZone: 'ቀጠና 1',
    locality: 'ቆርቆሮ ሰፈር',
    houseNo: 'ተከራይ',
    faydaId: '4734039028501521',
    gender: 'ሴ',
    age: 35,
    healthStatus: 'ጤነኛ',
    familyMale: 2,
    familyFemale: 3,
    familyTotal: 5,
    phone: '0911674544',
    category: 'ሰሪ ሀይል',
    registrationDate: '2024-03-20',
    customFields: {
      aidType: 'የጥቃቅን ንግድ ብድር',
      educationLevel: 'የቴክኒክና ሙያ ዲፕሎማ'
    }
  },
  {
    id: 6,
    fullName: 'አለም ጸጋዬ ኪ/ማርያም',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 02',
    blockZone: 'ቀጠና 2',
    locality: '240/1',
    houseNo: '240/1',
    faydaId: '1332840049298492',
    gender: 'ሴ',
    age: 66,
    healthStatus: 'ጤነኛ',
    familyMale: 0,
    familyFemale: 1,
    familyTotal: 1,
    phone: '0921474205',
    category: 'በቀጣይነት የሚረዱ',
    registrationDate: '2024-03-22',
    customFields: {
      aidType: 'የአረጋውያን የምግብ ድጋፍ',
      educationLevel: 'ያልተማረ/ች'
    }
  },
  {
    id: 7,
    fullName: 'ተስፋዬ በቀለ ሀብቴ',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ወረዳ 03',
    blockZone: 'ቀጠና 4',
    locality: 'ጀሞ 1 ኮንዶሚኒየም',
    houseNo: 'B-14/302',
    faydaId: '8392019482019284',
    gender: 'ወ',
    age: 46,
    healthStatus: 'ውስጥ ደዌ',
    familyMale: 2,
    familyFemale: 2,
    familyTotal: 4,
    phone: '0912445566',
    category: 'በቀጣይነት የሚረዱ',
    registrationDate: '2024-03-25',
    customFields: {
      aidType: 'የመድሃኒት ድጋፍ',
      educationLevel: '1-8ኛ ክፍል'
    }
  },
  {
    id: 8,
    fullName: 'ብርቱካን አስፋው ታደሰ',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ወረዳ 05',
    blockZone: 'ቀጠና 3',
    locality: 'መካኒሳ ጀርመን አደባባይ',
    houseNo: 'ተከራይ',
    faydaId: '6201948573920184',
    gender: 'ሴ',
    age: 29,
    healthStatus: 'ጤነኛ',
    familyMale: 1,
    familyFemale: 2,
    familyTotal: 3,
    phone: '0935889900',
    category: 'ሰሪ ሀይል',
    registrationDate: '2024-03-28',
    customFields: {
      aidType: 'የስራ እድልና ስልጠና',
      educationLevel: 'የመጀመሪያ ዲግሪ'
    }
  }
];

export const INITIAL_CUSTOM_FIELDS: CustomFormField[] = [
  {
    id: 'aidType',
    labelAm: 'የተጠየቀው የድጋፍ አይነት',
    labelEn: 'Requested Aid Type',
    type: 'select',
    options: [
      'የምግብና የህክምና ድጋፍ',
      'የገንዘብና የምግብ ድጋፍ',
      'የጤና እና የትምህርት ድጋፍ',
      'የስራ እድልና ስልጠና',
      'የጥቃቅን ንግድ ብድር',
      'የአረጋውያን የምግብ ድጋፍ',
      'የመድሃኒት ድጋፍ'
    ],
    required: false,
    defaultValue: 'የምግብና የህክምና ድጋፍ'
  },
  {
    id: 'educationLevel',
    labelAm: 'የትምህርት ደረጃ',
    labelEn: 'Education Level',
    type: 'select',
    options: [
      'ያልተማረ/ች',
      '1-8ኛ ክፍል',
      '9-12ኛ ክፍል',
      'የቴክኒክና ሙያ ዲፕሎማ',
      'የመጀመሪያ ዲግሪ',
      'ከፍተኛ ዲግሪ'
    ],
    required: false,
    defaultValue: '1-8ኛ ክፍል'
  }
];

export const WOREDA_OPTIONS = [
  'ለቡ 01',
  'ለቡ 02',
  'ወረዳ 01',
  'ወረዳ 02',
  'ወረዳ 03',
  'ወረዳ 04',
  'ወረዳ 05',
  'ወረዳ 06',
  'ወረዳ 07',
  'ወረዳ 08',
  'ወረዳ 09',
  'ወረዳ 10',
  'ወረዳ 11',
  'ወረዳ 12',
  'ወረዳ 13',
  'ወረዳ 14',
  'ወረዳ 15'
];

export const HEALTH_OPTIONS = [
  'ጤነኛ',
  'አካል ጉዳት',
  'ልብ ድካም',
  'ታማሚ',
  'ውስጥ ደዌ',
  'የስኳር ህመም',
  'የደም ግፊት',
  'ሌላ'
];
