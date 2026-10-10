const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcryptjs
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a plaintext password against a bcrypt hash
 * @param {string} candidatePassword
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (candidatePassword, hash) => {
  if (!candidatePassword || !hash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, hash);
};

module.exports = {
  hashPassword,
  verifyPassword,
};
