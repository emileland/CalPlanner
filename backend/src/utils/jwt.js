const jwt = require('jsonwebtoken');
const ApiError = require('./ApiError');

const signToken = (payload, options = {}) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
    ...options,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Token invalide');
  }
};

module.exports = {
  signToken,
  verifyToken,
};
