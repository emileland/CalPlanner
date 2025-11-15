import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client.js';
import { useAuthStore } from '../store/authStore.js';

const LoginPage = () => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const setSession = useAuthStore((state) => state.setSession);
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || '/app/projects';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload =
        mode === 'login'
          ? await authApi.login({
              username: form.username,
              password: form.password,
            })
          : await authApi.register({
              username: form.username,
              email: form.email,
              password: form.password,
            });

      setSession(payload);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-auth">
      <section className="auth-card">
        <header>
          <p className="hero-kicker">CalPlanner</p>
          <h1>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
          <p>
            {mode === 'login'
              ? 'Connectez-vous pour gérer vos projets et synchroniser vos calendriers.'
              : 'Inscrivez-vous pour commencer à créer vos agendas personnalisés.'}
          </p>
        </header>

        {error ? <p className="alert alert-error">{error}</p> : null}

        <form className="form" onSubmit={submit}>
          <label className="form-field">
            <span>Nom d’utilisateur</span>
            <input
              type="text"
              name="username"
              placeholder="ex: e.dupont"
              value={form.username}
              onChange={handleChange}
              required
            />
          </label>

          {mode === 'register' ? (
            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="prenom.nom@campus.fr"
                value={form.email}
                onChange={handleChange}
                required={mode === 'register'}
              />
            </label>
          ) : null}

          <label className="form-field">
            <span>Mot de passe</span>
            <input
              type="password"
              name="password"
              placeholder="Minimum 8 caractères"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <button type="button" onClick={() => setMode('register')}>
                Inscrivez-vous
              </button>
            </>
          ) : (
            <>
              Déjà inscrit ?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Connectez-vous
              </button>
            </>
          )}
        </p>

        <p className="auth-footnote">
          Besoin d’aide ? <Link to="/">Retourner à l’accueil</Link>
        </p>
      </section>
    </div>
  );
};

export default LoginPage;
