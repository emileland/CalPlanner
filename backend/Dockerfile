FROM node:20-alpine AS base

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm ci --omit=dev

# Copier le code
COPY . .

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=4000

# Assure-toi que ton server écoute sur 0.0.0.0 dans src/server.js
EXPOSE 4000

CMD ["node", "src/server.js"]
