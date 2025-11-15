import { useEffect, useState } from 'react';
import { projectApi } from '../api/client.js';
import { useProjectStore } from '../store/projectStore.js';

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

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
      });
    }
  }, [project]);

  if (!project) {
    return <p className="text-muted">Sélectionnez un projet pour accéder aux paramètres.</p>;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  return (
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
  );
};

export default ProjectSettingsTab;
