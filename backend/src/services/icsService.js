const fetch = require('node-fetch');
const ical = require('node-ical');
const ApiError = require('../utils/ApiError');

const extractModuleName = (summary = '') => {
  const cleaned = summary.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return 'Module';
  }
  const separators = [' - ', '-', ':', '|'];
  for (const separator of separators) {
    if (cleaned.includes(separator)) {
      return cleaned.split(separator)[0].trim();
    }
  }
  return cleaned;
};

const fetchIcsBody = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(400, 'Impossible de récupérer le calendrier ICS');
  }
  return response.text();
};

const fetchCalendarEvents = async (url) => {
  const body = await fetchIcsBody(url);
  const parsed = ical.sync.parseICS(body);

  const modules = [];
  const events = [];

  Object.values(parsed).forEach((entry) => {
    if (entry.type !== 'VEVENT' || !entry.start || !entry.end) {
      return;
    }
    const moduleName = extractModuleName(entry.summary || 'Module');
    modules.push(moduleName);
    events.push({
      moduleName,
      title: entry.summary || moduleName,
      description: entry.description || '',
      location: entry.location || '',
      start: entry.start,
      end: entry.end,
      externalId: entry.uid || `${moduleName}-${entry.start.toISOString()}`,
    });
  });

  return { modules, events };
};

module.exports = {
  fetch: fetchCalendarEvents,
};
