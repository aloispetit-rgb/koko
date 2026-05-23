# Koko — App de routine quotidienne pour enfant

Application web statique (PWA) permettant de suivre ses tâches quotidiennes en fonction de l'heure et du jour. Utilisée sur un seul appareil (smartphone), en autonomie complète pour l'enfant, avec une interface parent protégée par PIN.

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
│   │   ├── period-block.njk      # Composant bloc passif (École, Dormir...)
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
│   │   │   ├── periods.js        # Résolution des périodes actives
│   │   │   ├── smiley.js         # Calcul smiley selon % complétion
│   │   │   ├── timeUtils.js      # Utilitaires date/heure
│   │   │   └── sw.js             # Service Worker (cache PWA)
│   │   └── img/
│   │       └── periods/          # Images illustratives des blocs passifs
│   │           ├── ecole.png
│   │           └── dormir.png
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
  // Copier les assets sans les traiter
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
Clés utilisées :

| Clé | Contenu |
|-----|---------|
| `koko-periods` | Tableau de toutes les périodes définies (contiennent les tâches) |
| `koko-checkins-YYYY-MM-DD` | `{ [taskId]: { done: true, doneAt: "..." } }` |
| `koko-pin` | PIN parent haché (SHA-256) |

---

### Concept clé : la période est le conteneur

Une **période** définit un créneau temporel (horaires, jours, règles de récurrence)
et contient ses propres tâches. Une tâche appartient toujours à une période et
hérite de ses règles temporelles — elle n'a pas de règle de récurrence propre.

Une période peut être :
- **Active avec tâches** : affiche un bloc de tâches cochables dans la timeline
- **Passive** : affiche un bloc illustré sans tâche (École, Dormir...) — `tasks: []` + `image` définie

