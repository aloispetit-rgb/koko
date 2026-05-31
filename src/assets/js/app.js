var currentDateStr = '';
var lastKnownDate  = '';
var isFirstLoad    = true;

/* ---- UUID v4 ---- */

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/* ---- Seed ---- */

function makeDefaultTask(label, emoji, schedules) {
  return {
    id:          generateUUID(),
    label:       label,
    emoji:       emoji,
    image:       null,
    schedules:   schedules,
    recurrence:  { every: 1, unit: 'days', untilCompletion: false },
    end:         { type: 'never', date: null, occurrences: null },
    exceptions:  [],
    createdAt:   new Date().toISOString(),
    deletedAt:   null,
    completedAt: null,
  };
}

function seedDefaultTasks() {
  if (Storage.getTasks().length > 0) return;
  Storage.saveTasks([
    makeDefaultTask('Se brosser les dents', '🪥', [
      { type: 'period', value: 'matin' },
      { type: 'period', value: 'soir'  },
    ]),
    makeDefaultTask('Petit déjeuner', '🥣', [
      { type: 'period', value: 'matin' },
    ]),
    makeDefaultTask("S'habiller", '👕', [
      { type: 'period', value: 'matin' },
    ]),
  ]);
}

/* ---- Header ---- */

function getGreeting(hour, prenom) {
  if (!prenom) return '';
  if (hour >= 5  && hour < 12) return 'Bonjour '        + prenom + ' !';
  if (hour >= 12 && hour < 18) return 'Bon après-midi ' + prenom + ' !';
  if (hour >= 18 && hour < 22) return 'Bonsoir '        + prenom + ' !';
  return 'Bonne nuit ' + prenom + ' !';
}

function updateHeader() {
  var now = new Date();
  document.getElementById('header-time').textContent     = formatTime(now);
  document.getElementById('header-date').textContent     = formatDisplayDate(now);
  document.getElementById('header-greeting').textContent =
    getGreeting(now.getHours(), localStorage.getItem('koko-prenom') || '');
}

function effectiveEndMins(instance) {
  // nuit (startMinutes > endMinutes) chevauche minuit — on traite la fin à 1440
  return instance.startMinutes > instance.endMinutes ? 1440 : instance.endMinutes;
}

/* ---- Son ---- */

