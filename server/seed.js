require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Post = require('./src/models/Post');
const TeamMember = require('./src/models/TeamMember');
const Faq = require('./src/models/Faq');

const MONGODB_URI = process.env.MONGODB_URI + '/bobby';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await TeamMember.deleteMany({});
    await Faq.deleteMany({});

    // Create user (no hashing for now)
    console.log('Creating user...');
    const user = await User.create({
      username: 'bobby',
      password_hash: 'password123', // TODO: hash this later
      db_name: 'bobby'
    });
    console.log('✓ User created:', user.username);

    // Create posts
    console.log('Creating posts...');
    const posts = await Post.insertMany([
      {
        title: 'Why I Switched to a Standing Desk',
        content: '<h2>Health Benefits</h2><p>After years of back pain I finally made the switch to a standing desk and it changed my life completely.</p>',
        image_url: 'https://picsum.photos/seed/desk/800/400',
        author: 'Bobby',
        slug: 'standing-desk',
      },
      {
        title: 'My Favorite Productivity Tools in 2026',
        content: '<h2>Essential Apps</h2><p>Here are the tools I use every day to stay productive and organized.</p>',
        image_url: 'https://picsum.photos/seed/tools/800/400',
        author: 'Bobby',
        slug: 'productivity-tools',
      },
      {
        title: 'Building a Lean CMS for Clients',
        content: '<h2>Lessons Learned</h2><p>We built StupidCMS from scratch to be simple and cost-effective for small sites.</p>',
        image_url: 'https://picsum.photos/seed/cms/800/400',
        author: 'Bobby',
        slug: 'lean-cms',
      },
    ]);
    console.log(`✓ Created ${posts.length} posts`);

    // Create team members
    console.log('Creating team members...');
    const team = await TeamMember.insertMany([
      {
        name: 'Bobby Smith',
        slug: 'bobby-smith',
        role: 'CEO',
        company: 'Bobby Inc.',
        linkedin: 'https://linkedin.com/in/bobby',
        image_url: 'https://picsum.photos/seed/bobby/200/200',
        bio: '<strong>Bobby Smith</strong> is the founder and CEO. He loves building lean products.',
      },
      {
        name: 'Sarah Johnson',
        slug: 'sarah-johnson',
        role: 'Lead Developer',
        company: 'Bobby Inc.',
        linkedin: 'https://linkedin.com/in/sarah-johnson',
        image_url: 'https://picsum.photos/seed/sarah/200/200',
        bio: '<strong>Sarah</strong> leads our development team and loves Node.js.',
      },
      {
        name: 'David Chen',
        slug: 'david-chen',
        role: 'Designer',
        company: 'Bobby Inc.',
        linkedin: 'https://linkedin.com/in/davidchen',
        image_url: 'https://picsum.photos/seed/david/200/200',
        bio: '<strong>David</strong> designs everything beautiful. Tailwind lover.',
      },
    ]);
    console.log(`✓ Created ${team.length} team members`);

    // Create FAQ items
    console.log('Creating FAQ items...');
    const faq = await Faq.insertMany([
      {
        question: 'How do I create a new blog post?',
        slug: 'create-blog-post',
        answer: '<p>Click the "+ New Post" button on the dashboard. Fill in the title, content, and image. Hit save!</p>',
      },
      {
        question: 'Can I change the site language to RTL?',
        slug: 'rtl-support',
        answer: '<p>Yes! Go to Dashboard → Website Settings and select RTL. This applies to Hebrew, Arabic, and other RTL languages.</p>',
      },
    ]);
    console.log(`✓ Created ${faq.length} FAQ items`);

    console.log('\n✅ Seeding complete!');
    console.log(`   User: bobby / password123`);
    console.log(`   Database: bobby`);
    console.log(`   Posts: ${posts.length}`);
    console.log(`   Team: ${team.length}`);
    console.log(`   FAQ: ${faq.length}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
