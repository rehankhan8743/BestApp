const axios = require('axios');

async function testAPI() {
  try {
    console.log('🧪 Testing BestApp API...\n');
    
    // Test 1: Health Check
    console.log('1️⃣ Health Check...');
    const health = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health:', health.data);
    console.log('');
    
    // Test 2: Get All Posts
    console.log('2️⃣ Get All Posts...');
    const posts = await axios.get('http://localhost:5000/api/posts');
    console.log('✅ Posts Count:', posts.data.length);
    console.log('✅ Posts:', posts.data);
    console.log('');
    
    // Test 3: Create a Post
    console.log('3️⃣ Create New Post...');
    const newPost = await axios.post('http://localhost:5000/api/posts', {
      title: 'Test App',
      fileLink: 'https://example.com/download',
      description: 'This is a test app'
    });
    console.log('✅ Created:', newPost.data);
    console.log('');
    
    // Test 4: Get All Posts Again
    console.log('4️⃣ Get All Posts (after create)...');
    const updatedPosts = await axios.get('http://localhost:5000/api/posts');
    console.log('✅ Posts Count:', updatedPosts.data.length);
    console.log('');
    
    console.log('🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();
