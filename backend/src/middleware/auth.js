const { verifyToken } = require('../utils/token');
const { User, ProjectSite } = require('../models');

/**
 * requireAuth middleware
 * 1. Extracts Bearer token from Authorization header.
 * 2. Verifies token signature and expiration.
 * 3. Fetches live user from MongoDB (ensures deactivated users or changed roles take effect immediately).
 * 4. Attaches live user to req.user.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authorization token.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
      });
    }

    // Load fresh user from MongoDB - never rely solely on claims in token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Access denied.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication processing error.',
    });
  }
};

/**
 * requireRole middleware factory
 * Ensures authenticated user possesses one of the allowed roles.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to role verification.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

/**
 * Checks whether the authenticated user has authorization to access a specific site.
 * Resolves site and checks against role hierarchy:
 * - GROUP_ESG_EXECUTIVE: Sites within their group
 * - SUBSIDIARY_ESG_MANAGER: Sites within their subsidiary
 * - SITE_MANAGER: Only explicitly assigned sites in siteIds
 */
const checkSiteAuthorization = async (user, siteId) => {
  if (!user || !siteId) return false;

  const site = await ProjectSite.findById(siteId).populate('subsidiaryId');
  if (!site) return false;

  if (user.role === 'GROUP_ESG_EXECUTIVE') {
    return site.subsidiaryId && site.subsidiaryId.groupId.toString() === user.groupId.toString();
  }

  if (user.role === 'SUBSIDIARY_ESG_MANAGER') {
    return (
      user.subsidiaryId &&
      site.subsidiaryId &&
      site.subsidiaryId._id.toString() === user.subsidiaryId.toString()
    );
  }

  if (user.role === 'SITE_MANAGER') {
    return user.siteIds.some((id) => id.toString() === site._id.toString());
  }

  return false;
};

module.exports = {
  requireAuth,
  requireRole,
  checkSiteAuthorization,
};
