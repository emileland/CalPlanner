import { useEffect, useMemo, useState } from 'react';
import { calendarApi, moduleApi } from '../api/client.js';

const COLOR_OPTIONS = [
  '#4c6ef5',
  '#845ef7',
  '#f59f00',
  '#f97316',
  '#34d399',
  '#10b981',
  '#0ea5e9',
  '#6366f1',
  '#ec4899',
  '#ef4444',
  '#14b8a6',
  '#2dd4bf',
  '#3b82f6',
  '#8b5cf6',
  '#f472b6',
  '#fb923c',
  '#22c55e',
  '#a855f7',
  '#f43f5e',
  '#0f172a',
];

const DEFAULT_COLOR = COLOR_OPTIONS[0];

const initialForm = {
  url: '',
  type: 'true',
  label: '',
  color: DEFAULT_COLOR,
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
  const [moduleFilters, setModuleFilters] = useState({});
  const [bulkActionCalendarId, setBulkActionCalendarId] = useState(null);
  const [editingCalendarId, setEditingCalendarId] = useState(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [typeDraft, setTypeDraft] = useState('true');
  const [calendarSavingId, setCalendarSavingId] = useState(null);
  const [calendarEditError, setCalendarEditError] = useState(null);
  const [colorDraft, setColorDraft] = useState(DEFAULT_COLOR);
  const [createColorPickerOpen, setCreateColorPickerOpen] = useState(false);

  const colorUsage = useMemo(() => {
    const counts = {};
    calendars.forEach((calendar) => {
      const key = calendar.color || DEFAULT_COLOR;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [calendars]);

  useEffect(() => {
    setModulesCache({});
    setExpandedId(null);
    setModuleFilters({});
    setEditingCalendarId(null);
    setLabelDraft('');
    setTypeDraft('true');
    setCalendarEditError(null);
    setColorDraft(DEFAULT_COLOR);
    setCreateColorPickerOpen(false);
  }, [projectId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const startCalendarEdit = (calendar) => {
    setEditingCalendarId(calendar.calendar_id);
    setLabelDraft(calendar.label || '');
    setTypeDraft(calendar.type ? 'true' : 'false');
    setColorDraft(calendar.color || DEFAULT_COLOR);
    setCalendarEditError(null);
  };

  const cancelCalendarEdit = () => {
    setEditingCalendarId(null);
    setLabelDraft('');
    setTypeDraft('true');
    setCalendarEditError(null);
    setColorDraft(DEFAULT_COLOR);
  };

  const saveCalendarDetails = async (calendarId) => {
    setCalendarEditError(null);
    setCalendarSavingId(calendarId);
    try {
      const trimmed = labelDraft.trim();
      await calendarApi.update(projectId, calendarId, {
        label: trimmed.length ? trimmed : null,
        type: typeDraft === 'true',
        color: colorDraft,
      });
      setFeedback('Calendrier mis à jour.');
      await onRefresh();
      setEditingCalendarId(null);
      setLabelDraft('');
      setTypeDraft('true');
      setColorDraft('#4c6ef5');
    } catch (error) {
      setCalendarEditError(error.message);
    } finally {
      setCalendarSavingId(null);
    }
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
        color: form.color || DEFAULT_COLOR,
      });
      setForm(initialForm);
      setCreateColorPickerOpen(false);
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

  const toggleAllModules = async (calendarId, shouldSelect) => {
    setModulesError(null);
    setBulkActionCalendarId(calendarId);
    setBusyCalendar(calendarId);
    try {
      const updatedModules = await moduleApi.setAll(projectId, calendarId, shouldSelect);
      setModulesCache((prev) => ({
        ...prev,
        [calendarId]: updatedModules,
      }));
    } catch (error) {
      setModulesError(error.message);
    } finally {
      setBulkActionCalendarId(null);
      setBusyCalendar(null);
    }
  };

  const handleModuleFilterChange = (calendarId, value) => {
    setModuleFilters((prev) => ({
      ...prev,
      [calendarId]: value,
    }));
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
            <span>Type de sélection</span>
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="true">Type 1 · nouveaux modules cochés</option>
              <option value="false">Type 2 · nouveaux modules décochés</option>
            </select>
          </label>
          <label className="form-field">
            <span>Couleur</span>
            <div className="color-picker-inline">
              <button
                type="button"
                className="color-swatch"
                style={{ backgroundColor: form.color }}
                onClick={() => setCreateColorPickerOpen((prev) => !prev)}
              >
                🎨
              </button>
              {createColorPickerOpen ? (
                <div className="color-picker color-picker--floating">
                  {COLOR_OPTIONS.map((color) => {
                    const usageCount = colorUsage[color] || 0;
                    const isSelected = form.color === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        className={`color-swatch ${isSelected ? 'is-selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            color,
                          }));
                          setCreateColorPickerOpen(false);
                        }}
                      >
                        <span className="color-swatch__check">{isSelected ? '✓' : ''}</span>
                        <span className="color-swatch__count">{usageCount}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
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
              const searchQuery = moduleFilters[calendar.calendar_id] || '';
              const normalizedQuery = searchQuery.trim().toLowerCase();
              const filteredModules =
                modules && normalizedQuery
                  ? modules.filter((module) =>
                      module.name.toLowerCase().includes(normalizedQuery),
                    )
                  : modules;
              const totalModules = modules ? modules.length : 0;
              const selectedModules = filteredModules
                ? filteredModules.filter((module) => module.is_selected)
                : [];
              const unselectedModules = filteredModules
                ? filteredModules.filter((module) => !module.is_selected)
                : [];
              const totalSelected = modules ? modules.filter((module) => module.is_selected).length : 0;
              const isBulkUpdating = bulkActionCalendarId === calendar.calendar_id;
              return (
                <li key={calendar.calendar_id} className="calendar-item">
                  <header>
                    <div className="calendar-title-block">
                      {editingCalendarId === calendar.calendar_id ? (
                        <div className="label-editor">
                          <label className="label-editor__field">
                            <span>Label</span>
                            <input
                              type="text"
                              value={labelDraft}
                              onChange={(event) => setLabelDraft(event.target.value)}
                              placeholder="Nouveau label"
                              disabled={calendarSavingId === calendar.calendar_id}
                            />
                          </label>
                          <label className="label-editor__field">
                            <span>Type de sélection</span>
                            <select
                              value={typeDraft}
                              onChange={(event) => setTypeDraft(event.target.value)}
                              disabled={calendarSavingId === calendar.calendar_id}
                            >
                              <option value="true">Type 1 · nouveaux modules cochés</option>
                              <option value="false">Type 2 · nouveaux modules décochés</option>
                            </select>
                          </label>
                          <label className="label-editor__field">
                            <span>Couleur</span>
                            <div className="color-picker color-picker--compact">
                              {COLOR_OPTIONS.map((color) => {
                                const usageCount = Math.max(
                                  0,
                                  (colorUsage[color] || 0) - (calendar.color === color ? 1 : 0),
                                );
                                const isSelected = colorDraft === color;
                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    className={`color-swatch ${isSelected ? 'is-selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setColorDraft(color)}
                                    disabled={calendarSavingId === calendar.calendar_id}
                                  >
                                    <span className="color-swatch__check">{isSelected ? '✓' : ''}</span>
                                    <span className="color-swatch__count">{usageCount}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </label>
                          <div className="label-editor__actions">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => saveCalendarDetails(calendar.calendar_id)}
                              disabled={calendarSavingId === calendar.calendar_id}
                            >
                              {calendarSavingId === calendar.calendar_id
                                ? 'Enregistrement…'
                                : 'Enregistrer'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-link"
                              onClick={cancelCalendarEdit}
                              disabled={calendarSavingId === calendar.calendar_id}
                            >
                              Annuler
                            </button>
                          </div>
                          {calendarEditError ? (
                            <p className="alert alert-error">{calendarEditError}</p>
                          ) : null}
                        </div>
                      ) : (
                        <>
                          <div className="calendar-title-row">
                            <h4>{calendar.label || calendar.url}</h4>
                          <div
                            className="calendar-color-chip"
                            style={{ backgroundColor: calendar.color || DEFAULT_COLOR }}
                            title={`Couleur : ${calendar.color || DEFAULT_COLOR}`}
                          />
                          </div>
                          <button
                            type="button"
                            className="btn btn-link"
                            onClick={() => startCalendarEdit(calendar)}
                          >
                            Modifier le label / type
                          </button>
                        </>
                      )}
                      <p className="text-muted">
                        {calendar.type
                          ? 'Type 1 · nouveaux modules cochés automatiquement'
                          : 'Type 2 · nouveaux modules décochés automatiquement'}{' '}
                        · {calendar.module_count} modules détectés
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
                      {modules ? (
                        <div className="module-toolbar">
                          <input
                            type="search"
                            placeholder="Rechercher un module"
                            value={searchQuery}
                            onChange={(event) =>
                              handleModuleFilterChange(calendar.calendar_id, event.target.value)
                            }
                          />
                          <div className="module-bulk-actions">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => toggleAllModules(calendar.calendar_id, true)}
                              disabled={!modules.length || isBulkUpdating}
                            >
                              Tout cocher
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => toggleAllModules(calendar.calendar_id, false)}
                              disabled={!modules.length || isBulkUpdating}
                            >
                              Tout décocher
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {modules && !modules.length ? (
                        <p className="text-muted">Aucun module détecté pour l’instant.</p>
                      ) : null}
                      {modules && normalizedQuery && !filteredModules.length ? (
                        <p className="text-muted">Aucun module ne correspond à votre recherche.</p>
                      ) : null}
                      {filteredModules && filteredModules.length ? (
                        <>
                          <div className="module-summary">
                            <span>
                              {totalSelected} module{totalSelected > 1 ? 's' : ''} cochés sur{' '}
                              {totalModules}
                            </span>
                            <span>{filteredModules.length} correspondent à votre recherche.</span>
                          </div>
                          <div className="module-stack">
                            <div className="module-group">
                              <p className="module-column-title">Modules cochés</p>
                              {selectedModules.length ? (
                                <ul className="module-list">
                                  {selectedModules.map((module) => (
                                    <li key={module.module_id}>
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked
                                          onChange={(event) =>
                                            toggleModule(
                                              calendar.calendar_id,
                                              module.module_id,
                                              event.target.checked,
                                            )
                                          }
                                          disabled={
                                            busyCalendar ===
                                              `${calendar.calendar_id}-${module.module_id}` ||
                                            isBulkUpdating
                                          }
                                        />
                                        <span>{module.name}</span>
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted small">Aucun module coché.</p>
                              )}
                            </div>
                            <div className="module-group">
                              <p className="module-column-title">Modules décochés</p>
                              {unselectedModules.length ? (
                                <ul className="module-list">
                                  {unselectedModules.map((module) => (
                                    <li key={module.module_id}>
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={false}
                                          onChange={(event) =>
                                            toggleModule(
                                              calendar.calendar_id,
                                              module.module_id,
                                              event.target.checked,
                                            )
                                          }
                                          disabled={
                                            busyCalendar ===
                                              `${calendar.calendar_id}-${module.module_id}` ||
                                            isBulkUpdating
                                          }
                                        />
                                        <span>{module.name}</span>
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted small">Aucun module décoché.</p>
                              )}
                            </div>
                          </div>
                        </>
                      ) : null}
                      <p className="text-muted explanation">
                        {calendar.type
                          ? 'Type 1 : les nouveaux modules sont cochés par défaut. Seuls les modules cochés apparaissent dans le planning.'
                          : 'Type 2 : les nouveaux modules sont décochés par défaut. Seuls les modules cochés apparaissent dans le planning.'}
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
