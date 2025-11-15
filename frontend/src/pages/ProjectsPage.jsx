import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../api/client.js';
import { useProjectStore } from '../store/projectStore.js';

const emptyForm = {
  name: '',
  start_date: '',
  end_date: '',
};

const ProjectsPage = () => {
  const projects = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const prependProject = useProjectStore((state) => state.prependProject);
  const selectProject = useProjectStore((state) => state.selectProject);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importing, setImporting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectApi.list();
        setProjects(data);
      } catch (error) {
        setFetchError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [setProjects]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      const created = await projectApi.create({
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      });
      prependProject(created);
      selectProject(created);
      setForm(emptyForm);
      navigate(`/app/projects/${created.project_id}`);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = (project) => {
    selectProject(project);
    navigate(`/app/projects/${project.project_id}`);
  };

  const handleImportConfig = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setImportError(null);
    setImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const created = await projectApi.importConfig(payload);
      prependProject(created);
      selectProject(created);
      navigate(`/app/projects/${created.project_id}`);
    } catch (err) {
      const message =
        err instanceof SyntaxError
          ? 'Fichier invalide : impossible de lire la configuration.'
          : err.message;
      setImportError(message);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="page page-projects">
      <header className="page-header">
        <div>
          <p className="hero-kicker">Mes projets</p>
          <h1>Construisez vos agendas personnalisés</h1>
          <p>Créez un projet par formation, par semestre ou par promo.</p>
        </div>
      </header>

      <section className="panel">
        <h2>Créer un projet</h2>
        {formError ? <p className="alert alert-error">{formError}</p> : null}
        <form className="grid grid-2 form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Nom du projet</span>
            <input
              type="text"
              name="name"
              placeholder="ex: BUT Info S4"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>
          <label className="form-field">
            <span>Date de début</span>
            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} />
          </label>
          <label className="form-field">
            <span>Date de fin</span>
            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} />
          </label>
          <div className="form-field align-end">
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Création...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Importer un projet existant</h2>
        <p className="text-muted">
          Importez un fichier de configuration (exporté depuis un autre projet) pour recréer automatiquement le projet
          et ses calendriers.
        </p>
        {importError ? <p className="alert alert-error">{importError}</p> : null}
        <label className="form-field">
          <span>Fichier de configuration (.json)</span>
          <input type="file" accept="application/json" onChange={handleImportConfig} disabled={importing} />
        </label>
        {importing ? <span className="badge">Import en cours...</span> : null}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Vos projets</h2>
          {loading ? <span className="badge">Chargement…</span> : null}
        </div>

        {fetchError ? <p className="alert alert-error">{fetchError}</p> : null}

        {!loading && !projects.length ? (
          <p className="empty-state">
            Aucun projet pour le moment. Utilisez le formulaire ci-dessus pour commencer.
          </p>
        ) : (
          <div className="card-grid">
            {projects.map((project) => (
              <article key={project.project_id} className="card">
                <div>
                  <h3>{project.name}</h3>
                  <p className="text-muted">
                    {project.start_date
                      ? `Du ${new Date(project.start_date).toLocaleDateString()}`
                      : 'Début libre'}{' '}
                    {project.end_date ? `au ${new Date(project.end_date).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => handleSelect(project)}>
                  Ouvrir
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProjectsPage;
