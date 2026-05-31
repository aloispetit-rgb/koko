# Koko — App de routine quotidienne pour enfant

Application web statique (PWA) permettant à un enfant de suivre ses tâches
quotidiennes en fonction de l'heure et du jour. Utilisée en autonomie complète
sur un seul appareil (smartphone), avec une interface parent protégée par PIN.

---

## Stack technique

- **Générateur de site statique** : Eleventy (11ty) v3
- **Templating** : HTML + Nunjucks (`.njk`) pour les layouts et composants
- **Styles** : CSS vanilla — custom properties, pas de framework
- **Logique** : JS vanilla — pas de framework, pas de bundler JS
- **Stockage** : `localStorage` uniquement — stateless, pas de backend
- **PWA** : `manifest.json` + `service-worker.js` manuels
- **Déploiement** : GitHub Pages (dossier `_site/` généré par Eleventy)
- **Polices** : Google Fonts — Baloo 2 (titres/heure) + Nunito (textes)

---

## Commandes du projet

```bash
npm install           # Installer les dépendances
npm run dev           # Serveur de développement avec live reload
npm run build         # Génère le dossier _site/ pour GitHub Pages
```

---

## Architecture des fichiers

```
/
├── src/
│   ├── _includes/
│   │   ├── layout.njk            # Layout HTML global (head, meta, PWA)
│   │   ├── header.njk            # Header fixe (heure + date)
│   │   ├── task-card.njk         # Composant carte tâche cochable
│   │   ├── smiley-badge.njk      # Composant smiley coloré
│   │   └── pin-gate.njk          # Écran de saisie PIN parent
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css         # Styles globaux + custom properties
│   │   │   ├── child.css         # Styles vue enfant
│   │   │   └── parent.css        # Styles interface parent
│   │   ├── js/
│   │   │   ├── app.js            # Logique vue enfant (timeline, cochage)
│   │   │   ├── parent.js         # Logique interface parent (CRUD)
│   │   │   ├── calendar.js       # Logique calendrier mensuel + smileys
│   │   │   ├── storage.js        # Lecture/écriture localStorage
│   │   │   ├── recurrence.js     # Résolution des règles de récurrence
│   │   │   ├── scheduleUtils.js  # Résolution des créneaux → plages horaires
│   │   │   ├── smiley.js         # Calcul smiley selon % complétion
│   │   │   ├── timeUtils.js      # Utilitaires date/heure
│   │   │   └── sw.js             # Service Worker (cache PWA)
│   │   └── img/
│   │       └── tasks/            # Images optionnelles associées aux tâches
│   ├── index.njk                 # Vue enfant (écran principal)
│   ├── parent.njk                # Interface parent (protégée PIN)
│   └── manifest.json             # Manifest PWA
├── _site/                        # Généré — ne pas modifier manuellement
├── .eleventy.js                  # Configuration Eleventy
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions → deploy sur GitHub Pages
└── CLAUDE.md
```

---

## Configuration Eleventy (`.eleventy.js`)

```js
module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/manifest.json");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
    templateFormats: ["njk", "html"],
  };
};
```

---

## Modèle de données (localStorage)

Toutes les données sont stockées en JSON dans le localStorage.

| Clé | Contenu |
|-----|---------|
| `koko:tasks` | Tableau de toutes les tâches (actives + archivées) |
| `koko:completions:YYYY-MM-DD` | `{ "{taskId}:{scheduleIndex}": true }` |
| `koko-pin` | PIN parent haché (SHA-256) |

---

### Concept clé : la tâche est autonome

Chaque tâche gère son propre horaire, sa récurrence et son cycle de vie.
Il n'y a pas de "période" conteneur — une tâche est une entité indépendante.

Si la même tâche doit apparaître à deux moments différents dans la journée
(ex. "Se brosser les dents" matin et soir), on ajoute deux entrées dans
`schedules`. Chaque entrée génère une instance indépendante à cocher.

---

### Modèle d'une tâche

```js
{
  // Identité
  id: "uuid-v4",                  // Identifiant unique stable, généré à la création
  label: "Se brosser les dents",  // Texte affiché à l'enfant
  emoji: "🦷",                    // Emoji (utilisé si pas d'image)
  image: null,                    // URL ou path d'une image (prioritaire sur emoji)

  // Horaires d'affichage
  // Chaque entrée génère une instance indépendante à cocher dans la vue enfant
  schedules: [
    { type: "period", value: "matin" },   // Valeurs : matin | matinée | midi | après-midi | goûter | soir | nuit
    { type: "time",   value: "19:30" }    // Format HH:MM
  ],

  // Récurrence
  recurrence: {
    every: 1,                        // Intervalle : tous les X...
    unit: "weeks",                   // ...jours | semaines | mois | années
    days: ["lundi", "vendredi"],     // Uniquement si unit === "weeks"
    dayOfMonth: null,                // Uniquement si unit === "months" : ex. 15 = le 15 du mois
    untilCompletion: false,          // true = répète chaque jour jusqu'au premier cochage, puis s'archive
  },

  // Fin de récurrence (ignoré si untilCompletion === true)
  end: {
    type: "never",        // never | date | occurrences
    date: null,           // Si type === "date" : "2026-12-31"
    occurrences: null     // Si type === "occurrences" : nombre d'occurrences avant arrêt
  },

  // Exceptions
  // Liste de dates ISO 8601 pour lesquelles la tâche ne doit pas s'afficher
  exceptions: ["2026-11-11", "2026-12-25"],

  // Cycle de vie
  createdAt: "2026-05-30T08:00:00Z",   // Toujours renseigné à la création
  deletedAt: null,                      // null = active | date ISO = supprimée (soft delete)
  completedAt: null,                    // Renseigné uniquement si untilCompletion === true et tâche cochée
}
```

