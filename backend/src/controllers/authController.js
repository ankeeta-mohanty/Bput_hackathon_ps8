const { User } = require('../models');
const { generateToken } = require('../utils/token');

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues a JWT token.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up user
    const user = await User.findOne({ email: normalizedEmail });

    // Generic error message prevents username/email enumeration
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your ESG administrator.',
      });
    }

    // Verify password hash
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token with user id
    const token = generateToken({ id: user._id });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeUser(),
    });
  } catch (error) {
    console.error('[Login Controller Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication processing.',
    });
  }
};

/**
 * GET /api/auth/me
 * Returns current authenticated user profile and authorized scopes.
 */
const getMe = async (req, res) => {
  try {
    // req.user is set by requireAuth middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user.toSafeUser(),
    });
  } catch (error) {
    console.error('[GetMe Controller Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
    });
  }
};

/**
 * POST /api/auth/logout
 * Acknowledges session termination (stateless JWT client-side token disposal).
 */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear your authentication token.',
  });
};

module.exports = {
  login,
  getMe,
  logout,
};