Si la même tâche doit apparaître dans deux périodes différentes (ex. "Se brosser
les dents" le matin et le soir), elle est simplement dupliquée dans chaque période
avec un `id` distinct. C'est intentionnel — deux cochages indépendants.

---

### Modèle d'une période

```js
{
  id: "matin-semaine",           // Identifiant unique stable (kebab-case)
  name: "Matin",                 // Nom affiché comme étiquette dans la timeline
  emoji: "🌅",
  image: null,                   // null = période avec tâches / "ecole" = bloc passif

  // Plage horaire de la période
  startHour: 6,
  startMinute: 0,
  endHour: 8,
  endMinute: 20,

  // Règle de récurrence de la période
  recurrence: {
    type: "weekdays",
    days: ["lundi", "mardi", "jeudi", "vendredi"],
  },

  // Exceptions : dates où la période est suspendue
  exceptions: [],

  // Tâches de cette période
  // - Tâche normale : { id, label, emoji } → carte cochable
  // - Tâche passive : { id, label, image } → bloc illustré, pas de case à cocher
  // Règle : soit emoji, soit image — jamais les deux
  tasks: [
    { id: "dents-matin",   label: "Se brosser les dents", emoji: "🪥" },
    { id: "dejeuner",      label: "Petit déjeuner",        emoji: "🥣" },
    { id: "habiller",      label: "S'habiller",            emoji: "👕" },
  ],
}
```

---

### Exemple de période contenant une tâche passive

```js
{
  id: "ecole-matin",
  name: "École",
  emoji: "🏫",

  startHour: 8,
  startMinute: 20,
  endHour: 11,
  endMinute: 30,

  recurrence: {
    type: "period",
    from: "2026-05-22",
    to: "2026-07-03",
    days: ["lundi", "mardi", "jeudi", "vendredi"],
  },

  exceptions: [
    "2026-05-29",
    "2026-06-08",
  ],

  // Tâche passive : image définie, pas d'emoji, pas de case à cocher
  tasks: [
    { id: "ecole-bloc", label: "École", image: "ecole" },
  ],
}
```

---

### Types de récurrence (communs à toutes les périodes)

```js
// Tous les jours, indéfiniment
recurrence: { type: "always" }

// Certains jours de la semaine, indéfiniment
recurrence: { type: "weekdays", days: ["lundi", "mardi", "jeudi", "vendredi"] }

// Période bornée avec dates de début et de fin
recurrence: { type: "period", from: "2026-05-22", to: "2026-07-03", days: ["lundi","mardi","jeudi","vendredi"] }

// Une seule date
recurrence: { type: "once", date: "2026-05-23" }

// Série de dates précises
recurrence: { type: "dates", dates: ["2026-06-01", "2026-06-15"] }

// Jusqu'à ce que toutes les tâches soient cochées (période persistante)
recurrence: { type: "until_done", since: "2026-05-22" }
```

---

## Logique métier

### Résolution de la timeline d'un jour (`recurrence.js` + `periods.js`)

```
1. Récupérer la date du jour
2. Pour chaque période :
   a. Vérifier si la récurrence correspond à ce jour
   b. Vérifier que la date n'est pas dans exceptions[]
   c. Si active :
      - Si tasks[] non vide → afficher un bloc de tâches cochables
      - Si tasks[] vide + image définie → afficher un bloc passif illustré
3. Trier les périodes actives par heure de début croissante
4. Pour chaque tâche d'une période active :
   - Si `task.image` définie → bloc illustré pleine largeur, pas de case à cocher
   - Sinon → carte cochable avec emoji
5. Afficher la timeline complète
```

### Rafraîchissement automatique (`app.js`)

- Toutes les **60 secondes** : recalcul des tâches visibles selon l'heure
- Toutes les **60 secondes** : mise à jour de l'heure affichée dans le header
- À minuit : remise à zéro automatique (nouveau jour)
- Au chargement : scroll automatique vers le moment en cours, puis scroll libre

---

## Système de smileys (`smiley.js`)

```js
function getSmiley(totalTasks, doneTasks) {
  // Aucune tâche prévue ce jour → rien à afficher (case vide dans le calendrier)
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
- Les données ne sont jamais supprimées du localStorage

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

### Tâches passives (image définie)

- Pas de case à cocher, pas d'emoji
- Label : Baloo 2, 24px, blanc
- Image illustrative pleine largeur, `border-radius: 16px`
- Images dans `/assets/img/periods/`, référencées par la clé `image` de la tâche

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

- Timeline scrollable du jour
- Header fixe avec heure et date
- Barre de progression latérale
- Bouton "📅 Mon mois" → calendrier mensuel (lecture seule)
- Aucun accès à l'interface parent sans PIN

### Interface parent — `parent.njk` → `_site/parent.html`

Protégée par PIN (4 chiffres, haché SHA-256 dans localStorage).
Trois onglets :

- **Périodes** : liste de toutes les périodes, ajout/modification/suppression.
  Pour chaque période : nom, emoji, image (optionnelle), plage horaire, récurrence, exceptions, et liste des tâches (ajout/suppression/réordonnancement).
- **Calendrier** : vue mensuelle avec smileys + validation rétroactive + navigation mois précédents
- **Paramètres** : changer le PIN

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

Chaque push sur `main` déclenche automatiquement le build et le déploiement.

---

## Règles de code

- JS vanilla uniquement — pas de framework, pas d'import/export (scripts classiques)
- CSS custom properties pour toutes les couleurs et valeurs réutilisables
- Un fichier JS par domaine fonctionnel (voir structure)
- `camelCase` pour variables/fonctions, `kebab-case` pour les IDs de tâches et classes CSS
- Zéro `console.log` en production
- Aucun message d'erreur technique visible côté enfant

---

## Phases de développement

### Phase 1 — Structure et vue enfant
- [ ] Configuration Eleventy + GitHub Actions
- [ ] Layout de base + CSS custom properties + dégradé
- [ ] Header fixe (heure + date, mise à jour auto)
- [ ] Timeline du jour avec tâches cochables
- [ ] Tous les types de récurrence fonctionnels
- [ ] Barre de progression latérale
- [ ] Son de validation (Web Audio API)
- [ ] Persistance localStorage

### Phase 2 — Périodes
- [ ] Modèle de données des périodes
- [ ] Injection des blocs passifs dans la timeline
- [ ] Images illustratives (École, Dormir)

### Phase 3 — Calendrier et historique
- [ ] Calcul smiley par jour
- [ ] Vue calendrier mensuel (enfant, lecture seule)
- [ ] Navigation entre mois (historique illimité)

### Phase 4 — Interface parent
- [ ] PIN gate (SHA-256, localStorage)
- [ ] Gestion des périodes (CRUD complet : nom, emoji, image, horaires, récurrence, exceptions)
- [ ] Gestion des tâches dans chaque période (ajout, suppression, réordonnancement)
- [ ] Validation rétroactive des jours passés
- [ ] Paramètres (changement PIN)

### Phase 5 — PWA
- [ ] `manifest.json` (icône, nom, couleurs)
- [ ] `service-worker.js` (cache offline)
- [ ] Installable sur écran d'accueil smartphone