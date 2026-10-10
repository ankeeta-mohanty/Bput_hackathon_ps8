const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET environment variable is missing or empty.');
  }
  return secret.trim();
};

const getJwtExpiresIn = () => {
  return process.env.JWT_EXPIRES_IN || '24h';
};

/**
 * Generate a signed JWT token containing minimal user identity
 * @param {object} payload - Identity payload (e.g., { id: user._id })
 * @param {object} options - Optional jwt sign options override
 * @returns {string}
 */
const generateToken = (payload, options = {}) => {
  const secret = getJwtSecret();
  const expiresIn = options.expiresIn || getJwtExpiresIn();
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};
