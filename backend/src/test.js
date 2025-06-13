const request = require('supertest');
const app = require('./server');

// Test verileri
const testUser = {
  email: 'test@example.com',
  password: 'test123',
  name: 'Test User',
  phone: '1234567890',
  kvkkConsent: true
};

const testRequest = {
  title: 'Test Request',
  description: 'This is a test request',
  category: 'maintenance',
  location: {
    coordinates: [41.0082, 28.9784],
    address: {
      street: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345'
    }
  }
};

// Test fonksiyonları
async function runTests() {
  console.log('🚀 Starting API tests...\n');

  try {
    // 1. Kullanıcı Kaydı Testi
    console.log('📝 Testing user registration...');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    if (registerRes.status === 201) {
      console.log('✅ User registration successful');
    } else {
      console.log('❌ User registration failed:', registerRes.body);
    }

    // 2. Kullanıcı Girişi Testi
    console.log('\n🔑 Testing user login...');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    if (loginRes.status === 200 && loginRes.body.token) {
      console.log('✅ User login successful');
      const token = loginRes.body.token;

      // 3. Servis Talebi Oluşturma Testi
      console.log('\n📋 Testing service request creation...');
      const requestRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${token}`)
        .send(testRequest);

      if (requestRes.status === 201) {
        console.log('✅ Service request creation successful');
        const requestId = requestRes.body._id;

        // 4. Servis Talebi Listeleme Testi
        console.log('\n📋 Testing service request listing...');
        const listRes = await request(app)
          .get('/api/requests/my-requests')
          .set('Authorization', `Bearer ${token}`);

        if (listRes.status === 200 && Array.isArray(listRes.body)) {
          console.log('✅ Service request listing successful');
          console.log(`📊 Found ${listRes.body.length} requests`);
        } else {
          console.log('❌ Service request listing failed:', listRes.body);
        }
      } else {
        console.log('❌ Service request creation failed:', requestRes.body);
      }
    } else {
      console.log('❌ User login failed:', loginRes.body);
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }

  console.log('\n✨ Tests completed!');
}

// Testleri çalıştır
runTests(); 