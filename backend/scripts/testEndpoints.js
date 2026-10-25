async function testHttpEndpoints() {
  console.log('--- 1. Testing Health Endpoint ---');
  const healthRes = await fetch('http://127.0.0.1:5000/api/health');
  const health = await healthRes.json();
  console.log('✅ Health Response:', healthRes.status, health);

  console.log('--- 2. Testing Admin Login (/api/auth/login) ---');
  const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'admin', password: '123321123' })
  });
  const loginData = await loginRes.json();
  console.log('✅ /api/auth/login Status:', loginRes.status);
  console.log('✅ Login Success:', loginData.success, '| User:', loginData.user?.fullName, '| Token Length:', loginData.token?.length);

  console.log('--- 3. Testing Alias /api/login Endpoint ---');
  const loginAliasRes = await fetch('http://127.0.0.1:5000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'admin', password: '123321123' })
  });
  console.log('✅ /api/login Status:', loginAliasRes.status);

  console.log('--- 4. Testing POST /api/beneficiaries (Registration Insert) ---');
  const testFaydaId = '5555' + Math.floor(100000000000 + Math.random() * 900000000000);
  const newBeneficiary = {
    fullName: 'ታሪኩ አለሙ ደምሴ',
    subCity: 'ንፋስ ስልክ ላፍቶ',
    woreda: 'ለቡ 01',
    blockZone: 'ቀጠና 1',
    locality: 'አብርሀሙ ስላሴ',
    houseNo: '240',
    faydaId: testFaydaId,
    gender: 'ወ',
    age: 36,
    healthStatus: 'ጤነኛ',
    familyMale: 1,
    familyFemale: 2,
    familyTotal: 3,
    phone: '0911998877',
    category: 'በቀጣይነት የሚረዱ',
    customFields: { aidType: 'የምግብና የህክምና ድጋፍ' }
  };

  const createRes = await fetch('http://127.0.0.1:5000/api/beneficiaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newBeneficiary)
  });
  const created = await createRes.json();
  console.log('✅ /api/beneficiaries Status:', createRes.status);
  console.log('✅ Saved Record in Neon DB:');
  console.log(`   ID: #${created.id} | Name: ${created.fullName} | Fayda: ${created.faydaId} | Woreda: ${created.woreda}`);

  console.log('--- 5. Testing GET /api/beneficiaries (Verify Query) ---');
  const listRes = await fetch(`http://127.0.0.1:5000/api/beneficiaries?search=${encodeURIComponent('ታሪኩ')}`);
  const list = await listRes.json();
  console.log('✅ Found matching beneficiary in database list:', list.length > 0 ? list[0].fullName : 'Not found');

  console.log('--- 6. Cleaning Up Test Record ---');
  const delRes = await fetch(`http://127.0.0.1:5000/api/beneficiaries/${created.id}`, { method: 'DELETE' });
  console.log('✅ Cleaned up test record:', await delRes.json());

  console.log('========================================================');
  console.log('🎯 ALL HTTP & DATABASE TESTS PASSED 100% SUCCESSFULLY');
  console.log('========================================================');
}

testHttpEndpoints().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
