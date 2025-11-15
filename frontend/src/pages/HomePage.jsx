import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Combiner plusieurs sources',
    description:
      'Importez autant de calendriers ADE ou ICS que nécessaire. CalPlanner fusionne automatiquement les événements.',
  },
  {
    title: 'Filtrer vos modules',
    description:
      'Sélectionnez les cours à conserver selon le mode inclusif/exclusif pour vous concentrer sur l’essentiel.',
  },
  {
    title: 'Vue calendrier ergonomique',
    description:
      'Visualisez votre planning consolidé en vue hebdo ou mensuelle grâce à un calendrier interactif.',
  },
];

const HomePage = () => (
  <div className="page page-home">
    <header className="hero">
      <div className="hero-copy">
        <p className="hero-kicker">Gestion intelligente des agendas étudiants</p>
        <h1>Simplifiez vos semaines avec un calendrier personnalisé</h1>
        <p>
          Synchronisez vos sources ADE, filtrez vos modules en un clic et produisez un agenda parfaitement
          aligné avec vos priorités.
        </p>
        <div className="hero-cta">
          <Link to="/login" className="btn btn-primary">
            Commencer maintenant
          </Link>
          <Link to="/login" className="btn btn-secondary">
            J’ai déjà un compte
          </Link>
        </div>
      </div>
      <div className="hero-panel">
        <p>Stack</p>
        <ul>
          <li>React + Vite</li>
          <li>Express + PostgreSQL</li>
          <li>JWT Auth</li>
        </ul>
      </div>
    </header>

    <section className="features">
      {features.map((feature) => (
        <article key={feature.title} className="feature-card">
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </article>
      ))}
    </section>
  </div>
);

export default HomePage;
