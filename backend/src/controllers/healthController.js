const { getDBStatus } = require('../config/db');

/**
 * GET /api/health
 * Verifies real backend server and MongoDB status.
 */
const getHealthStatus = (req, res) => {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus.isConnected;

  const payload = {
    success: isHealthy,
    server: 'online',
    database: isHealthy ? 'connected' : 'disconnected',
    details: {
      portal: 'Corporate ESG Reporting Portal API',
      version: '1.0.0 (Phase 1)',
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      databaseHost: dbStatus.host,
      databasePort: dbStatus.port,
      databaseName: dbStatus.name,
      readyState: dbStatus.state,
    },
  };

  // If database is disconnected, return 503 with success: false
  if (!isHealthy) {
    return res.status(503).json(payload);
  }

  return res.status(200).json(payload);
};

module.exports = { getHealthStatus };
