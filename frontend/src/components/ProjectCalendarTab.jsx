import { useCallback, useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { projectApi } from '../api/client.js';
import '@fullcalendar/common/main.css';

const cleanDetail = (value) => value?.trim() || '';

const getReadableTextColor = (hex) => {
  if (!hex) {
    return '#0f172a';
  }
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return '#0f172a';
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? '#0f172a' : '#fff';
};

const renderEventContent = (eventInfo) => {
  const { moduleName, color } = eventInfo.event.extendedProps;
  return (
    <div className="event-chip event-chip--compact" style={{ color: getReadableTextColor(color) }}>
      <span className="event-chip__module">{moduleName || eventInfo.event.title}</span>
    </div>
  );
};

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 19;

const clampHour = (hour, fallback) => {
  if (typeof hour !== 'number' || Number.isNaN(hour)) {
    return fallback;
  }
  return Math.min(23, Math.max(0, Math.floor(hour)));
};

const getHourBounds = (start, end) => {
  const minHour = clampHour(start, DEFAULT_START_HOUR);
  let maxHour = clampHour(end, DEFAULT_END_HOUR);
  if (maxHour <= minHour) {
    maxHour = Math.min(23, minHour + 1);
  }
  return { minHour, maxHour };
};

const toFullCalendarTime = (hour) => `${String(hour).padStart(2, '0')}:00:00`;

const ProjectCalendarTab = ({
  projectId,
  hasCalendars,
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
}) => {
  const { minHour, maxHour } = getHourBounds(startHour, endHour);
  const [events, setEvents] = useState([]);
  const [loadingRange, setLoadingRange] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const lastRangeKey = useRef(null);
  const lastVisibleRange = useRef(null);

  const loadEvents = useCallback(
    async ({ start, end }) => {
      if (!hasCalendars) {
        setEvents([]);
        return;
      }
      const rangeKey = `${start.toISOString()}-${end.toISOString()}`;
      if (rangeKey === lastRangeKey.current) {
        return;
      }
      lastRangeKey.current = rangeKey;
      setLoadingRange(true);
      setError(null);
      try {
        const data = await projectApi.listEvents(projectId, {
          viewStart: start.toISOString(),
          viewEnd: end.toISOString(),
        });
        setEvents(
          data.map((event) => {
            const eventColor = event.color || '#4c6ef5';
            return {
              id: event.eventId,
              title: event.title || event.moduleName,
              start: event.start,
              end: event.end,
              backgroundColor: eventColor,
              borderColor: eventColor,
              extendedProps: {
                description: cleanDetail(event.description),
                location: cleanDetail(event.location),
                moduleName: event.moduleName,
                color: eventColor,
              },
            };
          }),
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingRange(false);
      }
    },
    [projectId, hasCalendars],
  );

  useEffect(() => {
    if (hasCalendars && lastVisibleRange.current) {
      loadEvents(lastVisibleRange.current);
      return;
    }
    if (!hasCalendars) {
      setEvents([]);
      setLoadingRange(false);
      lastRangeKey.current = null;
    }
  }, [hasCalendars, loadEvents]);

  useEffect(() => {
    lastRangeKey.current = null;
    setEvents([]);
  }, [projectId]);

  return (
    <div className="calendar-tab">
      {!hasCalendars ? (
        <p className="empty-state">Ajoutez au moins un calendrier pour afficher les événements.</p>
      ) : null}
      {error ? <p className="alert alert-error">{error}</p> : null}
      <div className={`calendar-wrapper ${loadingRange ? 'is-loading' : ''}`}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locales={[frLocale]}
          locale="fr"
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          slotMinTime={toFullCalendarTime(minHour)}
          slotMaxTime={toFullCalendarTime(maxHour)}
          eventContent={renderEventContent}
          events={events}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            const { extendedProps } = info.event;
            setSelectedEvent({
              title: info.event.title,
              moduleName: extendedProps.moduleName || info.event.title,
              location: extendedProps.location,
              description: extendedProps.description,
              start: info.event.start,
              end: info.event.end,
              color: extendedProps.color,
            });
          }}
          eventDidMount={(info) => {
            const color = info.event.extendedProps.color || '#4c6ef5';
            info.el.style.backgroundColor = color;
            info.el.style.borderColor = color;
            info.el.style.color = getReadableTextColor(color);
          }}
          datesSet={(arg) => {
            lastVisibleRange.current = { start: arg.start, end: arg.end };
            loadEvents({ start: arg.start, end: arg.end });
          }}
        />
        {loadingRange ? <div className="calendar-overlay">Mise à jour du planning…</div> : null}
      </div>
      {selectedEvent ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="modal-card"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <header className="modal-card__header">
              <div>
                <p
                  className="modal-card__kicker"
                  style={{ color: selectedEvent.color || '#6366f1' }}
                >
                  {selectedEvent.moduleName}
                </p>
                <h4>{selectedEvent.title}</h4>
              </div>
              <button type="button" className="btn btn-link modal-close" onClick={() => setSelectedEvent(null)}>
                Fermer
              </button>
            </header>
            <div className="modal-card__body">
              {selectedEvent.start || selectedEvent.end ? (
                <p className="event-detail">
                  <strong>Créneau :</strong>{' '}
                  {selectedEvent.start ? formatDateTime(selectedEvent.start) : '—'}{' '}
                  {selectedEvent.end ? `→ ${formatDateTime(selectedEvent.end)}` : ''}
                </p>
              ) : null}
              {selectedEvent.location ? (
                <p className="event-detail">
                  <strong>Salle :</strong> {selectedEvent.location}
                </p>
              ) : null}
              {selectedEvent.description ? (
                <div className="event-detail">
                  <strong>Détails :</strong>
                  <div className="event-description">
                    {selectedEvent.description.split('\n').map((line, index) => {
                      const trimmed = line.trim();
                      if (!trimmed) {
                        return null;
                      }
                      return <p key={`${trimmed}-${index}`}>{trimmed}</p>;
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProjectCalendarTab;
