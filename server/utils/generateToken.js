/**
 * JWT Token Generator
 *
 * Creates a signed JWT containing the user's ID.
 * Token expires based on JWT_EXPIRE env variable (default: 7d).
 */

const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = generateToken;
