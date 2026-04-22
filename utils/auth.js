const crypto = require('crypto');

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} storedHash - Stored hash (salt:hash format)
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Generate a random string (for tokens, etc.)
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
function generateRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateRandomString
};
