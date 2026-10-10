const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { connectDB, disconnectDB } = require('../src/config/db');
const { User, Group, Subsidiary, ProjectSite } = require('../src/models');
const { hashPassword } = require('../src/utils/password');

/**
 * Account Provisioning CLI Script
 * Usage:
 * node scripts/createUser.js --name "Alice" --email "alice@company.com" --role "SITE_MANAGER" --password "SecurePass!123" --groupCode "MEIL" --subCode "MEIL-INFRA" --siteCode "HYD-METRO"
 */
const run = async () => {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    params[key] = args[i + 1];
  }

  const { name, email, role, password, groupCode, subCode, siteCode } = params;

  if (!name || !email || !role || !password) {
    console.error('Usage: node scripts/createUser.js --name "..." --email "..." --role "SITE_MANAGER|SUBSIDIARY_ESG_MANAGER|GROUP_ESG_EXECUTIVE" --password "..." [--groupCode "..."] [--subCode "..."] [--siteCode "..."]');
    process.exit(1);
  }

  const allowedRoles = ['SITE_MANAGER', 'SUBSIDIARY_ESG_MANAGER', 'GROUP_ESG_EXECUTIVE'];
  if (!allowedRoles.includes(role)) {
    console.error(`Invalid role. Permitted: ${allowedRoles.join(', ')}`);
    process.exit(1);
  }

  await connectDB();

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      console.error(`Error: User with email ${email} already exists.`);
      await disconnectDB();
      process.exit(1);
    }

    // Resolve group
    const group = groupCode ? await Group.findOne({ code: groupCode }) : await Group.findOne();
    if (!group) {
      console.error('Error: Group record not found. Please seed or register a group first.');
      await disconnectDB();
      process.exit(1);
    }

    let subsidiaryId = null;
    let siteIds = [];

    if (role === 'SUBSIDIARY_ESG_MANAGER' || role === 'SITE_MANAGER') {
      const sub = subCode ? await Subsidiary.findOne({ code: subCode, groupId: group._id }) : await Subsidiary.findOne({ groupId: group._id });
      if (!sub) {
        console.error('Error: Subsidiary record not found.');
        await disconnectDB();
        process.exit(1);
      }
      subsidiaryId = sub._id;

      if (role === 'SITE_MANAGER') {
        const site = siteCode ? await ProjectSite.findOne({ code: siteCode, subsidiaryId: sub._id }) : await ProjectSite.findOne({ subsidiaryId: sub._id });
        if (!site) {
          console.error('Error: Project site record not found.');
          await disconnectDB();
          process.exit(1);
        }
        siteIds = [site._id];
      }
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      groupId: group._id,
      subsidiaryId,
      siteIds,
      isActive: true,
      isDevelopmentAccount: false,
    });

    console.log('====================================================');
    console.log('[Account Provisioning] Successfully created account:');
    console.log(`ID:      ${user._id}`);
    console.log(`Name:    ${user.name}`);
    console.log(`Email:   ${user.email}`);
    console.log(`Role:    ${user.role}`);
    console.log('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Provisioning failed:', err.message);
    await disconnectDB();
    process.exit(1);
  }
};

run();
