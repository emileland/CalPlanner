import { useEffect, useState } from 'react';
import { calendarApi, moduleApi } from '../api/client.js';

const initialForm = {
  url: '',
  type: 'true',
  label: '',
};

const ProjectCalendarsTab = ({ projectId, calendars, onRefresh }) => {
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [modulesCache, setModulesCache] = useState({});
  const [modulesLoadingId, setModulesLoadingId] = useState(null);
  const [modulesError, setModulesError] = useState(null);
  const [busyCalendar, setBusyCalendar] = useState(null);

  useEffect(() => {
    setModulesCache({});
    setExpandedId(null);
  }, [projectId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCreating(true);
    setFormError(null);
    setFeedback(null);
    try {
      await calendarApi.create(projectId, {
        url: form.url,
        type: form.type === 'true',
        label: form.label || undefined,
      });
      setForm(initialForm);
      setFeedback('Calendrier ajouté avec succès (et synchronisé).');
      await onRefresh();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleExpand = async (calendarId) => {
    setModulesError(null);
    if (expandedId === calendarId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(calendarId);
    if (modulesCache[calendarId]) {
      return;
    }
    try {
      setModulesLoadingId(calendarId);
      const modules = await moduleApi.list(projectId, calendarId);
      setModulesCache((prev) => ({ ...prev, [calendarId]: modules }));
    } catch (error) {
      setModulesError(error.message);
    } finally {
      setModulesLoadingId(null);
    }
  };

  const resync = async (calendarId) => {
    setBusyCalendar(calendarId);
    setFeedback(null);
    setFormError(null);
    try {
      const summary = await calendarApi.sync(projectId, calendarId);
      setFeedback(
        `Synchronisation terminée : ${summary.modulesCreated} modules ajoutés · ${summary.modulesRemoved} retirés · ${summary.eventsCreated} événements.`,
      );
      await onRefresh();
      if (modulesCache[calendarId]) {
        const modules = await moduleApi.list(projectId, calendarId);
        setModulesCache((prev) => ({ ...prev, [calendarId]: modules }));
      }
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBusyCalendar(null);
    }
  };

  const removeCalendar = async (calendarId) => {
    if (!window.confirm('Supprimer ce calendrier ?')) {
      return;
    }
    setBusyCalendar(calendarId);
    setFeedback(null);
    setFormError(null);
    try {
      await calendarApi.remove(projectId, calendarId);
      if (expandedId === calendarId) {
        setExpandedId(null);
      }
      setModulesCache((prev) => {
        const next = { ...prev };
        delete next[calendarId];
        return next;
      });
      await onRefresh();
      setFeedback('Calendrier supprimé.');
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBusyCalendar(null);
    }
  };

  const toggleModule = async (calendarId, moduleId, isSelected) => {
    setModulesError(null);
    setBusyCalendar(`${calendarId}-${moduleId}`);
    try {
      const updated = await moduleApi.toggle(projectId, calendarId, moduleId, isSelected);
      setModulesCache((prev) => ({
        ...prev,
        [calendarId]: prev[calendarId].map((module) =>
          module.module_id === moduleId ? updated : module,
        ),
      }));
    } catch (error) {
      setModulesError(error.message);
    } finally {
      setBusyCalendar(null);
    }
  };

  return (
    <div className="calendar-manager">
      <section className="panel">
        <h3>Ajouter un calendrier ICS</h3>
        {formError ? <p className="alert alert-error">{formError}</p> : null}
        {feedback ? <p className="alert alert-success">{feedback}</p> : null}
        <form className="form grid grid-3" onSubmit={handleSubmit}>
          <label className="form-field grid-span-2">
            <span>URL ICS</span>
            <input
              type="url"
              name="url"
              placeholder="https://..."
              value={form.url}
              onChange={handleChange}
              required
            />
          </label>
          <label className="form-field">
            <span>Mode</span>
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="true">Inclusif (on coche ce qui est affiché)</option>
              <option value="false">Exclusif (on décoche pour masquer)</option>
            </select>
          </label>
          <label className="form-field grid-span-3">
            <span>Label (optionnel)</span>
            <input
              type="text"
              name="label"
              placeholder="Promo 1 ou Campus B"
              value={form.label}
              onChange={handleChange}
            />
          </label>
          <div className="form-field align-end grid-span-3">
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Ajout en cours...' : 'Ajouter et synchroniser'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h3>Calendriers rattachés</h3>
        {!calendars.length ? (
          <p className="empty-state">Aucun calendrier pour ce projet.</p>
        ) : (
          <ul className="calendar-list">
            {calendars.map((calendar) => {
              const isBusy = busyCalendar === calendar.calendar_id;
              const modules = modulesCache[calendar.calendar_id];
              return (
                <li key={calendar.calendar_id} className="calendar-item">
                  <header>
                    <div>
                      <h4>{calendar.label || calendar.url}</h4>
                      <p className="text-muted">
                        {calendar.type ? 'Mode inclusif' : 'Mode exclusif'} ·{' '}
                        {calendar.module_count} modules détectés
                      </p>
                      <p className="text-muted">
                        Dernière synchro:{' '}
                        {calendar.last_synced
                          ? new Date(calendar.last_synced).toLocaleString()
                          : 'jamais'}
                      </p>
                    </div>
                    <div className="calendar-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => resync(calendar.calendar_id)}
                        disabled={isBusy}
                      >
                        Synchroniser
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => removeCalendar(calendar.calendar_id)}
                        disabled={isBusy}
                      >
                        Supprimer
                      </button>
                      <button
                        type="button"
                        className="btn btn-link"
                        onClick={() => toggleExpand(calendar.calendar_id)}
                      >
                        {expandedId === calendar.calendar_id ? 'Masquer les modules' : 'Voir les modules'}
                      </button>
                    </div>
                  </header>

                  {expandedId === calendar.calendar_id ? (
                    <div className="modules-panel">
                      {modulesError ? <p className="alert alert-error">{modulesError}</p> : null}
                      {modulesLoadingId === calendar.calendar_id && !modules ? (
                        <p className="text-muted">Chargement des modules…</p>
                      ) : null}
                      {modules && !modules.length ? (
                        <p className="text-muted">Aucun module détecté pour l’instant.</p>
                      ) : null}
                      {modules ? (
                        <ul className="module-list">
                          {modules.map((module) => (
                            <li key={module.module_id}>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={module.is_selected}
                                  onChange={(event) =>
                                    toggleModule(
                                      calendar.calendar_id,
                                      module.module_id,
                                      event.target.checked,
                                    )
                                  }
                                  disabled={busyCalendar === `${calendar.calendar_id}-${module.module_id}`}
                                />
                                <span>{module.name}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <p className="text-muted explanation">
                        {calendar.type
                          ? 'Mode inclusif : seuls les modules cochés seront visibles.'
                          : 'Mode exclusif : tous les modules sont visibles sauf ceux décochés.'}
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ProjectCalendarsTab;
