const ApiError = require('../utils/ApiError');
const { query, withTransaction } = require('../config/db');
const icsService = require('./icsService');

const DEFAULT_COLOR = '#4c6ef5';

let colorColumnPromise = null;

const ensureColorColumn = async () => {
  if (colorColumnPromise) {
    return colorColumnPromise;
  }
  colorColumnPromise = (async () => {
    await query(`
      ALTER TABLE IF EXISTS calendars
      ADD COLUMN IF NOT EXISTS color TEXT
    `);
    await query(
      `
      UPDATE calendars
      SET color = ?
      WHERE color IS NULL
    `,
      [DEFAULT_COLOR],
    );
  })().catch((error) => {
    colorColumnPromise = null;
    throw error;
  });
  return colorColumnPromise;
};

const normalizeCalendar = (row) => {
  if (!row) {
    return null;
  }
  return {
    ...row,
    type: Boolean(row.type),
    color: row.color || DEFAULT_COLOR,
    module_count: row.module_count !== undefined ? Number(row.module_count || 0) : undefined,
  };
};

const list = async (projectId) => {
  await ensureColorColumn();
  const { rows } = await query(
    `SELECT
        c.calendar_id,
        c.project_id,
        c.url,
        c.type,
        c.label,
        c.color,
        c.last_synced,
        c.created_at,
        COUNT(m.module_id) AS module_count
     FROM calendars c
     LEFT JOIN modules m ON m.calendar_id = c.calendar_id
     WHERE c.project_id = ?
     GROUP BY c.calendar_id
     ORDER BY c.created_at DESC`,
    [projectId],
  );
  return rows.map(normalizeCalendar);
};

const getById = async (calendarId) => {
  await ensureColorColumn();
  const { rows } = await query(
    `SELECT calendar_id, project_id, url, type, label, color, last_synced, created_at
     FROM calendars
     WHERE calendar_id = ?`,
    [calendarId],
  );
  return normalizeCalendar(rows[0]);
};

const create = async (projectId, { url, type, label, color }) => {
  await ensureColorColumn();
  const sanitizedColor = color || DEFAULT_COLOR;
  const isInclusive = typeof type === 'boolean' ? (type ? 1 : 0) : 1;
  const result = await query(
    `INSERT INTO calendars (project_id, url, type, label, color)
     VALUES (?, ?, ?, ?, ?)`,
    [projectId, url, isInclusive, label || null, sanitizedColor],
  );
  const calendarId = result.insertId;
  try {
    await sync(calendarId);
  } catch (error) {
    await query('DELETE FROM calendars WHERE calendar_id = ?', [calendarId]);
    throw error;
  }
  return getById(calendarId);
};

const remove = async (calendarId) => {
  await query('DELETE FROM calendars WHERE calendar_id = ?', [calendarId]);
};

const updateDetails = async (calendarId, { label, type, color } = {}) => {
  await ensureColorColumn();
  const fields = [];
  const values = [];

  if (label !== undefined) {
    fields.push('label = ?');
    values.push(label);
  }
  if (typeof type === 'boolean') {
    fields.push('type = ?');
    values.push(type ? 1 : 0);
  }
  if (color !== undefined) {
    fields.push('color = ?');
    values.push(color || DEFAULT_COLOR);
  }

  if (fields.length) {
    values.push(calendarId);
    await query(`UPDATE calendars SET ${fields.join(', ')} WHERE calendar_id = ?`, values);
  }

  const calendar = await getById(calendarId);
  if (!calendar) {
    throw new ApiError(404, 'Calendrier introuvable');
  }
  return calendar;
};

const sync = async (calendarId) => {
  const calendar = await getById(calendarId);
  if (!calendar) {
    throw new ApiError(404, 'Calendrier introuvable');
  }
  const { modules, events } = await icsService.fetch(calendar.url);
  const uniqueModules = [...new Set(modules)];

  let modulesCreated = 0;
  let modulesRemoved = 0;
  let eventsInserted = 0;

  await withTransaction(async (client) => {
    const { rows: existingModules } = await client.query(
      'SELECT module_id, name FROM modules WHERE calendar_id = ?',
      [calendarId],
    );

    const existingByName = new Map(
      existingModules.map((module) => [module.name.toLowerCase(), module]),
    );
    const moduleIdsByName = new Map();

    for (const moduleName of uniqueModules) {
      const key = moduleName.toLowerCase();
      if (existingByName.has(key)) {
        moduleIdsByName.set(key, existingByName.get(key).module_id);
      } else {
        const insertResult = await client.query(
          `INSERT INTO modules (name, calendar_id, is_selected)
           VALUES (?, ?, ?)`,
          [moduleName, calendarId, calendar.type ? 1 : 0],
        );
        moduleIdsByName.set(key, insertResult.insertId);
        modulesCreated += 1;
      }
    }

    const namesSet = new Set(uniqueModules.map((name) => name.toLowerCase()));
    const obsolete = existingModules.filter(
      (module) => !namesSet.has(module.name.toLowerCase()),
    );
    if (obsolete.length) {
      modulesRemoved = obsolete.length;
      const placeholders = obsolete.map(() => '?').join(', ');
      await client.query(`DELETE FROM modules WHERE module_id IN (${placeholders})`, [
        ...obsolete.map((module) => module.module_id),
      ]);
    }

    await client.query('DELETE FROM events WHERE calendar_id = ?', [calendarId]);

    for (const event of events) {
      const key = event.moduleName.toLowerCase();
      const moduleId = moduleIdsByName.get(key);
      if (!moduleId) {
        // eslint-disable-next-line no-continue
        continue;
      }
      await client.query(
        `INSERT INTO events
           (calendar_id, module_id, external_id, title, description, location, start_time, end_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          calendarId,
          moduleId,
          event.externalId,
          event.title,
          event.description,
          event.location,
          event.start,
          event.end,
        ],
      );
      eventsInserted += 1;
    }

    await client.query('UPDATE calendars SET last_synced = CURRENT_TIMESTAMP WHERE calendar_id = ?', [
      calendarId,
    ]);
  });

  return {
    calendarId,
    modulesCreated,
    modulesRemoved,
    eventsCreated: eventsInserted,
  };
};

module.exports = {
  list,
  getById,
  create,
  remove,
  updateDetails,
  sync,
};
