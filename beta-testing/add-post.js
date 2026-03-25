async function test() {
  const loginRes = await fetch('http://localhost:3002/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bobby', password: 'password' })
  });
  const { token } = await loginRes.json();

  const newPost = {
    title: 'My New Post',
    slug: 'my-new-post',
    author: 'Bobby',
    date: new Date().toISOString().split('T')[0],
    image_url: 'https://picsum.photos/seed/newpost/800/400',
    content: '<p>This is a brand new post that just got added!</p>'
  };

  const addRes = await fetch('http://localhost:3002/api/site_bobby/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(newPost)
  });

  const added = await addRes.json();
  console.log('✓ Post added:', added.title);

  const publicRes = await fetch('http://localhost:3002/api/public/site_bobby/posts');
  const posts = await publicRes.json();
  console.log('✓ Total posts now:', posts.length);
}

test();