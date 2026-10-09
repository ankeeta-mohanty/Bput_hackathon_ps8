require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server Error] Port ${PORT} is already in use by another process.`);
    console.error(`[Server Error] Please close any application listening on port ${PORT} or configure a different PORT in .env.`);
    process.exit(1);
  } else {
    console.error('[Server Error]', err.message);
  }
});

const startServer = async () => {
  // Initialize MongoDB connection
  await connectDB();

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`ESG Reporting Portal Backend (Phase 1)`);
    console.log(`Server listening on: http://localhost:${PORT}`);
    console.log(`Health Check:        http://localhost:${PORT}/api/health`);
    console.log(`Sites API:           http://localhost:${PORT}/api/sites`);
    console.log(`Environment:         ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
};

startServer();

// Graceful shutdown handling
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[Server] ${signal} signal received. Initiating graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP listener closed.');
    await disconnectDB();
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
