const mongoose = require('mongoose');
const { ProjectSite } = require('../models');

/**
 * GET /api/sites
 * Returns all project sites stored in MongoDB.
 * Rejects with 503 if MongoDB is disconnected.
 */
const getSites = async (req, res) => {
  // Verify real MongoDB connection state
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. ESG data cannot be loaded.',
    });
  }

  try {
    const sites = await ProjectSite.find()
      .populate('subsidiaryId', 'name code')
      .lean();

    return res.status(200).json({
      success: true,
      count: sites.length,
      data: sites,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error querying project sites from database',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = { getSites };
