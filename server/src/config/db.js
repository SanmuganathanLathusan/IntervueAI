const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  // Already connected — reuse the existing connection (important for hot-reload in dev)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000, // Fail fast instead of hanging forever
    maxPoolSize: 10,                 // Sensible connection pool for Atlas free tier
  });

  // Log connection events for easier debugging
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from database');
  });

  console.log('[MongoDB] Connected successfully');
  return mongoose.connection;
};

module.exports = connectDB;
