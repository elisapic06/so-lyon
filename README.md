# So Lyon 🦁

**Les bons plans food & sorties à Lyon, partagés par ceux qui y vivent.**

PWA mobile (installable sur iPhone/Android via « Ajouter à l'écran d'accueil ») — un mix Strava × Instagram centré sur Lyon et ses alentours.

## Fonctionnalités

- **Fil social** — posts avec photos, filtres par catégorie, « Mes envies » personnalisé
- **7 404 lieux réels** (OpenStreetMap) — restos, bars, boîtes, parcs, musées, salles de sport...
- **Fiches lieux sérieuses** — horaires (avec ouvert/fermé en temps réel), téléphone, terrasse, PMR, veggie, petit prix
- **Carte interactive** — Leaflet stylée, épingles emoji par catégorie, clustering, filtres, quartiers, GPS « Autour de moi »
- **Comptes** — particulier ou **professionnel** (un lieu revendique sa page, badge PRO)
- **Followers** — suivre les profils, voir leurs posts en grille
- **Défis** — créés par la communauté, avec progression
- **Badges** et **to-do list** publique/privée
- **Onboarding** — choix des centres d'intérêt

## Mode autonome (par défaut)

L'app fonctionne **100 % en local** : posts, to-dos et photos sont stockés dans le navigateur (localStorage + IndexedDB). Aucune configuration requise.

## Activer le mode cloud (comptes + partage)

1. Crée un projet gratuit sur [supabase.com](https://supabase.com)
2. SQL Editor → colle le contenu de [`supabase/schema.sql`](supabase/schema.sql) → **Run**
3. Settings → API → copie **Project URL** et **anon key**
4. Dans `js/cloud.js`, remplis :
   ```js
   const SUPABASE_CONFIG = {
     url: "https://xxxx.supabase.co",
     anonKey: "eyJhbGciOi...",
   };
   ```
5. Commit + push → l'app active automatiquement : comptes, posts partagés, likes, followers

## Déploiement

L'app est statique et déployée sur **GitHub Pages** :
👉 https://elisapic06.github.io/so-lyon/

Chaque push sur `main` redéploie automatiquement (workflow `.github/workflows/pages.yml`).

## Structure

```
index.html          — point d'entrée
manifest.webmanifest — PWA (installable)
css/style.css       — design system (crème/terracotta)
js/data.js          — données de démonstration
js/cloud.js         — couche Supabase (activable par clés)
js/app.js           — logique de l'app
data/places.json    — 7 404 lieux Lyon (OpenStreetMap)
data/photos.json    — photos sous licence libre (Wikimedia Commons)
supabase/schema.sql — base de données + sécurité RLS
```

## Crédits données

- Lieux : © OpenStreetMap contributors (ODbL)
- Photos : Wikimedia Commons (licences libres)
