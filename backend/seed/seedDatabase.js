require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { Group, Subsidiary, ProjectSite } = require('../src/models');

const seedData = async () => {
  console.log('====================================================');
  console.log('[Seed Engine] Initiating Database Seeding...');
  console.log('====================================================');

  const connected = await connectDB();
  if (!connected) {
    console.error('[Seed Engine] Aborting: Failed to connect to MongoDB.');
    process.exit(1);
  }

  try {
    // Clear existing foundational data
    console.log('[Seed Engine] Clearing existing Group, Subsidiary, and Site collections...');
    await ProjectSite.deleteMany({});
    await Subsidiary.deleteMany({});
    await Group.deleteMany({});

    // 1. Seed Group
    const group = await Group.create({
      name: 'MEIL Group',
      code: 'MEIL',
    });
    console.log(`[Seed Engine] Created Group: ${group.name} (${group.code})`);

    // 2. Seed Subsidiaries
    const subsidiaries = await Subsidiary.insertMany([
      {
        name: 'MEIL Infrastructure Ltd',
        code: 'MEIL-INFRA',
        groupId: group._id,
      },
      {
        name: 'MEIL Energy & Power Ltd',
        code: 'MEIL-ENERGY',
        groupId: group._id,
      },
      {
        name: 'MEIL Water & Utilities Ltd',
        code: 'MEIL-WATER',
        groupId: group._id,
      },
    ]);
    console.log(`[Seed Engine] Created ${subsidiaries.length} Subsidiaries.`);

    const [infraSub, energySub, waterSub] = subsidiaries;

    // 3. Seed Project Sites
    const projectSites = await ProjectSite.insertMany([
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
    ]);
    console.log(`[Seed Engine] Created ${projectSites.length} Project Sites.`);

    console.log('====================================================');
    console.log('[Seed Engine] Database Seeding Completed Successfully!');
    console.log(`Summary: 1 Group | ${subsidiaries.length} Subsidiaries | ${projectSites.length} Sites`);
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Engine] Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
