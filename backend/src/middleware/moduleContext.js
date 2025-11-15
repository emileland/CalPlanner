const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const moduleService = require('../services/moduleService');

const withModule = asyncHandler(async (req, _res, next) => {
  const moduleId = Number(req.params.moduleId);
  if (Number.isNaN(moduleId)) {
    throw new ApiError(400, 'Identifiant de module invalide');
  }
  const module = await moduleService.getById(moduleId);
  if (!module || module.calendar_id !== req.calendar.calendar_id) {
    throw new ApiError(404, 'Module introuvable');
  }
  req.module = module;
  next();
});

module.exports = {
  withModule,
};
