const asyncHandler = require('../utils/asyncHandler');
const projectService = require('../services/projectService');

const exportIcs = asyncHandler(async (req, res) => {
  const icsPayload = await projectService.generateIcs(req.project.project_id);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="calplanner-project-${req.project.project_id}.ics"`,
  );
  res.send(icsPayload);
});

const refreshData = asyncHandler(async (_req, res) => {
  res.status(200).json({ ok: true });
});

module.exports = {
  exportIcs,
  refreshData,
};
