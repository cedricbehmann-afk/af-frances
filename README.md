# AF · Francés con Coco

Appli pour apprendre le français (Worker Cloudflare, un seul fichier).

- `worker.js` : le fichier déployé (généré, ne pas modifier à la main)
- `src/` : sources (appli, service worker, mots dans `data.js`)
- `node build.mjs && cp dist/worker.js worker.js` : régénère `worker.js`
- `voices/w0.m4a`, `voices/p0.m4a`… : enregistrements de voix intégrés au build
