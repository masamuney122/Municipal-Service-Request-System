const axios = require('axios');

// Test fonksiyonu
async function testFrontend() {
  console.log('🔍 Testing frontend...\n');

  try {
    // 1. Frontend sunucusu çalışıyor mu?
    console.log('1. Testing frontend server...');
    try {
      const response = await axios.get('http://localhost:3000', { timeout: 5000 });
      if (response.status === 200) {
        console.log('✅ Frontend server is running!');
      } else {
        console.log('⚠️ Frontend server responded with status:', response.status);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Frontend server is not running. Please start it with: npm start');
      } else {
        console.log('⚠️ Frontend server check failed:', error.message);
      }
      return; // Diğer testlere devam etmeye gerek yok
    }

    // 2. API bağlantısı çalışıyor mu?
    console.log('\n2. Testing API connection...');
    try {
      const apiResponse = await axios.get('http://localhost:5000/api/auth/me', { timeout: 5000, validateStatus: s => s < 500 });
      if (apiResponse.status === 401) {
        console.log('✅ API server is running! (401 Unauthorized is expected)');
      } else {
        console.log('⚠️ API server responded with status:', apiResponse.status);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ API server is not running. Please start backend with: cd backend && npm start');
      } else {
        console.log('⚠️ API connection check failed:', error.message);
      }
    }

    console.log('\n✨ Frontend tests completed!');
    console.log('\nNot: Frontend testleri için:');
    console.log('1. Frontend sunucusunu başlatın: npm start');
    console.log('2. Backend sunucusunu başlatın: cd backend && npm start');
    console.log('3. Tarayıcıda http://localhost:3000 adresini kontrol edin');

  } catch (error) {
    console.log('\n❌ Test error:', error.message);
  }
}

// Testi çalıştır
testFrontend(); 