const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServerInstance = null;
let activeConnectionMode = 'disconnected'; // 'configured_remote' | 'local_host_daemon' | 'embedded_persistent_dev' | 'test_isolated'
let activePersistenceType = 'unknown'; // 'cloud_atlas' | 'local_mongod' | 'local_disk_persistent' | 'ephemeral_memory'

/**
 * Resolve target connection URI based on environment:
 * - Test mode uses isolated test database name (esg_portal_test)
 * - Development/Production uses configured MONGO_URI or default esg_portal
 */
const getTargetURI = () => {
  if (process.env.NODE_ENV === 'test') {
    return process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/esg_portal_test';
  }
  return process.env.MONGO_URI ? process.env.MONGO_URI.trim() : 'mongodb://127.0.0.1:27017/esg_portal';
};

/**
 * Connect to MongoDB with multi-target support and test isolation:
 * 1. Configured MONGO_URI (MongoDB Atlas or external local mongod)
 * 2. Embedded local MongoDB instance with persistent storage for local development
 * 3. Isolated test database (esg_portal_test) during test execution
 */
const connectDB = async () => {
  const targetURI = getTargetURI();
  const isTest = process.env.NODE_ENV === 'test';
  const targetDbName = isTest ? 'esg_portal_test' : 'esg_portal';

  // Event handlers for connection lifecycle
  mongoose.connection.on('connected', () => {
    console.log(`[MongoDB] Verified connection: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name} [Mode: ${activeConnectionMode}]`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[MongoDB] Connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from database.');
    activeConnectionMode = 'disconnected';
  });

  // 1. If pointing to external / cloud Atlas MongoDB
  const isLocalhost = targetURI.includes('127.0.0.1') || targetURI.includes('localhost');
  if (!isLocalhost && targetURI.startsWith('mongodb')) {
    try {
      console.log('[MongoDB] Connecting to external/cloud MongoDB...');
      await mongoose.connect(targetURI, {
        serverSelectionTimeoutMS: 5000,
        dbName: targetDbName,
      });
      activeConnectionMode = isTest ? 'test_isolated' : 'configured_remote';
      activePersistenceType = 'cloud_atlas';
      return true;
    } catch (err) {
      console.error(`[MongoDB] Failed to connect to external MONGO_URI: ${err.message}`);
      activeConnectionMode = 'disconnected';
      return false;
    }
  }

  // 2. Try connecting to local host daemon first (if already running on port 27017)
  try {
    console.log(`[MongoDB] Testing local MongoDB connection: ${targetURI}...`);
    await mongoose.connect(targetURI, {
      serverSelectionTimeoutMS: 1500,
      dbName: targetDbName,
    });
    activeConnectionMode = isTest ? 'test_isolated' : 'local_host_daemon';
    activePersistenceType = 'local_mongod';
    return true;
  } catch (err) {
    console.log('[MongoDB] Host daemon not active on port 27017. Initializing embedded local MongoDB engine with persistent storage...');
  }

  // 3. Fallback: Initialize persistent embedded MongoDB instance
  try {
    const dataDir = isTest
      ? path.resolve(__dirname, '../../data/db_test')
      : path.resolve(__dirname, '../../data/db');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Clean stale lock files if previous process terminated abruptly
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
            dbName: targetDbName,
            storageEngine: 'wiredTiger',
          },
          spawnTimeoutMS: 60000,
        });
        activePersistenceType = 'local_disk_persistent';
      } catch (portErr) {
        console.warn(`[MongoDB] Port 27017 binding issue (${portErr.message}). Assigning dynamic local port...`);
        mongoMemoryServerInstance = await MongoMemoryServer.create({
          instance: {
            dbPath: dataDir,
            dbName: targetDbName,
          },
          spawnTimeoutMS: 60000,
        });
        activePersistenceType = 'local_disk_persistent';
      }
    } catch (persistentErr) {
      console.warn(`[MongoDB] Persistent storage init issue (${persistentErr.message}). Falling back to ephemeral in-memory database...`);
      mongoMemoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbName: targetDbName,
        },
        spawnTimeoutMS: 30000,
      });
      activePersistenceType = 'ephemeral_memory';
    }

    const localUri = mongoMemoryServerInstance.getUri();
    console.log(`[MongoDB] Embedded local MongoDB active at: ${localUri}`);
    await mongoose.connect(localUri, { dbName: targetDbName });
    activeConnectionMode = isTest ? 'test_isolated' : 'embedded_persistent_dev';
    return true;
  } catch (embeddedErr) {
    console.error(`[MongoDB] Critical: Failed to start database: ${embeddedErr.message}`);
    activeConnectionMode = 'disconnected';
    return false;
  }
};

/**
 * Returns exact verified MongoDB state with diagnostic distinction between
 * remote, local host, embedded fallback, and test environments.
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
    mode: isConnected ? activeConnectionMode : 'disconnected',
    persistence: isConnected ? activePersistenceType : 'none',
    isTestEnvironment: process.env.NODE_ENV === 'test',
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
    activeConnectionMode = 'disconnected';
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
