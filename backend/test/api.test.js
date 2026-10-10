const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_node_testing_2026';
process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { Group, Subsidiary, ProjectSite, User, ESGSubmission } = require('../src/models');
const { hashPassword, verifyPassword } = require('../src/utils/password');
const { generateToken } = require('../src/utils/token');

describe('ESG Reporting Portal - Phase 2 Comprehensive Test Suite', () => {
  let server;
  let baseUrl;

  // Shared seeded entities for tests
  let testGroup;
  let anotherGroup;
  let sub1;
  let sub2;
  let site1;
  let site2;
  let site3;
  let siteManagerUser;
  let subsidiaryManagerUser;
  let groupExecutiveUser;
  let inactiveUser;

  let siteManagerToken;
  let subsidiaryManagerToken;
  let groupExecutiveToken;

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

    // Populate isolated test records
    await ESGSubmission.deleteMany({});
    await User.deleteMany({});
    await ProjectSite.deleteMany({});
    await Subsidiary.deleteMany({});
    await Group.deleteMany({});

    testGroup = await Group.create({ name: 'Test Group MEIL', code: 'TG-MEIL' });
    anotherGroup = await Group.create({ name: 'Another External Group', code: 'EXT-GRP' });

    sub1 = await Subsidiary.create({
      name: 'Test Infra Subsidiary',
      code: 'SUB-INFRA',
      groupId: testGroup._id,
    });

    sub2 = await Subsidiary.create({
      name: 'Test Energy Subsidiary',
      code: 'SUB-ENERGY',
      groupId: testGroup._id,
    });

    const extSub = await Subsidiary.create({
      name: 'External Subsidiary',
      code: 'EXT-SUB',
      groupId: anotherGroup._id,
    });

    site1 = await ProjectSite.create({
      name: 'Site Metro Alpha',
      code: 'SITE-ALPHA',
      location: 'Hyderabad',
      subsidiaryId: sub1._id,
    });

    site2 = await ProjectSite.create({
      name: 'Site Tunnel Beta',
      code: 'SITE-BETA',
      location: 'Kashmir',
      subsidiaryId: sub1._id,
    });

    site3 = await ProjectSite.create({
      name: 'Site Solar Gamma',
      code: 'SITE-GAMMA',
      location: 'Rajasthan',
      subsidiaryId: sub2._id,
    });

    const defaultHash = await hashPassword('TestPass@123');

    // 1. Site Manager assigned only to site1
    siteManagerUser = await User.create({
      name: 'Test Site Manager',
      email: 'site.manager@test.demo',
      passwordHash: defaultHash,
      role: 'SITE_MANAGER',
      groupId: testGroup._id,
      subsidiaryId: sub1._id,
      siteIds: [site1._id],
      isActive: true,
    });

    // 2. Subsidiary Manager assigned to sub1
    subsidiaryManagerUser = await User.create({
      name: 'Test Sub Manager',
      email: 'sub.manager@test.demo',
      passwordHash: defaultHash,
      role: 'SUBSIDIARY_ESG_MANAGER',
      groupId: testGroup._id,
      subsidiaryId: sub1._id,
      siteIds: [],
      isActive: true,
    });

    // 3. Group Executive assigned to testGroup
    groupExecutiveUser = await User.create({
      name: 'Test Group Executive',
      email: 'group.exec@test.demo',
      passwordHash: defaultHash,
      role: 'GROUP_ESG_EXECUTIVE',
      groupId: testGroup._id,
      subsidiaryId: null,
      siteIds: [],
      isActive: true,
    });

    // 4. Inactive user
    inactiveUser = await User.create({
      name: 'Inactive User',
      email: 'inactive@test.demo',
      passwordHash: defaultHash,
      role: 'SITE_MANAGER',
      groupId: testGroup._id,
      subsidiaryId: sub1._id,
      siteIds: [site1._id],
      isActive: false,
    });

    siteManagerToken = generateToken({ id: siteManagerUser._id });
    subsidiaryManagerToken = generateToken({ id: subsidiaryManagerUser._id });
    groupExecutiveToken = generateToken({ id: groupExecutiveUser._id });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  });

  // ==========================================
  // REGRESSION TESTS (Phase 1 Baseline)
  // ==========================================
  describe('Regression Tests', () => {
    test('29. GET /api/health still works and reports database status', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.server, 'online');
      assert.strictEqual(data.database, 'connected');
      assert.ok(data.details);
    });

    test('30. GET /api/sites works with correct authorization (protected)', async () => {
      const res = await fetch(`${baseUrl}/api/sites`, {
        headers: { Authorization: `Bearer ${siteManagerToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.count, 1);
      assert.strictEqual(data.data[0].code, 'SITE-ALPHA');
    });

    test('31. Root endpoint GET / returns portal info', async () => {
      const res = await fetch(`${baseUrl}/`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.message, 'Corporate ESG Reporting Portal API is active');
    });

    test('32. Non-existent route returns 404 with structured error', async () => {
      const res = await fetch(`${baseUrl}/api/nonexistent-route-test`);
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Endpoint not found');
    });
  });

  // ==========================================
  // DATA MODELS TESTS
  // ==========================================
  describe('Data Models & Schema Validations', () => {
    test('22. User role validation rejects invalid enum values', async () => {
      const invalidUser = new User({
        name: 'Invalid User',
        email: 'invalid.role@test.demo',
        passwordHash: 'hash123',
        role: 'SUPER_ADMIN_INVALID',
        groupId: testGroup._id,
      });

      let err;
      try {
        await invalidUser.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err, 'Expected validation error for invalid role');
      assert.ok(err.errors.role);
    });

    test('23. Email uniqueness rejects duplicate email addresses', async () => {
      const dupUser = new User({
        name: 'Duplicate Site Manager',
        email: 'site.manager@test.demo', // Already exists
        passwordHash: 'hash123',
        role: 'SITE_MANAGER',
        groupId: testGroup._id,
        subsidiaryId: sub1._id,
        siteIds: [site1._id],
      });

      let err;
      try {
        await dupUser.save();
      } catch (e) {
        err = e;
      }
      assert.ok(err, 'Expected duplicate key error');
      assert.strictEqual(err.code, 11000);
    });

    test('24. Invalid organizational references rejected by User model validation', async () => {
      // SITE_MANAGER requires subsidiaryId and non-empty siteIds
      const invalidSiteMgr = new User({
        name: 'Incomplete Site Manager',
        email: 'incomplete.sitemgr@test.demo',
        passwordHash: 'hash123',
        role: 'SITE_MANAGER',
        groupId: testGroup._id,
        siteIds: [], // Empty siteIds must be rejected
      });

      let err;
      try {
        await invalidSiteMgr.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err, 'Expected validation error for missing siteIds and subsidiaryId');
    });

    test('25. ESGSubmission required-field validation', async () => {
      const emptySubmission = new ESGSubmission({});
      let err;
      try {
        await emptySubmission.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err, 'Expected validation error for required fields');
      assert.ok(err.errors.siteId);
      assert.ok(err.errors.subsidiaryId);
      assert.ok(err.errors.groupId);
      assert.ok(err.errors.reportingPeriod);
      assert.ok(err.errors.reportingYear);
      assert.ok(err.errors.createdBy);
    });

    test('26. Invalid status rejection on ESGSubmission', async () => {
      const invalidStatusSubmission = new ESGSubmission({
        siteId: site1._id,
        subsidiaryId: sub1._id,
        groupId: testGroup._id,
        reportingPeriod: 'Q1',
        reportingYear: 2025,
        status: 'RANDOM_STATUS_INVALID',
        createdBy: siteManagerUser._id,
      });

      let err;
      try {
        await invalidStatusSubmission.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err, 'Expected validation error for invalid status enum');
      assert.ok(err.errors.status);
    });

    test('27. Inconsistent site/subsidiary relationship rejection', async () => {
      // site3 belongs to sub2, but we pass sub1 as subsidiaryId
      const mismatchedSubmission = new ESGSubmission({
        siteId: site3._id,
        subsidiaryId: sub1._id, // Mismatch!
        groupId: testGroup._id,
        reportingPeriod: 'Q1',
        reportingYear: 2025,
        createdBy: siteManagerUser._id,
      });

      let err;
      try {
        await mismatchedSubmission.save();
      } catch (e) {
        err = e;
      }
      assert.ok(err, 'Expected error on hierarchy mismatch');
      assert.ok(err.message.includes('Hierarchy mismatch'));
    });

    test('28. Duplicate submission behavior follows the documented uniqueness policy', async () => {
      const subDoc1 = new ESGSubmission({
        siteId: site1._id,
        subsidiaryId: sub1._id,
        groupId: testGroup._id,
        reportingPeriod: 'FY2025-Q1',
        reportingYear: 2025,
        version: 1,
        createdBy: siteManagerUser._id,
      });
      await subDoc1.save();

      // Attempting exact same (siteId, reportingYear, reportingPeriod, version: 1)
      const subDocDuplicate = new ESGSubmission({
        siteId: site1._id,
        subsidiaryId: sub1._id,
        groupId: testGroup._id,
        reportingPeriod: 'FY2025-Q1',
        reportingYear: 2025,
        version: 1,
        createdBy: siteManagerUser._id,
      });

      let err;
      try {
        await subDocDuplicate.save();
      } catch (e) {
        err = e;
      }
      assert.ok(err, 'Expected duplicate key error for same version of submission');
      assert.strictEqual(err.code, 11000);

      // Creating a new revision (version: 2) for deliberate revisions is permitted
      const subDocRevision = new ESGSubmission({
        siteId: site1._id,
        subsidiaryId: sub1._id,
        groupId: testGroup._id,
        reportingPeriod: 'FY2025-Q1',
        reportingYear: 2025,
        version: 2,
        createdBy: siteManagerUser._id,
      });
      const savedRevision = await subDocRevision.save();
      assert.strictEqual(savedRevision.version, 2);
    });
  });

  // ==========================================
  // AUTHENTICATION TESTS
  // ==========================================
  describe('Authentication APIs & Token Handling', () => {
    test('1. Successful login returns JWT token and safe user payload', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'site.manager@test.demo',
          password: 'TestPass@123',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.token);
      assert.ok(data.user);
      assert.strictEqual(data.user.email, 'site.manager@test.demo');
      assert.strictEqual(data.user.role, 'SITE_MANAGER');
      assert.strictEqual(data.user.passwordHash, undefined);
    });

    test('2. Incorrect password returns 401 generic error', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'site.manager@test.demo',
          password: 'WrongPassword!',
        }),
      });

      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Invalid email or password.');
    });

    test('3. Unknown email returns 401 generic error', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent.user@test.demo',
          password: 'TestPass@123',
        }),
      });

      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Invalid email or password.');
    });

    test('4. Missing email returns 400 validation error', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'TestPass@123' }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Email'));
    });

    test('5. Missing password returns 400 validation error', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'site.manager@test.demo' }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Password'));
    });

    test('6. Invalid request payload returns 400', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    test('7. Inactive user login returns 403 deactivated error', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'inactive@test.demo',
          password: 'TestPass@123',
        }),
      });

      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('deactivated'));
    });

    test('8. Password hash verification confirms bcrypt hashing', async () => {
      const valid = await verifyPassword('TestPass@123', siteManagerUser.passwordHash);
      assert.strictEqual(valid, true);

      const invalid = await verifyPassword('WrongPassword', siteManagerUser.passwordHash);
      assert.strictEqual(invalid, false);
    });

    test('9. Password hash is never returned by login or user serialization', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'site.manager@test.demo',
          password: 'TestPass@123',
        }),
      });
      const data = await res.json();
      assert.strictEqual(data.user.passwordHash, undefined);

      const jsonUser = siteManagerUser.toJSON();
      assert.strictEqual(jsonUser.passwordHash, undefined);
    });

    test('10. Current-user endpoint GET /api/auth/me returns authenticated profile', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${siteManagerToken}` },
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.email, 'site.manager@test.demo');
      assert.strictEqual(data.user.role, 'SITE_MANAGER');
      assert.strictEqual(data.user.passwordHash, undefined);
    });

    test('11. Missing token on protected endpoint returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Authorization token required'));
    });

    test('12. Invalid token returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: 'Bearer this.is.an.invalid.token' },
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Invalid'));
    });

    test('13. Expired token returns 401 session expired', async () => {
      const expiredToken = generateToken(
        { id: siteManagerUser._id },
        { expiresIn: '-1s' }
      );
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('expired'));
    });

    test('14. Logout endpoint POST /api/auth/logout succeeds with instructions', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.message.includes('Logged out'));
    });
  });

  // ==========================================
  // AUTHORIZATION & RBAC TESTS
  // ==========================================
  describe('Role-Based Authorization & Organizational Scoping', () => {
    test('15. Site Manager can access an assigned site', async () => {
      const res = await fetch(`${baseUrl}/api/sites?siteId=${site1._id}`, {
        headers: { Authorization: `Bearer ${siteManagerToken}` },
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.count, 1);
      assert.strictEqual(data.data[0].code, 'SITE-ALPHA');
    });

    test('16. Site Manager cannot access an unrelated site', async () => {
      // site2 is not in siteManagerUser's siteIds
      const res = await fetch(`${baseUrl}/api/sites?siteId=${site2._id}`, {
        headers: { Authorization: `Bearer ${siteManagerToken}` },
      });

      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('outside your authorized'));
    });

    test('17. Subsidiary Manager can access sites within their subsidiary', async () => {
      // sub1 contains site1 and site2
      const res = await fetch(`${baseUrl}/api/sites`, {
        headers: { Authorization: `Bearer ${subsidiaryManagerToken}` },
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.count, 2);
      const codes = data.data.map((s) => s.code);
      assert.ok(codes.includes('SITE-ALPHA'));
      assert.ok(codes.includes('SITE-BETA'));
      assert.ok(!codes.includes('SITE-GAMMA')); // site3 is in sub2
    });

    test('18. Subsidiary Manager cannot access another subsidiary site', async () => {
      // site3 is in sub2, while manager is assigned to sub1
      const res = await fetch(`${baseUrl}/api/sites?siteId=${site3._id}`, {
        headers: { Authorization: `Bearer ${subsidiaryManagerToken}` },
      });

      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('outside your authorized'));
    });

    test('19. Group Executive cannot access an unrelated group site', async () => {
      // Create external site in anotherGroup
      const extSub = await Subsidiary.findOne({ groupId: anotherGroup._id });
      const extSite = await ProjectSite.create({
        name: 'External Site Out-of-Group',
        code: 'EXT-SITE-99',
        location: 'Mumbai',
        subsidiaryId: extSub._id,
      });

      // Group Executive in testGroup accesses all sites in testGroup (site1, site2, site3)
      const resAll = await fetch(`${baseUrl}/api/sites`, {
        headers: { Authorization: `Bearer ${groupExecutiveToken}` },
      });
      assert.strictEqual(resAll.status, 200);
      const allData = await resAll.json();
      assert.strictEqual(allData.count, 3);

      // But trying to access extSite outside testGroup is rejected with 403
      const resExt = await fetch(`${baseUrl}/api/sites?siteId=${extSite._id}`, {
        headers: { Authorization: `Bearer ${groupExecutiveToken}` },
      });
      assert.strictEqual(resExt.status, 403);
    });

    test('20. Client-supplied role changes do not grant privileges', async () => {
      // Crafting a fake token with altered claims does nothing because requireAuth loads fresh user from MongoDB
      const fakeToken = generateToken({
        id: siteManagerUser._id,
        role: 'GROUP_ESG_EXECUTIVE', // Attempted role escalation in claims
      });

      const res = await fetch(`${baseUrl}/api/sites`, {
        headers: { Authorization: `Bearer ${fakeToken}` },
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      // Even though token had fake claim, server evaluated live user role as SITE_MANAGER
      assert.strictEqual(data.scope, 'SITE_MANAGER');
      assert.strictEqual(data.count, 1);
    });

    test('21. Inactive users cannot continue using protected endpoints', async () => {
      const tokenForInactive = generateToken({ id: inactiveUser._id });

      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tokenForInactive}` },
      });

      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('deactivated'));
    });
  });

  // ==========================================
  // ENVIRONMENTAL CALCULATIONS TESTS
  // ==========================================
  describe('Environmental Calculation Engine', () => {
    const { calculateESGMetrics } = require('../src/calculations/emissionEngine');

    test('33. Accurate Scope 1 diesel emissions calculated using documented IPCC factor', () => {
      // 10,000 Litres diesel * 0.00268 tCO2e/L = 26.8 tCO2e
      const metrics = calculateESGMetrics({
        energy: { dieselLitres: 10000, electricityKWh: 0 },
      });
      assert.strictEqual(metrics.emissions.scope1DieselTCO2e, 26.8);
      assert.strictEqual(metrics.emissions.totalScope1TCO2e, 26.8);
      assert.ok(metrics.emissions.factorsApplied.diesel);
      assert.strictEqual(metrics.emissions.factorsApplied.diesel.factorValue, 0.00268);
    });

    test('34. Accurate Scope 2 electricity emissions calculated using CEA India factor', () => {
      // 50,000 kWh * 0.000716 tCO2e/kWh = 35.8 tCO2e
      const metrics = calculateESGMetrics({
        energy: { electricityKWh: 50000 },
      });
      assert.strictEqual(metrics.emissions.scope2ElectricityTCO2e, 35.8);
      assert.strictEqual(metrics.emissions.totalGHGTCO2e, 35.8);
      assert.strictEqual(metrics.emissions.factorsApplied.gridElectricity.factorValue, 0.000716);
    });

    test('35. Waste recycling rate handles zero and positive denominators safely', () => {
      // 20 MT hazardous + 80 MT non-haz = 100 MT total. 40 MT recycled = 40%
      const metrics = calculateESGMetrics({
        waste: { hazardousWasteMT: 20, nonHazardousWasteMT: 80, recycledWasteMT: 40 },
      });
      assert.strictEqual(metrics.waste.totalWasteGeneratedMT, 100);
      assert.strictEqual(metrics.waste.wasteRecyclingRatePct, 40);

      // Zero waste generated should not throw NaN or division by zero
      const zeroWaste = calculateESGMetrics({
        waste: { hazardousWasteMT: 0, nonHazardousWasteMT: 0, recycledWasteMT: 0 },
      });
      assert.strictEqual(zeroWaste.waste.totalWasteGeneratedMT, 0);
      assert.strictEqual(zeroWaste.waste.wasteRecyclingRatePct, 0);
    });

    test('36. Net water consumption computed safely', () => {
      // 1000 kL withdrawal - 400 kL discharge = 600 kL consumption
      const metrics = calculateESGMetrics({
        water: { withdrawalKL: 1000, dischargeKL: 400 },
      });
      assert.strictEqual(metrics.water.netWaterConsumptionKL, 600);
    });
  });

  // ==========================================
  // ESG SUBMISSIONS & ROLLUP WORKFLOW TESTS
  // ==========================================
  describe('ESG Submissions Lifecycle & Group Rollup Workflow', () => {
    let createdSubmissionId;

    test('37. Site Manager creates and saves valid ESG draft', async () => {
      const res = await fetch(`${baseUrl}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${siteManagerToken}`,
        },
        body: JSON.stringify({
          siteId: site1._id,
          reportingYear: 2025,
          reportingPeriod: 'Q1',
          rawMetrics: {
            energy: { electricityKWh: 20000, dieselLitres: 5000 },
            water: { withdrawalKL: 500, dischargeKL: 200 },
            waste: { hazardousWasteMT: 5, nonHazardousWasteMT: 20, recycledWasteMT: 10 },
            social: { totalEmployees: 100, femaleEmployees: 35, fatalities: 0, lostTimeInjuries: 1 },
          },
          dataProvenance: {
            evidenceNotes: 'Monthly verified diesel meter logs and utility bills',
          },
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.status, 'DRAFT');
      assert.ok(data.data.calculatedMetrics.emissions.totalGHGTCO2e > 0);
      createdSubmissionId = data.data._id;
    });

    test('38. Reject negative values with 400 validation error', async () => {
      const res = await fetch(`${baseUrl}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${siteManagerToken}`,
        },
        body: JSON.stringify({
          siteId: site1._id,
          reportingYear: 2025,
          reportingPeriod: 'Q2',
          rawMetrics: {
            energy: { dieselLitres: -500 }, // Negative number is prohibited
          },
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.errors.some((e) => e.includes('negative')));
    });

    test('39. Site Manager submits draft for subsidiary review', async () => {
      const res = await fetch(`${baseUrl}/api/submissions/${createdSubmissionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${siteManagerToken}`,
        },
        body: JSON.stringify({ comments: 'Submitting Q1 final verified numbers' }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.status, 'SUBMITTED');
      assert.ok(data.data.submittedAt);
    });

    test('40. Subsidiary Manager reviews and approves submission', async () => {
      const res = await fetch(`${baseUrl}/api/submissions/${createdSubmissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${subsidiaryManagerToken}`,
        },
        body: JSON.stringify({
          decision: 'APPROVE',
          comments: 'Cross-verified with invoices; approved for group consolidation',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.status, 'APPROVED');
      assert.strictEqual(data.data.reviewComments, 'Cross-verified with invoices; approved for group consolidation');
    });

    test('41. Group Executive retrieves live group rollup computed from approved submissions', async () => {
      const res = await fetch(`${baseUrl}/api/analytics/group-rollup?year=2025&period=Q1`, {
        headers: { Authorization: `Bearer ${groupExecutiveToken}` },
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.approvedSubmissionsCount, 1);
      assert.ok(data.conglomerateTotals.emissions.totalGHGTCO2e > 0);
      assert.strictEqual(data.conglomerateTotals.water.netConsumptionKL, 300); // 500 - 200
      assert.strictEqual(data.conglomerateTotals.social.totalWorkforce, 100);
      assert.strictEqual(data.conglomerateTotals.social.femaleDiversityPct, 35);
      assert.strictEqual(data.completeness.status, 'In Progress');
    });
  });
});
