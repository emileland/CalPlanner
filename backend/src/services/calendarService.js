const ApiError = require('../utils/ApiError');
const { query, withTransaction } = require('../config/db');
const icsService = require('./icsService');

const list = async (projectId) => {
  const { rows } = await query(
    `SELECT
        c.calendar_id,
        c.project_id,
        c.url,
        c.type,
        c.label,
        c.last_synced,
        c.created_at,
        COUNT(m.module_id) AS module_count
     FROM calendars c
     LEFT JOIN modules m ON m.calendar_id = c.calendar_id
     WHERE c.project_id = $1
     GROUP BY c.calendar_id
     ORDER BY c.created_at DESC`,
    [projectId],
  );
  return rows.map((row) => ({
    ...row,
    module_count: Number(row.module_count || 0),
  }));
};

const getById = async (calendarId) => {
  const { rows } = await query(
    `SELECT calendar_id, project_id, url, type, label, last_synced, created_at
     FROM calendars
     WHERE calendar_id = $1`,
    [calendarId],
  );
  return rows[0];
};

const create = async (projectId, { url, type, label }) => {
  const { rows } = await query(
    `INSERT INTO calendars (project_id, url, type, label)
     VALUES ($1, $2, $3, $4)
     RETURNING calendar_id, project_id, url, type, label, created_at`,
    [projectId, url, type, label],
  );
  const calendar = rows[0];
  try {
    await sync(calendar.calendar_id);
  } catch (error) {
    await query('DELETE FROM calendars WHERE calendar_id = $1', [calendar.calendar_id]);
    throw error;
  }
  return getById(calendar.calendar_id);
};

const remove = async (calendarId) => {
  await query('DELETE FROM calendars WHERE calendar_id = $1', [calendarId]);
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
      'SELECT module_id, name FROM modules WHERE calendar_id = $1',
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
        const { rows: inserted } = await client.query(
          `INSERT INTO modules (name, calendar_id, is_selected)
           VALUES ($1, $2, $3)
           RETURNING module_id, name`,
          [moduleName, calendarId, calendar.type],
        );
        moduleIdsByName.set(key, inserted[0].module_id);
        modulesCreated += 1;
      }
    }

    const namesSet = new Set(uniqueModules.map((name) => name.toLowerCase()));
    const obsolete = existingModules.filter(
      (module) => !namesSet.has(module.name.toLowerCase()),
    );
    if (obsolete.length) {
      modulesRemoved = obsolete.length;
      await client.query(
        'DELETE FROM modules WHERE module_id = ANY($1::int[])',
        [obsolete.map((module) => module.module_id)],
      );
    }

    await client.query('DELETE FROM events WHERE calendar_id = $1', [calendarId]);

    for (const event of events) {
      const key = event.moduleName.toLowerCase();
      const moduleId = moduleIdsByName.get(key);
      if (!moduleId) {
        // Should not happen but skip silently if module mapping fails.
        // eslint-disable-next-line no-continue
        continue;
      }
      await client.query(
        `INSERT INTO events
           (calendar_id, module_id, external_id, title, description, location, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
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

    await client.query('UPDATE calendars SET last_synced = NOW() WHERE calendar_id = $1', [
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
  sync,
};
