require('dotenv').config();
const mongoose = require('mongoose');
// const { ApolloServer } = require('@apollo/server');
// const { startStandaloneServer } = require('@apollo/server/standalone');

// Models
const User = require('./src/models/User');
const Post = require('./src/models/Post');
const TeamMember = require('./src/models/TeamMember');
const Faq = require('./src/models/Faq');

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

// TODO: GraphQL schema and resolvers will go here

async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected');

    // TODO: Start Apollo Server
    console.log(`Server would start on http://localhost:${PORT}`);
  } catch (error) {
    console.error('Server error:', error);
    process.exit(1);
  }
}

startServer();
