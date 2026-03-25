async function run() {
  try {
    const res = await fetch('http://localhost:3002/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bobby', password: 'password' })
    });
    const txt = await res.text();
    console.log('status=' + res.status);
    console.log(txt);
  } catch (e) {
    console.log('error=' + e.message);
  }
}

run();