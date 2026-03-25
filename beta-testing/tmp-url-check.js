(async () => {
  const urls = [
    'http://localhost:3002/admin',
    'http://localhost:3002/admin/',
    'http://localhost:3002/admin/index.html',
    'http://localhost:3333/admin',
  ];

  for (const u of urls) {
    try {
      const r = await fetch(u, { redirect: 'manual' });
      console.log(u + ' -> ' + r.status);
    } catch (e) {
      console.log(u + ' -> ERR ' + e.message);
    }
  }
})();