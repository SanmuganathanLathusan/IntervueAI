require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const port = process.env.PORT || 5000;

// Guard against accidentally deploying with the insecure placeholder secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'replace_with_a_long_secret' || JWT_SECRET.length < 32) {
  console.error(
    '[FATAL] JWT_SECRET is missing or insecure. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
  process.exit(1);
}

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`[Server] Listening on http://0.0.0.0:${port}`);
    });

    // Graceful shutdown — needed for Docker, Railway, Render, etc.
    const shutdown = (signal) => {
      console.log(`[Server] ${signal} received — shutting down gracefully`);
      server.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
      });
      // Force-kill after 10s if graceful close stalls
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
};

startServer();

