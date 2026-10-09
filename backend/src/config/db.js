const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServerInstance = null;

/**
 * Connect to MongoDB with support for:
 * 1. Configured MONGO_URI (MongoDB Atlas or external local mongod)
 * 2. Embedded local MongoDB instance with persistent storage for local development
 */
const connectDB = async () => {
  const targetURI = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : 'mongodb://127.0.0.1:27017/esg_portal';

  // Event handlers for connection lifecycle
  mongoose.connection.on('connected', () => {
    console.log(`[MongoDB] Verified connection: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[MongoDB] Connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from database.');
  });

  // 1. If pointing to external / cloud Atlas MongoDB
  const isLocalhost = targetURI.includes('127.0.0.1') || targetURI.includes('localhost');
  if (!isLocalhost && targetURI.startsWith('mongodb')) {
    try {
      console.log('[MongoDB] Connecting to external/cloud MongoDB...');
      await mongoose.connect(targetURI, {
        serverSelectionTimeoutMS: 5000,
      });
      return true;
    } catch (err) {
      console.error(`[MongoDB] Failed to connect to MONGO_URI: ${err.message}`);
      return false;
    }
  }

  // 2. Try connecting to local host daemon first (if already running)
  try {
    console.log(`[MongoDB] Testing local MongoDB connection: ${targetURI}...`);
    await mongoose.connect(targetURI, {
      serverSelectionTimeoutMS: 1500,
    });
    return true;
  } catch (err) {
    console.log('[MongoDB] Host daemon not active on port 27017. Initializing embedded local MongoDB engine with persistent storage...');
  }

  // 3. Fallback: Initialize persistent embedded MongoDB instance
  try {
    const dataDir = path.resolve(__dirname, '../../data/db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Clean stale lock files if any previous process terminated abruptly
    const lockFiles = ['mongod.lock', 'WiredTiger.lock'];
    for (const lockFile of lockFiles) {
      const fullPath = path.join(dataDir, lockFile);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (_) {}
      }
    }

    // Try binding to persistent directory first
    try {
      try {
        mongoMemoryServerInstance = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbPath: dataDir,
            dbName: 'esg_portal',
            storageEngine: 'wiredTiger',
          },
          spawnTimeoutMS: 60000,
        });
      } catch (portErr) {
        console.warn(`[MongoDB] Port 27017 binding issue (${portErr.message}). Assigning dynamic local port...`);
        mongoMemoryServerInstance = await MongoMemoryServer.create({
          instance: {
            dbPath: dataDir,
            dbName: 'esg_portal',
          },
          spawnTimeoutMS: 60000,
        });
      }
    } catch (persistentErr) {
      console.warn(`[MongoDB] Persistent storage init issue (${persistentErr.message}). Falling back to ephemeral in-memory database...`);
      mongoMemoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'esg_portal',
        },
        spawnTimeoutMS: 30000,
      });
    }

    const localUri = mongoMemoryServerInstance.getUri();
    console.log(`[MongoDB] Embedded local MongoDB active at: ${localUri}`);
    await mongoose.connect(localUri, { dbName: 'esg_portal' });
    return true;
  } catch (embeddedErr) {
    console.error(`[MongoDB] Critical: Failed to start database: ${embeddedErr.message}`);
    return false;
  }
};

/**
 * Returns exact verified MongoDB state
 */
const getDBStatus = () => {
  const readyState = mongoose.connection.readyState;
  const isConnected = readyState === 1;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    state: states[readyState] || 'unknown',
    isConnected,
    host: isConnected ? mongoose.connection.host : null,
    port: isConnected ? mongoose.connection.port : null,
    name: isConnected ? mongoose.connection.name : null,
  };
};

/**
 * Disconnect helper for graceful shutdown and test isolation
 */
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
      mongoMemoryServerInstance = null;
    }
    console.log('[MongoDB] Gracefully disconnected.');
  } catch (err) {
    console.error('[MongoDB] Error during disconnection:', err.message);
  }
};

module.exports = {
  connectDB,
  getDBStatus,
  disconnectDB,
};
