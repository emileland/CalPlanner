const ApiError = require('../utils/ApiError');
const { query } = require('../config/db');

const listByCalendar = async (calendarId) => {
  const { rows } = await query(
    `SELECT module_id, calendar_id, name, is_selected, created_at
     FROM modules
     WHERE calendar_id = $1
     ORDER BY name ASC`,
    [calendarId],
  );
  return rows;
};

const getById = async (moduleId) => {
  const { rows } = await query(
    `SELECT module_id, calendar_id, name, is_selected
     FROM modules
     WHERE module_id = $1`,
    [moduleId],
  );
  return rows[0];
};

const setSelection = async (moduleId, isSelected) => {
  const { rows } = await query(
    `UPDATE modules
     SET is_selected = $1
     WHERE module_id = $2
     RETURNING module_id, calendar_id, name, is_selected`,
    [isSelected, moduleId],
  );
  if (!rows.length) {
    throw new ApiError(404, 'Module introuvable');
  }
  return rows[0];
};

module.exports = {
  listByCalendar,
  getById,
  setSelection,
};
