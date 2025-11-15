# CalPlanner

Application complète Express + React pour fusionner plusieurs calendriers étudiants (ADE, ICS, …), filtrer les modules et produire un agenda unique par projet.

## Architecture

- **Backend** : Node.js + Express, PostgreSQL, JWT, parser ICS (`node-ical`), services decoupés (auth, projets, calendriers, modules, événements).
- **Frontend** : React (Vite), Zustand pour l’état global, React Router, FullCalendar pour l’affichage visuel.
- **Base de données** : PostgreSQL (script `backend/db/schema.sql`).

## Prérequis

- Node.js 20+
- PostgreSQL 14+

## Mise en place

1. **Cloner le repo puis installer les dépendances** :

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Initialiser la base** :

   ```bash
   createdb calplanner
   psql -d calplanner -f backend/db/schema.sql
   ```

3. **Configurer l’environnement** :

   - Copier `backend/.env.example` vers `backend/.env` et ajuster `JWT_SECRET`, la connexion PostgreSQL et l’URL du frontend (`CLIENT_ORIGIN`).
   - Dans `frontend`, créer un fichier `.env` avec :

     ```env
     VITE_API_URL=http://localhost:4000/api
     ```

4. **Lancer les serveurs** :

   ```bash
   # Terminal 1
   cd backend
   npm run dev

   # Terminal 2
   cd frontend
   npm run dev
   ```

5. Ouvrir `http://localhost:5173` et créer votre premier compte.

## Fonctionnalités clés

### Backend

- Authentification JWT (inscription, connexion, profil).
- CRUD complet : utilisateurs, projets, calendriers, modules.
- Synchronisation ICS via `node-ical` : récupération, parsing, extraction des modules, génération d’événements en base.
- Filtrage métier : gestion des calendriers inclusifs/exclusifs et calcul des événements visibles côté API.
- Gestion des erreurs centralisée + middleware d’accès sécurisé.

### Frontend

- SPA React + React Router (Homepage, Login, Dashboard).
- Zustand pour stocker la session utilisateur et les projets.
- Pages :
  - **Mes projets** : listing + création.
  - **Projet** avec 3 onglets :
    1. Paramètres (dates, nom…),
    2. Calendrier visuel (FullCalendar, vue hebdo/mensuelle),
    3. Gestion des calendriers (ajout, sync, modules, filtres inclusif/exclusif).
- UI responsive (CSS custom) avec formulaires validés, alertes et états de chargement.

## Scripts disponibles

| Dossier   | Script           | Description                              |
| --------- | ---------------- | ---------------------------------------- |
| backend   | `npm run dev`    | Nodemon + Express + connexion PostgreSQL |
| backend   | `npm start`      | Serveur en production                    |
| frontend  | `npm run dev`    | Dev server Vite avec HMR                 |
| frontend  | `npm run build`  | Build de production                      |
| frontend  | `npm run preview`| Prévisualisation du build                |

## Notes

- Chaque ajout de calendrier déclenche immédiatement une synchronisation ICS (stockage des modules + événements).
- Le champ `type` des calendriers pilote le filtrage :
  - `true` → inclusif : seuls les modules cochés sont visibles.
  - `false` → exclusif : tous visibles sauf les modules décochés.
- Le script SQL crée tous les index/contraintes nécessaires, avec suppression en cascade (projets → calendriers → modules → événements).

Bon build ✨
