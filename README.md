# Fog of War — WeWard use case

Une couche d'exploration sur la carte : **la marche révèle le territoire**. Ce qui n'a jamais été parcouru reste dans le brouillard. Persistant, synchronisé entre appareils, et récompense la marche même app fermée.

Feature Expo (React Native + TypeScript).

---

## Idée en une phrase

L'utilisateur marche, sa position alimente une grille d'hexagones **H3**. Chaque hexagone traversé passe de "brouillard" à "révélé". La carte devient un objet personnel qui prend de la valeur avec la marche.

---

## Architecture

Le coeur (logique pure) est découplé de l'IO (localisation, stockage, carte, sync) derrière des interfaces. Chacun a une seule responsabilité et se teste seul.

```
LocationSource → WalkDetector → ExplorationEngine → Store + State → FogRenderer
                                                        │
                                                        └→ SyncService (push / pullMerged = union)
```

| Module | Rôle |
|---|---|
| `core/walkDetector` | Décide si un fix compte comme marche (vitesse, précision, anti-teleport). Pur, testé. |
| `core/explorationEngine` | Fix → hexagones H3 (courant + anneau), diff des nouveaux. Pur, testé. |
| `core/fogGeometry` | Hexagones explorés → géométrie du fog (viewport moins l'union, via turf). |
| `core/stats` | Couverture du quartier. |
| `services/locationSource` | `DeviceLocationSource` (expo-location) et `createSimulatedSource` (démo). |
| `services/explorationStore` | Persistance MMKV (storage injecté). |
| `services/syncService` | Interface + mock (union cross-device). Se remplace par un vrai backend sans toucher au reste. |
| `services/backgroundTask` | Tâche expo-task-manager qui alimente le pipeline app fermée. |
| `state/useExploration` | Zustand : câble détecteur, moteur, persistance, sync. |
| `components/FogLayer` | Couche fill Mapbox du fog. |

## Arbitrages (le coeur du sujet)

- **Grille H3** plutôt que traces GPS : data agrégée et minimale (juste des IDs d'hexagones), pas de GPS brut stocké ni envoyé. La résolution (défaut 10, ~65m) est le curseur précision / batterie / vie privée.
- **Marche seulement** : détection multi-signaux, du moins cher au plus cher. Vitesse (> ~9 km/h ignoré), plausibilité (anti-spoof), qualité du fix. L'activité OS native (CMMotionActivity / ActivityRecognition) est l'évolution prod, via module natif.
- **Consentement iOS en 2 étapes** : "Pendant l'utilisation" à l'onboarding, puis "Toujours" après la première révélation (moment de valeur). Refus = mode réduit (foreground only), jamais de crash.
- **Perf** : fog rendu en une couche Mapbox GPU, géométrie recalculée seulement quand l'ensemble exploré ou le viewport change. Compaction H3 pour réduire les polygones.
- **Sync** : monotone et idempotente (union d'ensembles), file d'attente offline, réconciliation à la reconnexion.

---

## Stack

Expo (dev build), TypeScript, @rnmapbox/maps, expo-location, expo-task-manager, expo-notifications, h3-js, @turf/turf, react-native-mmkv, zustand, @tanstack/react-query, Sentry, Jest.

---

## Lancer le projet

```bash
npm install
```

1. Compte Mapbox (gratuit). Récupère ton token public (`pk...`) et crée un token de téléchargement avec le scope `DOWNLOADS:READ` (`sk...`).
2. Crée un fichier `.env.local` (ignoré par git, aucun secret n'est versionné) :

```
EXPO_PUBLIC_MAPBOX_TOKEN=pk_ton_token_public
MAPBOX_DOWNLOAD_TOKEN=sk_ton_token_de_telechargement
```

`app.config.js` injecte le token de téléchargement dans le plugin Mapbox au build.

3. Dev build (Mapbox natif, pas Expo Go) :

```bash
npx expo run:ios     # ou npx expo run:android
```

---

## Démo

Trois boutons sur la carte :
- **Réel** : localisation réelle du device.
- **Simuler marche** : rejoue un trajet à pied, le fog recule en temps réel.
- **Simuler voiture** : trajet rapide, le fog **ne bouge pas** (preuve marche-only).

Script vidéo : onboarding + permissions → simuler marche (fog recule) → tuer/rouvrir l'app (persistance) → l'onglet Explorateur (stats + patch synchronisé du device B) → simuler voiture (rien ne se révèle).

---

## Tests

```bash
npm test
```

Le périmètre de test est **volontairement ciblé** sur les deux unités qui portent le vrai risque : `walkDetector` (branches + cas limites) et `explorationEngine` (coeur H3). C'est la preuve qu'on fait du test unitaire sans viser une couverture cosmétique. Le reste est validé par le typecheck et la démo.

---

## Hors scope (évolutions prod citées)

- Vrai backend + auth (interface `SyncService` déjà prête, mock aujourd'hui).
- Module natif d'activité (marche) pour renforcer la détection.
- Vrai système de POI/WeCards (quelques pins mockés ici).
- Validation anti-triche côté serveur.
