const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

module.exports = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation échouée', errors.array()));
  }
  return next();
};
