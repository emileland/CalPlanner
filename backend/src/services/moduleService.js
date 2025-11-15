const ApiError = require('../utils/ApiError');
const { query } = require('../config/db');

const mapModule = (row) => ({
  ...row,
  is_selected: Boolean(row.is_selected),
});

const listByCalendar = async (calendarId) => {
  const { rows } = await query(
    `SELECT module_id, calendar_id, name, is_selected, created_at
     FROM modules
     WHERE calendar_id = ?
     ORDER BY name ASC`,
    [calendarId],
  );
  return rows.map(mapModule);
};

const getById = async (moduleId) => {
  const { rows } = await query(
    `SELECT module_id, calendar_id, name, is_selected
     FROM modules
     WHERE module_id = ?`,
    [moduleId],
  );
  return rows.length ? mapModule(rows[0]) : null;
};

const setSelection = async (moduleId, isSelected) => {
  await query(
    `UPDATE modules
     SET is_selected = ?
     WHERE module_id = ?`,
    [isSelected ? 1 : 0, moduleId],
  );
  const module = await getById(moduleId);
  if (!module) {
    throw new ApiError(404, 'Module introuvable');
  }
  return module;
};

const setSelectionForCalendar = async (calendarId, isSelected) => {
  await query(
    `UPDATE modules
     SET is_selected = ?
     WHERE calendar_id = ?`,
    [isSelected ? 1 : 0, calendarId],
  );
  return listByCalendar(calendarId);
};

module.exports = {
  listByCalendar,
  getById,
  setSelection,
  setSelectionForCalendar,
};
