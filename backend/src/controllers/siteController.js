const mongoose = require('mongoose');
const { ProjectSite, Subsidiary } = require('../models');

/**
 * GET /api/sites
 * Returns project sites scoped strictly to the authenticated user's organizational authority:
 * - SITE_MANAGER: Only explicitly assigned project sites (siteIds)
 * - SUBSIDIARY_ESG_MANAGER: Only sites belonging to their assigned subsidiary
 * - GROUP_ESG_EXECUTIVE: Sites belonging to subsidiaries within their authorized group
 *
 * Rejects with 401 if unauthenticated, 403 if unauthorized scope requested, 503 if DB disconnected.
 */
const getSites = async (req, res) => {
  // Verify real MongoDB connection state
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. ESG data cannot be loaded.',
    });
  }

  const user = req.user;
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required to access project sites.',
    });
  }

  try {
    const { siteId } = req.query;

    if (siteId && !mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid siteId query parameter format.',
      });
    }

    let siteFilter = {};

    if (user.role === 'SITE_MANAGER') {
      const assignedIds = (user.siteIds || []).map((id) => id.toString());
      if (siteId) {
        if (!assignedIds.includes(siteId.toString())) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: requested site is outside your authorized organizational scope.',
          });
        }
        siteFilter = { _id: siteId };
      } else {
        siteFilter = { _id: { $in: user.siteIds || [] } };
      }
    } else if (user.role === 'SUBSIDIARY_ESG_MANAGER') {
      if (!user.subsidiaryId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No subsidiary assigned to this manager.',
        });
      }
      if (siteId) {
        siteFilter = { _id: siteId, subsidiaryId: user.subsidiaryId };
      } else {
        siteFilter = { subsidiaryId: user.subsidiaryId };
      }
    } else if (user.role === 'GROUP_ESG_EXECUTIVE') {
      if (!user.groupId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No group assigned to this executive.',
        });
      }
      const subsidiaries = await Subsidiary.find({ groupId: user.groupId }).select('_id');
      const subsidiaryIds = subsidiaries.map((sub) => sub._id);

      if (siteId) {
        siteFilter = { _id: siteId, subsidiaryId: { $in: subsidiaryIds } };
      } else {
        siteFilter = { subsidiaryId: { $in: subsidiaryIds } };
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: unrecognized role.',
      });
    }

    const sites = await ProjectSite.find(siteFilter)
      .populate('subsidiaryId', 'name code groupId')
      .lean();

    // If specific siteId was requested but no document matched the scoped filter
    if (siteId && sites.length === 0) {
      const existsInSystem = await ProjectSite.exists({ _id: siteId });
      if (existsInSystem) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: requested site is outside your authorized organizational scope.',
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Project site not found.',
      });
    }

    return res.status(200).json({
      success: true,
      count: sites.length,
      scope: user.role,
      data: sites,
    });
  } catch (error) {
    console.error('[Site Controller Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error querying project sites from database.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = { getSites };
