const asyncHandler = require('../utils/asyncHandler');
const projectService = require('../services/projectService');

const list = asyncHandler(async (req, res) => {
  const projects = await projectService.listByUser(req.user.username);
  res.json(projects);
});

const create = asyncHandler(async (req, res) => {
  const project = await projectService.create({
    username: req.user.username,
    name: req.body.name,
    start_date: req.body.start_date,
    end_date: req.body.end_date,
  });
  res.status(201).json(project);
});

const getById = asyncHandler(async (req, res) => {
  res.json(req.project);
});

const update = asyncHandler(async (req, res) => {
  const project = await projectService.update(req.project.project_id, {
    name: req.body.name,
    start_date: req.body.start_date,
    end_date: req.body.end_date,
  });
  res.json(project);
});

const remove = asyncHandler(async (req, res) => {
  await projectService.remove(req.project.project_id);
  res.status(204).send();
});

const listEvents = asyncHandler(async (req, res) => {
  const { viewStart, viewEnd } = req.query;
  const events = await projectService.listEvents(req.project.project_id, {
    viewStart,
    viewEnd,
  });
  res.json(events);
});

module.exports = {
  list,
  create,
  getById,
  update,
  remove,
  listEvents,
};
