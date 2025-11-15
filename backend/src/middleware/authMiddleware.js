const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');

module.exports = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return next(new ApiError(401, 'Authentification requise'));
  }
  const [, token] = header.split(' ');
  if (!token) {
    return next(new ApiError(401, 'Authentification requise'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { username: payload.username, email: payload.email };
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Token invalide'));
  }
};
