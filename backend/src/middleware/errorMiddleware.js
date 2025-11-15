const ApiError = require('../utils/ApiError');

const notFoundHandler = (_req, _res, next) => {
  next(new ApiError(404, 'Ressource introuvable'));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const message =
    status >= 500 ? 'Une erreur est survenue, veuillez réessayer.' : err.message;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    error: message,
    details: err.details,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