function playCheckSound() {
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    var ctx = new Ctx(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880,  ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

/* ---- Cochage ---- */

function handleToggle(taskId, scheduleIndex) {
  var nowDone = Storage.toggleCompletion(currentDateStr, taskId, scheduleIndex);
  if (nowDone) {
    playCheckSound();
    var task = Storage.getTasks().find(function (t) { return t.id === taskId; });
    if (task && task.recurrence && task.recurrence.untilCompletion) {
      var ts = new Date().toISOString();
      Storage.updateTask(taskId, { completedAt: ts, deletedAt: ts });
    }
  }
  renderTimeline();
}

/* ---- Construction des cartes ---- */

function buildTaskCard(instance, completions) {
  var key    = instance.taskId + ':' + instance.scheduleIndex;
  var isDone = !!completions[key];

  var card = document.createElement('div');
  card.dataset.cardKey = key;

  var gallEntry = null;
  if (instance.image) {
    var gallery = Storage.getGallery();
    for (var gi = 0; gi < gallery.length; gi++) {
      if (gallery[gi].id === instance.image) { gallEntry = gallery[gi]; break; }
    }
  }

  if (gallEntry) {
    card.className = 'task-card task-with-image' + (isDone ? ' task-done' : '');

    var imgEl   = document.createElement('img');
    imgEl.src   = gallEntry.data;
    imgEl.alt   = instance.label;
    imgEl.className = 'task-image';
    card.appendChild(imgEl);

    var labelEl       = document.createElement('span');
    labelEl.className = 'task-image-label';
    labelEl.textContent = instance.label;
    card.appendChild(labelEl);
  } else {
    card.className = 'task-card' + (isDone ? ' task-done' : '');

    var emojiEl       = document.createElement('span');
    emojiEl.className = 'task-emoji';
    emojiEl.textContent = instance.emoji || '•';
    card.appendChild(emojiEl);

    var labelEl       = document.createElement('span');
    labelEl.className = 'task-label';
    labelEl.textContent = instance.label;
    card.appendChild(labelEl);

    var btn = document.createElement('button');
    btn.className = 'task-check' + (isDone ? ' task-check-done' : '');
    btn.setAttribute('aria-label', isDone ? 'Décocher' : 'Cocher');
    btn.setAttribute('data-task-id',        instance.taskId);
    btn.setAttribute('data-schedule-index', instance.scheduleIndex);

    var inner       = document.createElement('span');
    inner.className = 'task-check-inner';
    inner.textContent = isDone ? '✓' : '';
    btn.appendChild(inner);

    btn.addEventListener('click', function () {
      handleToggle(instance.taskId, instance.scheduleIndex);
    });

    card.appendChild(btn);
  }

  return card;
}

/* ---- Timeline ---- */

function renderTimeline() {
  var tasks       = Storage.getActiveTasks();
  var completions = Storage.getCompletions(currentDateStr);
  var instances   = [];

  tasks.forEach(function (task) {
    instances = instances.concat(getTaskInstancesForDay(task, currentDateStr));
  });
  instances.sort(function (a, b) { return a.startMinutes - b.startMinutes; });

  var timeline = document.getElementById('timeline');
  timeline.innerHTML = '';

  if (!instances.length) {
    var empty       = document.createElement('p');
    empty.className = 'timeline-empty';
    empty.textContent = 'Pas de tâches aujourd\'hui ! 🎉';
    timeline.appendChild(empty);
    return;
  }

  var SCHEDULE_EMOJIS = {
    'Matin': '🌅', 'Matinée': '🌤️', 'Midi': '☀️',
    'Après-midi': '🌻', 'Goûter': '🍪', 'Soir': '🌙', 'Nuit': '⭐',
  };

  var groups   = [];
  var groupMap = {};
  instances.forEach(function (inst) {
    if (!groupMap[inst.scheduleLabel]) {
      groupMap[inst.scheduleLabel] = [];
      groups.push({ label: inst.scheduleLabel, instances: groupMap[inst.scheduleLabel] });
    }
    groupMap[inst.scheduleLabel].push(inst);
  });

  groups.forEach(function (group, gi) {
    var sep = document.createElement('div');
    sep.className = 'schedule-separator' + (gi === 0 ? ' schedule-separator-first' : '');
    sep.textContent = (SCHEDULE_EMOJIS[group.label] || '🕐') + ' ' + group.label;
    timeline.appendChild(sep);
    group.instances.forEach(function (inst) {
      timeline.appendChild(buildTaskCard(inst, completions));
    });
  });

  if (isFirstLoad) {
    isFirstLoad = false;
    setTimeout(function () { scrollToCurrent(instances); }, 150);
  }
}

/* ---- Scroll vers le créneau en cours ---- */

function scrollToCurrent(instances) {
  var n       = new Date();
  var nowMins = n.getHours() * 60 + n.getMinutes();
  var target  = null;

  for (var i = 0; i < instances.length; i++) {
    if (effectiveEndMins(instances[i]) > nowMins) { target = instances[i]; break; }
  }
  if (!target) return;

  var el = document.querySelector(
    '[data-card-key="' + target.taskId + ':' + target.scheduleIndex + '"]'
  );
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---- Tick / rafraîchissement ---- */

function tick() {
  var today = getTodayDateString();
  if (today !== lastKnownDate) { location.reload(); return; }
  updateHeader();
  renderTimeline();
}

/* ---- Purge ancien modèle ---- */

function purgeOldStorage() {
  Object.keys(localStorage).forEach(function (key) {
    if (key.startsWith('koko-checkins-')) localStorage.removeItem(key);
  });
  localStorage.removeItem('koko-periods');
}

/* ---- Init ---- */

function init() {
  purgeOldStorage();
  currentDateStr = getTodayDateString();
  lastKnownDate  = currentDateStr;
  seedDefaultTasks();
  updateHeader();
  renderTimeline();
  setInterval(tick, 60000);
}

document.addEventListener('DOMContentLoaded', function () {
  init();

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    if (getTodayDateString() !== lastKnownDate) { location.reload(); return; }
    updateHeader();
    renderTimeline();
  });

  // 5 taps dans le coin supérieur droit → espace parent
  var secretTaps = 0, secretTimer = null;
  var secretZone = document.getElementById('secret-zone');

  function onSecretTap(e) {
    e.stopPropagation();
    secretTaps++;
    clearTimeout(secretTimer);
    if (secretTaps >= 5) {
      secretTaps = 0;
      window.location.href = SITE_BASE + '/parent/';
      return;
    }
    secretTimer = setTimeout(function () { secretTaps = 0; }, 3000);
  }

  secretZone.addEventListener('click', onSecretTap);
  secretZone.addEventListener('touchend', function (e) {
    e.preventDefault();
    onSecretTap(e);
  }, { passive: false });
});
