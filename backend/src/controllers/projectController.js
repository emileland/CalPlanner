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
    view_start_hour: req.body.view_start_hour ?? 7,
    view_end_hour: req.body.view_end_hour ?? 19,
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
    view_start_hour: req.body.view_start_hour,
    view_end_hour: req.body.view_end_hour,
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

const exportIcs = asyncHandler(async (req, res) => {
  const icsPayload = await projectService.generateIcs(req.project.project_id);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="calplanner-project-${req.project.project_id}.ics"`,
  );
  res.send(icsPayload);
});

const exportConfig = asyncHandler(async (req, res) => {
  const config = await projectService.getConfig(req.project.project_id);
  res.json(config);
});

const importConfig = asyncHandler(async (req, res) => {
  const project = await projectService.importFromConfig(req.user.username, req.body);
  res.status(201).json(project);
});

const regenerateIcsToken = asyncHandler(async (req, res) => {
  const project = await projectService.regeneratePublicToken(req.project.project_id);
  res.json(project);
});

module.exports = {
  list,
  create,
  getById,
  update,
  remove,
  listEvents,
  exportIcs,
  exportConfig,
  importConfig,
  regenerateIcsToken,
};
