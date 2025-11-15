const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const calendarService = require('../services/calendarService');

const withCalendar = asyncHandler(async (req, _res, next) => {
  const calendarId = Number(req.params.calendarId);
  if (Number.isNaN(calendarId)) {
    throw new ApiError(400, 'Identifiant de calendrier invalide');
  }
  const calendar = await calendarService.getById(calendarId);
  if (!calendar || calendar.project_id !== req.project.project_id) {
    throw new ApiError(404, 'Calendrier introuvable');
  }
  req.calendar = calendar;
  next();
});

module.exports = {
  withCalendar,
};