---

## Logique métier

### Résolution des instances du jour (`recurrence.js` + `scheduleUtils.js`)

```
1. Récupérer la date du jour
2. Pour chaque tâche (deletedAt === null) :
   a. Si untilCompletion === true et completedAt !== null → ignorer
   b. Vérifier que la date n'est pas dans exceptions[]
   c. Vérifier que la récurrence couvre la date courante
   d. Vérifier que la date est dans la fenêtre de fin (end.type, end.date, end.occurrences)
   e. Pour chaque entrée dans schedules → générer une instance affichable indépendante
3. Trier toutes les instances par heure de début de créneau croissante
4. Afficher la timeline
```

### Résolution de l'horaire d'une instance (`scheduleUtils.js`)

| Type | Plage d'affichage |
|---|---|
| `period: "matin"` | 6h00 – 11h59 |
| `period: "matinée"` | 9h00 – 12h59 |
| `period: "midi"` | 12h00 – 13h59 |
| `period: "après-midi"` | 14h00 – 16h59 |
| `period: "goûter"` | 16h00 – 17h59 |
| `period: "soir"` | 18h00 – 20h59 |
| `period: "nuit"` | 21h00 – 5h59 |
| `time: "HH:MM"` | 30 min avant → 30 min après l'heure définie |

Les plages sont définies uniquement dans `scheduleUtils.js` — ne pas les hardcoder ailleurs.

### Rafraîchissement automatique (`app.js`)

- Toutes les **60 secondes** : recalcul des tâches visibles selon l'heure
- Toutes les **60 secondes** : mise à jour de l'heure dans le header
- À minuit : remise à zéro automatique (nouveau jour)
- Au chargement : scroll automatique vers le moment en cours, puis scroll libre

### Stockage des cochages

```js
// Clé par date, valeur = objet indexé par taskId + index du schedule
koko:completions:2026-05-30 = {
  "uuid-dents:0": true,   // instance matin cochée
  "uuid-dents:1": false,  // instance soir pas encore cochée
}
```

---

## Cycle de vie d'une tâche

```
[active]
   │
   ├─ Supprimée par le parent ──────────────────► [soft deleted]  deletedAt = date
   │                                                    │
   │                                                    ├─ Restaurée ──► [active]
   │                                                    │
   │                                                    └─ Supprimée définitivement ──► retirée du storage
   │
   └─ Cochée avec untilCompletion === true ──────► [archivée]  completedAt = date + deletedAt = date (auto)
```

### États et visibilité

| État | `deletedAt` | `completedAt` | Vue enfant | Liste parent | Section "Archivées" |
|---|---|---|---|---|---|
| Active | `null` | `null` | ✅ | ✅ | ❌ |
| Archivée (untilCompletion) | auto | rempli | ❌ | ❌ | ✅ |
| Supprimée (soft delete) | rempli | `null` | ❌ | ❌ | ✅ |
| Supprimée définitivement | — | — | ❌ | ❌ | ❌ |

---

## Système de smileys (`smiley.js`)

```js
function getSmiley(totalTasks, doneTasks) {
  if (totalTasks === 0) return null;
  const percent = (doneTasks / totalTasks) * 100;
  if (percent >= 80) return { emoji: "😄", color: "#4CAF50", label: "Super journée !" };
  if (percent >= 60) return { emoji: "🙂", color: "#FFC107", label: "Bonne journée" };
  if (percent >= 40) return { emoji: "😐", color: "#FF9800", label: "Peut mieux faire" };
  return              { emoji: "😟", color: "#F44336", label: "On essaie demain !" };
}
```

---

## Validation rétroactive

| Qui | Quel jour | Accès |
|-----|-----------|-------|
| Enfant | Aujourd'hui | Coche librement |
| Enfant | Jour passé | Lecture seule (tâches + smiley) |
| Parent | N'importe quel jour passé | Modification après PIN |

- Historique illimité — aucune date passée n'est inaccessible
- Les données ne sont jamais supprimées du localStorage (sauf suppression définitive explicite)

---

## Design & UX

### Dégradé de fond (vue enfant)

```css
background: linear-gradient(to bottom, #1A1A54, #452C8E, #8748A9, #D465A8, #E895AA, #F8BDAB);
background-attachment: fixed;
```

### Barre de progression latérale gauche

