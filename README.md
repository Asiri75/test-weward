# Fog of War — use case WeWard

Une couche d'exploration sur la carte : **ta marche révèle le territoire**. Ce que tu n'as jamais parcouru reste dans le brouillard. Persistant, synchronisé entre appareils, et ça compte même quand l'app est fermée.

Feature Expo (React Native + TypeScript), à partir du use case fourni par WeWard.

## L'idée

Tu marches, ta position tombe dans une grille d'hexagones **H3**. Chaque hexagone traversé passe de "brouillard" à "révélé". La carte devient un objet perso qui prend de la valeur au fil des trajets.

## Architecture

Le coeur (logique pure) est séparé de l'IO (localisation, stockage, carte, sync) par des interfaces. Chaque module a une seule responsabilité et se teste seul.

```
LocationSource → WalkDetector → ExplorationEngine → Store + State → FogLayer
                                                       │
                                                       └→ SyncService (push / pullMerged = union)
```

| Module | Rôle |
|---|---|
| `core/walkDetector` | Décide si un point compte comme marche (vitesse, précision, anti-teleport). Pur, testé. |
| `core/explorationEngine` | Point → hexagones H3 (courant + anneau), diff des nouveaux. Pur, testé. |
| `core/fogGeometry` | Hexagones explorés → géométrie du fog (viewport moins l'union, via turf). |
| `services/locationSource` | `DeviceLocationSource` (réel) et `createSimulatedSource` (démo). |
| `services/explorationStore` | Persistance MMKV (storage injecté). |
| `services/syncService` | Interface + mock (union cross-device). Se remplace par un vrai backend sans toucher au reste. |
| `services/backgroundTask` | Tâche expo-task-manager qui alimente le pipeline app fermée. |
| `state/useExploration` | Zustand : câble détecteur, moteur, persistance, sync. |

## Les arbitrages (le vrai sujet du test)

- **Grille H3, pas de traces GPS.** On ne stocke et n'envoie que des IDs d'hexagones. Data minimale, pas de GPS brut. La résolution (défaut 10, ~65m) est le curseur précision / batterie / vie privée.
- **Marche seulement.** Détection multi-signaux, du moins cher au plus cher : vitesse (> ~9 km/h ignoré), plausibilité (anti-spoof), qualité du point. En prod on renforce avec l'activité OS native (module natif).
- **Consentement iOS en 2 étapes.** "Pendant l'utilisation" à l'onboarding, puis "Toujours" après la première révélation. Refus = mode réduit (foreground only), jamais de crash.
- **Perf.** Fog rendu en une seule couche Mapbox (GPU). La géométrie ne se recalcule que si l'ensemble exploré change ou si le viewport bouge (mises à jour throttlées).
- **Sync.** Union d'ensembles, donc monotone et idempotente. File offline, réconciliation à la reconnexion.

## Stack

Expo (dev build), TypeScript, @rnmapbox/maps, expo-location, expo-task-manager, expo-notifications, h3-js, @turf/turf, react-native-mmkv, zustand, @tanstack/react-query, react-native-reanimated, Sentry, Jest.

## Lancer le projet

```bash
npm install
```

1. Compte Mapbox (gratuit) : un token public (`pk...`) et un token de téléchargement avec le scope `DOWNLOADS:READ` (`sk...`).
2. Un fichier `.env.local` (ignoré par git, aucun secret versionné) :

```
EXPO_PUBLIC_MAPBOX_TOKEN=pk_ton_token_public
MAPBOX_DOWNLOAD_TOKEN=sk_ton_token_de_telechargement
```

3. Dev build (Mapbox natif, pas Expo Go) :

```bash
npx expo run:android   # ou npx expo run:ios
```

Stack sur la dernière version (Expo SDK 57, RN 0.86, React 19). Le build iOS demande Xcode 26.1+ (SDK 57 utilise du Swift 6.2).

## Démo

Trois boutons sur la carte : **Réel** (GPS du device), **Simuler marche** (le fog recule), **Simuler voiture** (le fog ne bouge pas, preuve marche-only). Tape une carte WeWard pour l'animation de collection. Bouton **Réinitialiser** pour repartir de zéro.

## Tests

```bash
npm test
```

Le périmètre est **volontairement ciblé** : les deux unités qui portent le vrai risque, `walkDetector` (branches, cas limites) et `explorationEngine` (coeur H3). On teste ce qui casse, pas pour une couverture cosmétique. Le reste est validé par le typecheck et la démo sur émulateur.

## Hors scope (évolutions prod)

Vrai backend + auth (l'interface `SyncService` est déjà prête). Module natif d'activité pour la détection de marche. Vrai système de POI/WeCards. Anti-triche validé côté serveur.

## Comment c'est développé (transparence)

Fait avec **Claude Code** (modèle **Opus**). Je pilote, l'IA exécute. La méthode :

1. J'ai donné le cahier des charges et répondu aux questions de cadrage (modèle H3, marche-only, consentement, sync).
2. J'ai fait scraper vos offres d'emploi (dev front / mobile) pour reprendre votre stack sur ce projet.
3. On a brainstormé l'architecture et les librairies (skill *brainstorming* de Superpowers), puis découpé en tâches (*writing-plans*).
4. Développement en TDD sur le coeur, commits réguliers.
5. Surtout : j'ai fait tourner l'app **en vrai sur émulateur, pas à pas**. Ça a permis d'attraper des bugs runtime que les tests ne voyaient pas (crash h3-js sur le décodage de chaînes, crash de permission, bug de résolution du fog).

La valeur n'est pas "l'IA a codé", mais les décisions d'archi, les arbitrages (batterie, vie privée, perf) et la vérification en conditions réelles.
