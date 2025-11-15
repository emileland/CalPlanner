const asyncHandler = require('../utils/asyncHandler');
const moduleService = require('../services/moduleService');

const list = asyncHandler(async (req, res) => {
  const modules = await moduleService.listByCalendar(req.calendar.calendar_id);
  res.json(modules);
});

const updateSelection = asyncHandler(async (req, res) => {
  const module = await moduleService.setSelection(req.module.module_id, req.body.isSelected);
  res.json(module);
});

const updateSelectionBulk = asyncHandler(async (req, res) => {
  const modules = await moduleService.setSelectionForCalendar(
    req.calendar.calendar_id,
    req.body.isSelected,
  );
  res.json(modules);
});

module.exports = {
  list,
  updateSelection,
  updateSelectionBulk,
};
