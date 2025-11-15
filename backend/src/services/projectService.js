const ApiError = require('../utils/ApiError');
const { query } = require('../config/db');

const listByUser = async (username) => {
  const { rows } = await query(
    `SELECT project_id, username, name, start_date, end_date, created_at
     FROM projects
     WHERE username = $1
     ORDER BY created_at DESC`,
    [username],
  );
  return rows;
};

const create = async ({ username, name, start_date, end_date }) => {
  const { rows } = await query(
    `INSERT INTO projects (username, name, start_date, end_date)
     VALUES ($1, $2, $3, $4)
     RETURNING project_id, username, name, start_date, end_date, created_at`,
    [username, name, start_date, end_date],
  );
  return rows[0];
};

const getById = async (projectId) => {
  const { rows } = await query(
    `SELECT project_id, username, name, start_date, end_date, created_at
     FROM projects
     WHERE project_id = $1`,
    [projectId],
  );
  return rows[0];
};

const update = async (projectId, { name, start_date, end_date }) => {
  const { rows } = await query(
    `UPDATE projects
     SET name = $1,
         start_date = $2,
         end_date = $3,
         updated_at = NOW()
     WHERE project_id = $4
     RETURNING project_id, username, name, start_date, end_date, created_at, updated_at`,
    [name, start_date, end_date, projectId],
  );
  if (!rows.length) {
    throw new ApiError(404, 'Projet introuvable');
  }
  return rows[0];
};

const remove = async (projectId) => {
  await query('DELETE FROM projects WHERE project_id = $1', [projectId]);
};

const listEvents = async (projectId, { viewStart, viewEnd }) => {
  const { rows } = await query(
    `SELECT
        e.event_id,
        e.title,
        e.description,
        e.location,
        e.start_time,
        e.end_time,
        e.module_id,
        m.name AS module_name,
        m.is_selected,
        c.calendar_id
     FROM events e
     JOIN modules m ON e.module_id = m.module_id
     JOIN calendars c ON m.calendar_id = c.calendar_id
     WHERE c.project_id = $1
     ORDER BY e.start_time ASC`,
    [projectId],
  );

  const startBound = viewStart ? new Date(viewStart) : null;
  const endBound = viewEnd ? new Date(viewEnd) : null;

  return rows
    .filter((event) => {
      if (!event.is_selected) {
        return false;
      }
      const startDate = new Date(event.start_time);
      const endDate = new Date(event.end_time);
      if (startBound && endDate < startBound) {
        return false;
      }
      if (endBound && startDate > endBound) {
        return false;
      }
      return true;
    })
    .map((event) => ({
      eventId: event.event_id,
      calendarId: event.calendar_id,
      moduleId: event.module_id,
      moduleName: event.module_name,
      title: event.title,
      description: event.description,
      location: event.location,
      start: event.start_time,
      end: event.end_time,
    }));
};

module.exports = {
  listByUser,
  create,
  getById,
  update,
  remove,
  listEvents,
};
