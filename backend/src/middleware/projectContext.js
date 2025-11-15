const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const projectService = require('../services/projectService');

const withProject = asyncHandler(async (req, _res, next) => {
  const projectId = Number(req.params.projectId);
  if (Number.isNaN(projectId)) {
    throw new ApiError(400, 'Identifiant de projet invalide');
  }
  const project = await projectService.getById(projectId);
  if (!project || project.username !== req.user.username) {
    throw new ApiError(404, 'Projet introuvable');
  }
  req.project = project;
  next();
});

module.exports = {
  withProject,
};
