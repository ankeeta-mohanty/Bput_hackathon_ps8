const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('ESG Reporting Portal - API & Database Test Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Ensure DB connection is active
    await connectDB();
    // Start ephemeral server
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  });

  test('Root endpoint returns portal info', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.phase, 'Phase 1 - Project Setup & Architecture');
  });

  test('GET /api/health returns online status and verified database', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.server, 'online');
    assert.strictEqual(data.database, 'connected');
    assert.ok(data.details);
    assert.strictEqual(data.details.databaseName, 'esg_portal');
  });

  test('GET /api/sites returns project sites array', async () => {
    const res = await fetch(`${baseUrl}/api/sites`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(typeof data.count === 'number');
    assert.ok(Array.isArray(data.data));
  });

  test('GET /api/unknown returns 404 with structured error', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent-route`);
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.message, 'Endpoint not found');
  });
});
