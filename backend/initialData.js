// Self-contained seed data for Nifas Silk-Lafto Fayda Registry

const INITIAL_CUSTOM_FIELDS = [
  {
    id: 'aidType',
    labelAm: 'የተጠቃሚው የእርዳታ አይነት',
    labelEn: 'Beneficiary Aid Type',
    type: 'select',
    options: ['የምግብና የህክምና ድጋፍ', 'የገንዘብና የምግብ ድጋፍ', 'የትምህርት ቁሳቁስ ድጋፍ', 'የቤት እድሳት ድጋፍ'],
    required: true,
    defaultValue: 'የምግብና የህክምና ድጋፍ'
  },
  {
    id: 'educationLevel',
    labelAm: 'የትምህርት ደረጃ',
    labelEn: 'Education Level',
    type: 'select',
    options: ['ያልተማረ/ች', 'መሰረተ ትምህርት', '1-8ኛ ክፍል', '9-12ኛ ክፍል', 'ዲፕሎማና ከዚያ በላይ'],
    required: false,
    defaultValue: '1-8ኛ ክፍል'
  }
];

const INITIAL_BENEFICIARIES = [
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
    healthStatus: 'ልብ ድካም',
    familyMale: 1,
    familyFemale: 0,
    familyTotal: 1,
    phone: '0913950290',
    category: 'በቀጣይነት የሚረዱ',
    registrationDate: '2024-03-15',
    customFields: {
      aidType: 'የምግብና የህክምና ድጋፍ',
      educationLevel: '1-8ኛ ክፍል'
    }
  },
  {
    id: 4,
    fullName: 'አልማዝ አየለ ተሰማ',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 02',
    blockZone: 'ቀጠና 3',
    locality: 'ጀሞ 1',
    houseNo: 'B-12',
    faydaId: '1092837465019283',
    gender: 'ሴ',
    age: 56,
    healthStatus: 'ጤነኛ',
    familyMale: 2,
    familyFemale: 3,
    familyTotal: 5,
    phone: '0911223344',
    category: 'ዝቅተኛ ገቢ ያላቸው',
    registrationDate: '2024-03-20',
    customFields: {
      aidType: 'የገንዘብና የምግብ ድጋፍ',
      educationLevel: 'መሰረተ ትምህርት'
    }
  },
  {
    id: 5,
    fullName: 'ተፈራ በቀለ ወልዴ',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 03',
    blockZone: 'ቀጠና 2',
    locality: 'መካኒሳ',
    houseNo: '840',
    faydaId: '9847261540392817',
    gender: 'ወ',
    age: 67,
    healthStatus: 'የስኳር ህመም',
    familyMale: 1,
    familyFemale: 2,
    familyTotal: 3,
    phone: '0922334455',
    category: 'በዕድሜ የገፉ (አረጋውያን)',
    registrationDate: '2024-03-22',
    customFields: {
      aidType: 'የምግብና የህክምና ድጋፍ',
      educationLevel: 'ያልተማረ/ች'
    }
  }
];

module.exports = {
  INITIAL_CUSTOM_FIELDS,
  INITIAL_BENEFICIARIES
};
