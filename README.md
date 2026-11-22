# AF · Francés con Coco

Appli pour apprendre le français (Worker Cloudflare, un seul fichier). Chaque push sur `main` est déployé automatiquement.

- `worker.js` : le fichier déployé (généré, ne pas modifier à la main)
- `src/data.js` : les mots (`W`, 6 par jour), les phrases du jour (`P`) et les phrases de compréhension (`SEN`, avec le jour à partir duquel elles apparaissent)
- `src/app.html` : l'appli ; niveaux dans `LV` (100, 250, 500, 800, 1150, 1500 mots)
- `node build.mjs <version> && cp dist/worker.js worker.js` : régénère `worker.js`
- `/api/config` renvoie la version en ligne
- Contenu écrit : niveaux 1 et 2 (252 mots, 186 phrases). Niveaux 3 à 6 à ajouter à la suite dans `W` et `SEN`, sans changer l'ordre existant.
