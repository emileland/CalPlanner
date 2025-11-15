import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="page page-not-found">
    <h1>404</h1>
    <p>La page demandée est introuvable.</p>
    <Link to="/" className="btn btn-primary">
      Retourner à l’accueil
    </Link>
  </div>
);

export default NotFoundPage;
