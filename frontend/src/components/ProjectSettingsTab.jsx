import { useEffect, useState } from 'react';
import { projectApi } from '../api/client.js';
import { useProjectStore } from '../store/projectStore.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const ProjectSettingsTab = ({ project, onProjectUpdated }) => {
  const updateProjectInStore = useProjectStore((state) => state.updateProject);
  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
  });
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [icsFeedback, setIcsFeedback] = useState(null);
  const [icsError, setIcsError] = useState(null);
  const [downloadingIcs, setDownloadingIcs] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);
  const [regeneratingLink, setRegeneratingLink] = useState(false);
  const [configFeedback, setConfigFeedback] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [exportingConfig, setExportingConfig] = useState(false);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
      });
      setIcsFeedback(null);
      setIcsError(null);
      setConfigFeedback(null);
      setConfigError(null);
    }
  }, [project]);

  if (!project) {
    return <p className="text-muted">Sélectionnez un projet pour accéder aux paramètres.</p>;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getIcsFilename = () => {
    const base =
      project?.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `projet-${project?.project_id || 'calplanner'}`;
    return `${base || 'calplanner'}.ics`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const updated = await projectApi.update(project.project_id, {
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      });
      updateProjectInStore(updated);
      onProjectUpdated?.(updated);
      setFeedback('Projet mis à jour');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadIcs = async () => {
    setDownloadingIcs(true);
    setIcsError(null);
    setIcsFeedback(null);
    try {
      const blob = await projectApi.exportIcs(project.project_id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getIcsFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setIcsFeedback('Fichier ICS téléchargé.');
    } catch (err) {
      setIcsError(err.message);
    } finally {
      setDownloadingIcs(false);
    }
  };

  const publicIcsUrl = project.public_ics_token
    ? `${API_BASE.replace(/\/$/, '')}/public/projects/${project.public_ics_token}/ics`
    : null;

  const handleCopyLink = async () => {
    if (!publicIcsUrl) {
      return;
    }
    setCopyingLink(true);
    setIcsFeedback(null);
    setIcsError(null);
    try {
      await navigator.clipboard.writeText(publicIcsUrl);
      setIcsFeedback('Lien copié dans le presse-papiers.');
    } catch (err) {
      setIcsError("Impossible de copier automatiquement. Copiez le lien manuellement.");
      console.error(err);
    } finally {
      setCopyingLink(false);
    }
  };

  const handleRegenerateLink = async () => {
    setRegeneratingLink(true);
    setIcsFeedback(null);
    setIcsError(null);
    try {
      const updated = await projectApi.regenerateIcsToken(project.project_id);
      updateProjectInStore(updated);
      onProjectUpdated?.(updated);
      setIcsFeedback('Nouveau lien généré.');
    } catch (err) {
      setIcsError(err.message);
    } finally {
      setRegeneratingLink(false);
    }
  };

  const handleExportConfig = async () => {
    setExportingConfig(true);
    setConfigError(null);
    setConfigFeedback(null);
    try {
      const config = await projectApi.exportConfig(project.project_id);
      const filename = `${getIcsFilename().replace(/\.ics$/i, '') || 'calplanner'}-config.json`;
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setConfigFeedback('Configuration exportée.');
    } catch (err) {
      setConfigError(err.message);
    } finally {
      setExportingConfig(false);
    }
  };

  return (
    <div className="project-settings">
      <form className="form grid grid-2" onSubmit={handleSubmit}>
        {error ? <p className="alert alert-error">{error}</p> : null}
        {feedback ? <p className="alert alert-success">{feedback}</p> : null}

        <label className="form-field">
          <span>Nom du projet</span>
          <input type="text" name="name" value={form.name} onChange={handleChange} required />
        </label>

        <label className="form-field">
          <span>Date de début</span>
          <input type="date" name="start_date" value={form.start_date || ''} onChange={handleChange} />
        </label>

        <label className="form-field">
          <span>Date de fin</span>
          <input type="date" name="end_date" value={form.end_date || ''} onChange={handleChange} />
        </label>

        <div className="form-field align-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>

      <section className="panel">
        <h3>Exporter vers Google Calendar / ICS</h3>
        <p className="text-muted">
          Utilisez le lien sécurisé pour synchroniser automatiquement le projet dans Google Calendar (S’abonner à un
          calendrier) ou téléchargez un fichier ICS ponctuel.
        </p>
        {icsError ? <p className="alert alert-error">{icsError}</p> : null}
        {icsFeedback ? <p className="alert alert-success">{icsFeedback}</p> : null}
        {publicIcsUrl ? (
          <div className="ics-link">
            <input type="text" value={publicIcsUrl} readOnly onFocus={(event) => event.target.select()} />
            <div className="ics-link__actions">
              <button type="button" className="btn btn-secondary" onClick={handleCopyLink} disabled={copyingLink}>
                {copyingLink ? 'Copie...' : 'Copier'}
              </button>
              <a className="btn btn-link" href={publicIcsUrl} target="_blank" rel="noopener noreferrer">
                Ouvrir
              </a>
            </div>
          </div>
        ) : null}
        <button type="button" className="btn btn-secondary" onClick={handleDownloadIcs} disabled={downloadingIcs}>
          {downloadingIcs ? 'Génération en cours...' : 'Télécharger le fichier ICS'}
        </button>
        <button
          type="button"
          className="btn btn-link"
          onClick={handleRegenerateLink}
          disabled={regeneratingLink}
        >
          {regeneratingLink ? 'Regénération...' : 'Regénérer le lien sécurisé'}
        </button>
      </section>

      <section className="panel">
        <h3>Configuration du projet</h3>
        <p className="text-muted">
          Exportez cette configuration pour la partager ou la réimporter ailleurs. Le fichier inclut le projet et tous
          les calendriers rattachés.
        </p>
        {configError ? <p className="alert alert-error">{configError}</p> : null}
        {configFeedback ? <p className="alert alert-success">{configFeedback}</p> : null}
        <button type="button" className="btn btn-secondary" onClick={handleExportConfig} disabled={exportingConfig}>
          {exportingConfig ? 'Export en cours...' : 'Exporter la configuration (.json)'}
        </button>
      </section>
    </div>
  );
};

export default ProjectSettingsTab;
