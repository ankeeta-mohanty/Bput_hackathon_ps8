const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const { Group, Subsidiary, ProjectSite, User } = require('../src/models');
const { hashPassword } = require('../src/utils/password');

const DEFAULT_DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Demo@2026!';

const seedData = async () => {
  console.log('====================================================');
  console.log('[Seed Engine] Initiating Database Seeding (Phase 2)...');
  console.log('====================================================');

  const connected = await connectDB();
  if (!connected) {
    console.error('[Seed Engine] Aborting: Failed to connect to MongoDB.');
    process.exit(1);
  }

  try {
    // 1. Seed or find Group (Idempotent)
    let group = await Group.findOne({ code: 'MEIL' });
    if (!group) {
      group = await Group.create({
        name: 'MEIL Group',
        code: 'MEIL',
      });
      console.log(`[Seed Engine] Created Group: ${group.name} (${group.code})`);
    } else {
      console.log(`[Seed Engine] Existing Group found: ${group.name} (${group.code})`);
    }

    // 2. Seed or find Subsidiaries (Idempotent)
    const subsidiaryDefs = [
      { name: 'MEIL Infrastructure Ltd', code: 'MEIL-INFRA', groupId: group._id },
      { name: 'MEIL Energy & Power Ltd', code: 'MEIL-ENERGY', groupId: group._id },
      { name: 'MEIL Water & Utilities Ltd', code: 'MEIL-WATER', groupId: group._id },
    ];

    const subsidiaries = [];
    for (const def of subsidiaryDefs) {
      let sub = await Subsidiary.findOne({ code: def.code });
      if (!sub) {
        sub = await Subsidiary.create(def);
        console.log(`[Seed Engine] Created Subsidiary: ${sub.name} (${sub.code})`);
      } else {
        console.log(`[Seed Engine] Existing Subsidiary found: ${sub.name} (${sub.code})`);
      }
      subsidiaries.push(sub);
    }

    const infraSub = subsidiaries.find((s) => s.code === 'MEIL-INFRA');
    const energySub = subsidiaries.find((s) => s.code === 'MEIL-ENERGY');
    const waterSub = subsidiaries.find((s) => s.code === 'MEIL-WATER');

    // 3. Seed or find Project Sites (Idempotent)
    const siteDefs = [
      {
        name: 'Hyderabad Metro Phase 2 Project',
        code: 'HYD-METRO',
        location: 'Hyderabad, Telangana',
        subsidiaryId: infraSub._id,
      },
      {
        name: 'Zojila Tunnel Construction Site',
        code: 'ZOJILA-TUNNEL',
        location: 'Sonamarg, Jammu & Kashmir',
        subsidiaryId: infraSub._id,
      },
      {
        name: 'Bhadla Solar Power Complex',
        code: 'BHADLA-SOLAR',
        location: 'Phalodi, Rajasthan',
        subsidiaryId: energySub._id,
      },
      {
        name: 'Khandke Wind Farm Facility',
        code: 'KHANDKE-WIND',
        location: 'Ahmednagar, Maharashtra',
        subsidiaryId: energySub._id,
      },
      {
        name: 'Kaleshwaram Lift Irrigation Segment',
        code: 'KLIP-SITE1',
        location: 'Jayashankar Bhupalpally, Telangana',
        subsidiaryId: waterSub._id,
      },
      {
        name: 'Polavaram Bulk Water Treatment Plant',
        code: 'POLAVARAM-WTR',
        location: 'Eluru, Andhra Pradesh',
        subsidiaryId: waterSub._id,
      },
    ];

    const projectSites = [];
    for (const def of siteDefs) {
      let site = await ProjectSite.findOne({ code: def.code });
      if (!site) {
        site = await ProjectSite.create(def);
        console.log(`[Seed Engine] Created Project Site: ${site.name} (${site.code})`);
      } else {
        console.log(`[Seed Engine] Existing Project Site found: ${site.name} (${site.code})`);
      }
      projectSites.push(site);
    }

    const hydMetroSite = projectSites.find((s) => s.code === 'HYD-METRO');
    const zojilaSite = projectSites.find((s) => s.code === 'ZOJILA-TUNNEL');

    // 4. Seed or reconcile Demo Users (Idempotent)
    console.log('[Seed Engine] Seeding Demo Role Accounts...');
    const hashedDemoPassword = await hashPassword(DEFAULT_DEMO_PASSWORD);

    const demoUsers = [
      {
        name: 'Vikram Sharma (Site Manager)',
        email: 'site.manager@meil.demo',
        role: 'SITE_MANAGER',
        groupId: group._id,
        subsidiaryId: infraSub._id,
        siteIds: [hydMetroSite._id, zojilaSite._id],
      },
      {
        name: 'Priya Nair (Subsidiary ESG Manager)',
        email: 'subsidiary.manager@meil.demo',
        role: 'SUBSIDIARY_ESG_MANAGER',
        groupId: group._id,
        subsidiaryId: infraSub._id,
        siteIds: [],
      },
      {
        name: 'Arjun Mehta (Group ESG Executive)',
        email: 'group.executive@meil.demo',
        role: 'GROUP_ESG_EXECUTIVE',
        groupId: group._id,
        subsidiaryId: null,
        siteIds: [],
      },
    ];

    for (const userDef of demoUsers) {
      let existingUser = await User.findOne({ email: userDef.email });
      if (!existingUser) {
        const newUser = await User.create({
          ...userDef,
          passwordHash: hashedDemoPassword,
          isActive: true,
          isDevelopmentAccount: true,
        });
        console.log(`[Seed Engine] Created Demo User: ${newUser.email} [${newUser.role}]`);
      } else {
        // Ensure organizational references and demo credentials match current configuration
        existingUser.name = userDef.name;
        existingUser.role = userDef.role;
        existingUser.groupId = userDef.groupId;
        existingUser.subsidiaryId = userDef.subsidiaryId;
        existingUser.siteIds = userDef.siteIds;
        existingUser.passwordHash = hashedDemoPassword;
        existingUser.isActive = true;
        existingUser.isDevelopmentAccount = true;
        await existingUser.save();
        console.log(`[Seed Engine] Reconciled Demo User: ${existingUser.email} [${existingUser.role}]`);
      }
    }

    console.log('====================================================');
    console.log('[Seed Engine] Seeding Completed Successfully!');
    console.log(`Summary: 1 Group | ${subsidiaries.length} Subsidiaries | ${projectSites.length} Sites | 3 Demo Users`);
    console.log(`Default Demo Password: ${DEFAULT_DEMO_PASSWORD}`);
    console.log('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Engine] Seeding failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

seedData();
