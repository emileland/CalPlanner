const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const projectService = require('../services/projectService');

const withPublicProject = asyncHandler(async (req, _res, next) => {
  const token = req.params.token;
  if (!token) {
    throw new ApiError(400, 'Token manquant');
  }
  const project = await projectService.getByPublicToken(token);
  if (!project) {
    throw new ApiError(404, 'Projet introuvable');
  }
  req.project = project;
  next();
});

module.exports = {
  withPublicProject,
};
