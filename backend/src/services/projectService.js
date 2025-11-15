const ApiError = require('../utils/ApiError');
const { randomBytes } = require('crypto');
const { query } = require('../config/db');
const calendarService = require('./calendarService');

let publicTokenColumnPromise = null;

const ensurePublicTokenColumn = async () => {
  if (publicTokenColumnPromise) {
    return publicTokenColumnPromise;
  }
  publicTokenColumnPromise = (async () => {
    await query(`
      ALTER TABLE IF EXISTS projects
      ADD COLUMN IF NOT EXISTS public_ics_token TEXT UNIQUE
    `);
    await query(`
      UPDATE projects
      SET public_ics_token = md5(random()::text || clock_timestamp()::text)
      WHERE public_ics_token IS NULL
    `);
  })().catch((error) => {
    publicTokenColumnPromise = null;
    throw error;
  });
  return publicTokenColumnPromise;
};

const listByUser = async (username) => {
  await ensurePublicTokenColumn();
  const { rows } = await query(
    `SELECT project_id, username, name, start_date, end_date, created_at, public_ics_token
     FROM projects
     WHERE username = $1
     ORDER BY created_at DESC`,
    [username],
  );
  return rows;
};

const create = async ({ username, name, start_date, end_date }) => {
  await ensurePublicTokenColumn();
  const { rows } = await query(
    `INSERT INTO projects (username, name, start_date, end_date, public_ics_token)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING project_id, username, name, start_date, end_date, created_at, public_ics_token`,
    [username, name, start_date, end_date, randomBytes(24).toString('hex')],
  );
  return rows[0];
};

const getById = async (projectId) => {
  await ensurePublicTokenColumn();
  const { rows } = await query(
    `SELECT project_id, username, name, start_date, end_date, created_at, public_ics_token
     FROM projects
     WHERE project_id = $1`,
    [projectId],
  );
  return rows[0];
};

const update = async (projectId, { name, start_date, end_date }) => {
  await ensurePublicTokenColumn();
  const { rows } = await query(
    `UPDATE projects
     SET name = $1,
         start_date = $2,
         end_date = $3,
         updated_at = NOW()
     WHERE project_id = $4
     RETURNING project_id, username, name, start_date, end_date, created_at, updated_at, public_ics_token`,
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

const regeneratePublicToken = async (projectId) => {
  await ensurePublicTokenColumn();
  const token = randomBytes(24).toString('hex');
  const { rows } = await query(
    `UPDATE projects
     SET public_ics_token = $1,
         updated_at = NOW()
     WHERE project_id = $2
     RETURNING project_id, username, name, start_date, end_date, created_at, updated_at, public_ics_token`,
    [token, projectId],
  );
  if (!rows.length) {
    throw new ApiError(404, 'Projet introuvable');
  }
  return rows[0];
};

const toIcsDate = (value) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
};

const escapeIcsText = (value = '') =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .trim();

const getByPublicToken = async (token) => {
  await ensurePublicTokenColumn();
  const { rows } = await query(
    `SELECT project_id, username, name, start_date, end_date, created_at, public_ics_token
     FROM projects
     WHERE public_ics_token = $1`,
    [token],
  );
  return rows[0];
};

const listEvents = async (projectId, { viewStart, viewEnd } = {}) => {
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
        c.calendar_id,
        c.color
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
      color: event.color,
    }));
};

const generateIcs = async (projectId) => {
  const events = await listEvents(projectId);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CalPlanner//FR',
    'CALSCALE:GREGORIAN',
  ];
  const stamp = toIcsDate(new Date());

  events.forEach((event) => {
    const start = toIcsDate(event.start);
    const end = toIcsDate(event.end);
    if (!start || !end) {
      return;
    }
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.eventId || `${projectId}-${start}`}`);
    if (stamp) {
      lines.push(`DTSTAMP:${stamp}`);
    }
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title || event.moduleName || 'Événement')}`);
    if (event.moduleName) {
      lines.push(`CATEGORIES:${escapeIcsText(event.moduleName)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

const getConfig = async (projectId) => {
  await ensurePublicTokenColumn();
  const project = await getById(projectId);
  if (!project) {
    throw new ApiError(404, 'Projet introuvable');
  }
  const { rows } = await query(
    `SELECT url, type, label
     FROM calendars
     WHERE project_id = $1
     ORDER BY calendar_id ASC`,
    [projectId],
  );
  return {
    project: {
      name: project.name,
      start_date: project.start_date,
      end_date: project.end_date,
    },
    calendars: rows.map((calendar) => ({
      url: calendar.url,
      type: calendar.type,
      label: calendar.label,
      color: calendar.color,
    })),
  };
};

const importFromConfig = async (username, config) => {
  if (!config || typeof config !== 'object') {
    throw new ApiError(400, 'Configuration invalide');
  }
  const projectPayload = config.project || {};
  if (!projectPayload.name) {
    throw new ApiError(400, 'Le nom du projet est requis dans la configuration');
  }
  const createdProject = await create({
    username,
    name: projectPayload.name,
    start_date: projectPayload.start_date || null,
    end_date: projectPayload.end_date || null,
  });

  if (Array.isArray(config.calendars) && config.calendars.length) {
    try {
      for (const calendar of config.calendars) {
        if (!calendar?.url) {
          // eslint-disable-next-line no-continue
          continue;
        }
        await calendarService.create(createdProject.project_id, {
          url: calendar.url,
          type:
            typeof calendar.type === 'boolean'
              ? calendar.type
              : calendar.type === 'false'
                ? false
                : true,
          label: calendar.label,
          color: calendar.color,
        });
      }
    } catch (error) {
      await remove(createdProject.project_id);
      throw error;
    }
  }

  return getById(createdProject.project_id);
};

module.exports = {
  listByUser,
  create,
  getById,
  getByPublicToken,
  update,
  remove,
  regeneratePublicToken,
  listEvents,
  generateIcs,
  getConfig,
  importFromConfig,
};
