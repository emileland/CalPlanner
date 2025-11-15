import { useCallback, useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { projectApi } from '../api/client.js';
import '@fullcalendar/core/index.css';
import '@fullcalendar/daygrid/index.css';
import '@fullcalendar/timegrid/index.css';

const ProjectCalendarTab = ({ projectId, hasCalendars }) => {
  const [events, setEvents] = useState([]);
  const [loadingRange, setLoadingRange] = useState(false);
  const [error, setError] = useState(null);
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
          data.map((event) => ({
            id: event.eventId,
            title: event.title || event.moduleName,
            start: event.start,
            end: event.end,
            extendedProps: {
              description: event.description,
              location: event.location,
              moduleName: event.moduleName,
            },
          })),
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
          events={events}
          datesSet={(arg) => {
            lastVisibleRange.current = { start: arg.start, end: arg.end };
            loadEvents({ start: arg.start, end: arg.end });
          }}
        />
        {loadingRange ? <div className="calendar-overlay">Mise à jour du planning…</div> : null}
      </div>
    </div>
  );
};

export default ProjectCalendarTab;
