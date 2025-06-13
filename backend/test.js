const axios = require('axios');

// Test fonksiyonu
async function testBackend() {
  console.log('🔍 Testing backend...\n');

  try {
    // 1. Sunucu çalışıyor mu? (auth endpoint'ini kontrol edelim)
    console.log('1. Testing server connection...');
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me', { 
        timeout: 5000,
        validateStatus: function (status) {
          return status < 500; // 500'den küçük tüm status kodlarını kabul et
        }
      });
      
      // 401 bekliyoruz çünkü token yok, bu sunucunun çalıştığını gösterir
      if (response.status === 401) {
        console.log('✅ Server is running! (401 Unauthorized is expected)');
      } else {
        console.log('⚠️ Server responded with status:', response.status);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Server is not running. Please start it with: npm start');
        return;
      } else {
        console.log('⚠️ Server check failed:', error.message);
        return;
      }
    }

    console.log('\n✨ Backend test completed!');
  } catch (error) {
    console.log('\n❌ Test error:', error.message);
  }
}

testBackend(); 