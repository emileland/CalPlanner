const asyncHandler = require('../utils/asyncHandler');
const calendarService = require('../services/calendarService');

const list = asyncHandler(async (req, res) => {
  const calendars = await calendarService.list(req.project.project_id);
  res.json(calendars);
});

const create = asyncHandler(async (req, res) => {
  const calendar = await calendarService.create(req.project.project_id, {
    url: req.body.url,
    type: req.body.type,
    label: req.body.label,
  });
  res.status(201).json(calendar);
});

const remove = asyncHandler(async (req, res) => {
  await calendarService.remove(req.calendar.calendar_id);
  res.status(204).send();
});

const sync = asyncHandler(async (req, res) => {
  const payload = await calendarService.sync(req.calendar.calendar_id);
  res.json(payload);
});

module.exports = {
  list,
  create,
  remove,
  sync,
};
