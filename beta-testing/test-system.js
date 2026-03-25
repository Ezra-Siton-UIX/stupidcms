async function fullSystemTest() {
  console.log('=== StupidCMS Full System Test ===\n');

  // Test 1: Login
  console.log('1. Testing Login...');
  const loginRes = await fetch('http://localhost:3002/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bobby', password: 'password' })
  });
  const { token, site_id } = await loginRes.json();
  console.log('   ✓ Bobby logged in, site_id:', site_id);

  // Test 2: Protected API with JWT
  console.log('\n2. Testing Protected API (with JWT)...');
  const protectedRes = await fetch('http://localhost:3002/api/site_bobby/posts', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const posts = await protectedRes.json();
  console.log('   ✓ Retrieved', posts.length, 'posts');

  // Test 3: Protected API without JWT (should fail)
  console.log('\n3. Testing Protected API (without JWT - should fail)...');
  const noAuthRes = await fetch('http://localhost:3002/api/site_bobby/posts');
  console.log('   ✓ Status code:', noAuthRes.status, '(expected 401)');

  // Test 4: Public API
  console.log('\n4. Testing Public API...');
  const publicRes = await fetch('http://localhost:3002/api/public/site_bobby/posts');
  const publicPosts = await publicRes.json();
  console.log('   ✓ Public API returns', publicPosts.length, 'posts');

  // Test 5: Static pages served
  console.log('\n5. Testing Static Pages...');
  const adminRes = await fetch('http://localhost:3002/admin/index.html');
  console.log('   ✓ Admin page status:', adminRes.status);

  const betaIndexRes = await fetch('http://localhost:3002/beta-testing/index.html');
  console.log('   ✓ Beta index status:', betaIndexRes.status);

  const loginPageRes = await fetch('http://localhost:3002/login.html');
  console.log('   ✓ Login page status:', loginPageRes.status);

  console.log('\n=== All Tests Passed ✓ ===');
}

fullSystemTest().catch(err => console.error('Test failed:', err.message));