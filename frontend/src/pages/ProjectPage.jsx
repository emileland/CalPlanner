import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { calendarApi, projectApi } from '../api/client.js';
import ProjectSettingsTab from '../components/ProjectSettingsTab.jsx';
import ProjectCalendarTab from '../components/ProjectCalendarTab.jsx';
import ProjectCalendarsTab from '../components/ProjectCalendarsTab.jsx';
import { useProjectStore } from '../store/projectStore.js';

const tabs = [
  { id: 'settings', label: 'Paramètres' },
  { id: 'planner', label: 'Calendrier visuel' },
  { id: 'calendars', label: 'Gestion des calendriers' },
];

const ProjectPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [activeTab, setActiveTab] = useState('settings');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);

  const selectProject = useProjectStore((state) => state.selectProject);
  const updateProjectStore = useProjectStore((state) => state.updateProject);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectData, calendarsData] = await Promise.all([
          projectApi.getById(projectId),
          calendarApi.list(projectId),
        ]);
        setProject(projectData);
        setCalendars(calendarsData);
        selectProject(projectData);
        updateProjectStore(projectData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId, selectProject, updateProjectStore]);

  useEffect(() => {
    setActiveTab('settings');
  }, [projectId]);

  const refreshCalendars = async () => {
    const list = await calendarApi.list(projectId);
    setCalendars(list);
    return list;
  };

  const syncAllCalendars = async () => {
    if (!calendars.length) {
      return;
    }
    setSyncingAll(true);
    setError(null);
    try {
      for (const calendar of calendars) {
        await calendarApi.sync(projectId, calendar.calendar_id);
      }
      await refreshCalendars();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncingAll(false);
    }
  };

  const projectDates = useMemo(() => {
    if (!project) return '';
    if (!project.start_date && !project.end_date) {
      return 'Dates non définies';
    }
    const start = project.start_date ? new Date(project.start_date).toLocaleDateString() : 'libre';
    const end = project.end_date ? new Date(project.end_date).toLocaleDateString() : 'libre';
    return `Du ${start} au ${end}`;
  }, [project]);

  return (
    <div className="page page-project">
      <header className="page-header project-header">
        <div className="project-header__titles">
          <div>
            <p className="hero-kicker">Projet #{projectId}</p>
            <h1>{project?.name || 'Chargement...'}</h1>
            <p>{projectDates}</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={syncAllCalendars}
            disabled={syncingAll || !calendars.length}
          >
            {syncingAll ? 'Synchronisation...' : 'Synchroniser les calendriers'}
          </button>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {loading ? <p className="text-muted">Chargement des données...</p> : null}

      {!loading ? (
        <>
          {activeTab === 'settings' ? (
            <ProjectSettingsTab project={project} onProjectUpdated={setProject} />
          ) : null}
          {activeTab === 'planner' ? (
            <ProjectCalendarTab
              projectId={projectId}
              hasCalendars={calendars.length > 0}
              startHour={project?.view_start_hour}
              endHour={project?.view_end_hour}
            />
          ) : null}
          {activeTab === 'calendars' ? (
            <ProjectCalendarsTab projectId={projectId} calendars={calendars} onRefresh={refreshCalendars} />
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default ProjectPage;