- Fine barre blanche verticale sur le bord gauche de l'écran
- Représente la journée entière (première tâche → dernière tâche)
- Curseur blanc (petit cercle) positionné selon l'heure actuelle
- Au-dessus du curseur : `rgba(255,255,255,0.40)`
- En-dessous du curseur : `rgba(255,255,255,0.15)`
- Mise à jour toutes les 60 secondes

### Cartes de tâches

- Fond : `rgba(255,255,255,0.15)`, `border-radius: 20px`
- Emoji 36px · Label Nunito 18px blanc · Case à cocher à droite
- Tâche cochée : ✓ vert + label barré + opacité 0.5 + son Web Audio API

### Header fixe

- Heure : Baloo 2, 56px, blanc, gras
- Date : Nunito, 16px, blanc semi-transparent — format `Vendredi 22 Mai`
- Fond : `#1A1A54`

### Tailles tactiles

- Zones cliquables minimum : **64px × 64px** (doigts d'enfant)
- Optimisé portrait smartphone (390px de large)

---

## Deux vues

### Vue enfant — `index.njk` → `_site/index.html`

- Timeline scrollable du jour (instances triées par heure de début)
- Header fixe avec heure et date
- Barre de progression latérale
- Bouton "📅 Mon mois" → calendrier mensuel (lecture seule)
- Aucun accès à l'interface parent sans PIN

### Interface parent — `parent.njk` → `_site/parent.html`

Protégée par PIN (4 chiffres, haché SHA-256 dans localStorage).
Trois onglets :

- **Tâches** : liste des tâches actives + section "Archivées" repliée
- **Calendrier** : vue mensuelle avec smileys + validation rétroactive + navigation mois précédents
- **Paramètres** : changer le PIN

#### Liste des tâches actives
- Toutes les tâches avec `deletedAt === null` et `completedAt === null`
- Actions : modifier, supprimer (soft delete), dupliquer

#### Section "Archivées" (repliée par défaut)
- Tâches avec `deletedAt !== null` (soft delete ou untilCompletion accomplie)
- Actions : restaurer (remet `deletedAt` et `completedAt` à `null`), supprimer définitivement

#### Formulaire de création / édition d'une tâche

Champs dans l'ordre d'affichage :

1. **Label** — champ texte libre
2. **Emoji / Image** — picker emoji OU upload image (pas les deux simultanément)
3. **Horaires** — liste de créneaux, bouton "Ajouter un horaire"
   - Pour chaque créneau : toggle `Période | Heure précise`
   - Si période : select parmi matin | matinée | midi | après-midi | goûter | soir | nuit
   - Si heure : input HH:MM
4. **Récurrence**
   - Répéter tous les [X] [jours | semaines | mois | années]
   - Si semaines → sélecteur de jours (lun mar mer jeu ven sam dim)
   - Si mois → champ "le [X] du mois"
   - Checkbox "Jusqu'à complétion" — masque les options de fin si cochée
5. **Fin de récurrence** (masqué si untilCompletion coché)
   - Radio : Jamais | Le [date] | Après [X] occurrences
6. **Exceptions** — liste de dates avec date picker, bouton "Ajouter une exception"

---

## Déploiement GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./_site
```

---

## Règles de code

- JS vanilla uniquement — pas de framework, pas d'import/export (scripts classiques)
- CSS custom properties pour toutes les couleurs et valeurs réutilisables
- Un fichier JS par domaine fonctionnel (voir structure)
- `camelCase` pour variables/fonctions, `kebab-case` pour les IDs et classes CSS
- Zéro `console.log` en production
- Aucun message d'erreur technique visible côté enfant
- Jamais de suppression physique d'une tâche sans action explicite "Supprimer définitivement"
- `completedAt` et `deletedAt` ne sont jamais remis à `null` manuellement — utiliser `restaurer()`
- Les plages horaires des périodes sont définies uniquement dans `scheduleUtils.js`

---

## Phases de développement

### Phase 1 — Structure et vue enfant
- [ ] Configuration Eleventy + GitHub Actions
- [ ] Layout de base + CSS custom properties + dégradé
- [ ] Header fixe (heure + date, mise à jour auto)
- [ ] Modèle de données des tâches + stockage localStorage
- [ ] Résolution des instances du jour (recurrence.js + scheduleUtils.js)
- [ ] Timeline du jour avec instances cochables triées par heure
- [ ] Barre de progression latérale
- [ ] Son de validation (Web Audio API)

### Phase 2 — Calendrier et historique
- [ ] Calcul smiley par jour
- [ ] Vue calendrier mensuel (enfant, lecture seule)
- [ ] Navigation entre mois (historique illimité)

### Phase 3 — Interface parent
- [ ] PIN gate (SHA-256, localStorage)
- [ ] Liste des tâches actives (CRUD complet)
- [ ] Formulaire de création/édition avec tous les champs
- [ ] Section "Archivées" avec restauration et suppression définitive
- [ ] Validation rétroactive des jours passés
- [ ] Paramètres (changement PIN)

### Phase 4 — PWA
- [ ] `manifest.json` (icône, nom, couleurs)
- [ ] `service-worker.js` (cache offline)
- [ ] Installable sur écran d'accueil smartphone