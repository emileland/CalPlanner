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
    color: req.body.color,
  });
  res.status(201).json(calendar);
});

const remove = asyncHandler(async (req, res) => {
  await calendarService.remove(req.calendar.calendar_id);
  res.status(204).send();
});

const update = asyncHandler(async (req, res) => {
  const payload = {};
  if (Object.prototype.hasOwnProperty.call(req.body, 'label')) {
    payload.label = req.body.label;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'type')) {
    payload.type = req.body.type;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'color')) {
    payload.color = req.body.color;
  }
  const calendar = await calendarService.updateDetails(req.calendar.calendar_id, payload);
  res.json(calendar);
});

const sync = asyncHandler(async (req, res) => {
  const payload = await calendarService.sync(req.calendar.calendar_id);
  res.json(payload);
});

module.exports = {
  list,
  create,
  remove,
  update,
  sync,
};
