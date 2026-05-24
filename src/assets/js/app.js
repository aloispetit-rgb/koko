var SEED_VERSION = 'v5';

var DEFAULT_PERIODS = [
  {
    id: 'matin-semaine',
    name: 'Matin',
    emoji: '🌅',
    startHour: 6, startMinute: 30,
    endHour: 8, endMinute: 20,
    recurrence: { type: 'weekdays', days: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'] },
    exceptions: [],
    tasks: [
      { id: 'lever-semaine',   label: 'Se lever',              emoji: '☀️' },
      { id: 'dejeuner-semaine', label: 'Petit déjeuner',       emoji: '🥣' },
      { id: 'habiller-semaine', label: "S'habiller",           emoji: '👕' },
      { id: 'dents-matin',     label: 'Se brosser les dents',  emoji: '🪥' }
    ]
  },
  {
    id: 'matin-weekend',
    name: 'Matin',
    emoji: '🌅',
    startHour: 8, startMinute: 0,
    endHour: 9, endMinute: 30,
    recurrence: { type: 'weekdays', days: ['samedi', 'dimanche'] },
    exceptions: [],
    tasks: [
      { id: 'lever-weekend',    label: 'Se lever',             emoji: '☀️' },
      { id: 'dejeuner-weekend', label: 'Petit déjeuner',       emoji: '🥣' },
      { id: 'habiller-weekend', label: "S'habiller",           emoji: '👕' }
    ]
  },
  {
    id: 'ecole-semaine',
    name: 'École',
    emoji: '🏫',
    startHour: 8, startMinute: 30,
    endHour: 16, endMinute: 30,
    recurrence: { type: 'weekdays', days: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'] },
    exceptions: [],
    tasks: [
      { id: 'ecole-bloc', label: 'École', image: 'ecole' }
    ]
  },
  {
    id: 'ecole-test-samedi',
    name: 'Test tâche passive',
    emoji: '🧪',
    startHour: 10, startMinute: 0,
    endHour: 12, endMinute: 0,
    recurrence: { type: 'once', date: '2026-05-23' },
    exceptions: [],
    tasks: [
      { id: 'tache-normale-test', label: 'Tâche normale', emoji: '✅' },
      { id: 'ecole-test-bloc',    label: 'École',         image: 'ecole' }
    ]
  },
  {
    id: 'aprem-weekend',
    name: 'Après-midi',
    emoji: '⛅',
    startHour: 15, startMinute: 0,
    endHour: 17, endMinute: 0,
    recurrence: { type: 'weekdays', days: ['samedi', 'dimanche'] },
    exceptions: [],
    tasks: [
      { id: 'gouter',   label: 'Goûter',    emoji: '🍎' },
      { id: 'activite', label: 'Activité',  emoji: '🎨' }
    ]
  },
  {
    id: 'soir',
    name: 'Soir',
    emoji: '🌙',
    startHour: 19, startMinute: 0,
    endHour: 20, endMinute: 30,
    recurrence: { type: 'always' },
    exceptions: [],
    tasks: [
      { id: 'bain',      label: 'Bain ou douche',        emoji: '🛁' },
      { id: 'pyjama',    label: 'Pyjama',                emoji: '🌛' },
      { id: 'dents-soir', label: 'Se brosser les dents', emoji: '🪥' },
      { id: 'histoire',  label: 'Histoire du soir',      emoji: '📚' }
    ]
  }
];

// Checkins de test pour vérifier les 4 smileys sur mai 2026
// Tâches actives en semaine : lever-semaine, dejeuner-semaine, habiller-semaine,
//   dents-matin, bain, pyjama, dents-soir, histoire (8 tâches cochables)
var TEST_CHECKINS = {
  '2026-05-04': { 'lever-semaine': {done:true,doneAt:'2026-05-04T07:00:00Z'}, 'dejeuner-semaine': {done:true,doneAt:'2026-05-04T07:15:00Z'}, 'habiller-semaine': {done:true,doneAt:'2026-05-04T07:30:00Z'}, 'dents-matin': {done:true,doneAt:'2026-05-04T07:45:00Z'}, 'bain': {done:true,doneAt:'2026-05-04T19:30:00Z'}, 'pyjama': {done:true,doneAt:'2026-05-04T19:45:00Z'}, 'dents-soir': {done:true,doneAt:'2026-05-04T20:00:00Z'}, 'histoire': {done:true,doneAt:'2026-05-04T20:15:00Z'} },  // 😄 8/8
  '2026-05-05': { 'lever-semaine': {done:true,doneAt:'2026-05-05T07:00:00Z'}, 'dejeuner-semaine': {done:true,doneAt:'2026-05-05T07:15:00Z'}, 'habiller-semaine': {done:true,doneAt:'2026-05-05T07:30:00Z'}, 'dents-matin': {done:true,doneAt:'2026-05-05T07:45:00Z'}, 'bain': {done:true,doneAt:'2026-05-05T19:30:00Z'}, 'pyjama': {done:true,doneAt:'2026-05-05T19:45:00Z'} },                                                                                                                                                                                // 🙂 6/8
  '2026-05-06': { 'lever-semaine': {done:true,doneAt:'2026-05-06T07:00:00Z'}, 'dejeuner-semaine': {done:true,doneAt:'2026-05-06T07:15:00Z'}, 'bain': {done:true,doneAt:'2026-05-06T19:30:00Z'}, 'pyjama': {done:true,doneAt:'2026-05-06T19:45:00Z'} },                                                                                                                                                                                                                                                                                                             // 😐 4/8
  '2026-05-07': { 'lever-semaine': {done:true,doneAt:'2026-05-07T07:00:00Z'}, 'bain': {done:true,doneAt:'2026-05-07T19:30:00Z'} },                                                                                                                                                                                                                                                                                                                                                                                                                                  // 😟 2/8
  '2026-05-11': { 'lever-semaine': {done:true,doneAt:'2026-05-11T07:00:00Z'}, 'dejeuner-semaine': {done:true,doneAt:'2026-05-11T07:15:00Z'}, 'habiller-semaine': {done:true,doneAt:'2026-05-11T07:30:00Z'}, 'dents-matin': {done:true,doneAt:'2026-05-11T07:45:00Z'}, 'bain': {done:true,doneAt:'2026-05-11T19:30:00Z'}, 'pyjama': {done:true,doneAt:'2026-05-11T19:45:00Z'}, 'dents-soir': {done:true,doneAt:'2026-05-11T20:00:00Z'}, 'histoire': {done:true,doneAt:'2026-05-11T20:15:00Z'} }, // 😄 8/8
  '2026-05-12': { 'lever-semaine': {done:true,doneAt:'2026-05-12T07:00:00Z'}, 'dejeuner-semaine': {done:true,doneAt:'2026-05-12T07:15:00Z'}, 'habiller-semaine': {done:true,doneAt:'2026-05-12T07:30:00Z'}, 'dents-matin': {done:true,doneAt:'2026-05-12T07:45:00Z'}, 'bain': {done:true,doneAt:'2026-05-12T19:30:00Z'} },                                                                                                                                                                                                                                        // 🙂 5/8
  '2026-05-13': { 'lever-semaine': {done:true,doneAt:'2026-05-13T07:00:00Z'}, 'dejeuner-semaine': {done:true,doneAt:'2026-05-13T07:15:00Z'}, 'habiller-semaine': {done:true,doneAt:'2026-05-13T07:30:00Z'}, 'bain': {done:true,doneAt:'2026-05-13T19:30:00Z'} },                                                                                                                                                                                                                                                                                                   // 😐 4/8
  '2026-05-14': { 'lever-semaine': {done:true,doneAt:'2026-05-14T07:00:00Z'} },                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     // 😟 1/8
  '2026-05-18': { 'lever-semaine': {done:true,doneAt:'2026-05-18T07:00:00Z'}, 'dejeuner-semaine': {done:true,doneAt:'2026-05-18T07:15:00Z'}, 'habiller-semaine': {done:true,doneAt:'2026-05-18T07:30:00Z'}, 'dents-matin': {done:true,doneAt:'2026-05-18T07:45:00Z'}, 'bain': {done:true,doneAt:'2026-05-18T19:30:00Z'}, 'pyjama': {done:true,doneAt:'2026-05-18T19:45:00Z'}, 'dents-soir': {done:true,doneAt:'2026-05-18T20:00:00Z'}, 'histoire': {done:true,doneAt:'2026-05-18T20:15:00Z'} }, // 😄 8/8
  '2026-05-19': { 'lever-semaine': {done:true,doneAt:'2026-05-19T07:00:00Z'}, 'dejeuner-semaine': {done:true,doneAt:'2026-05-19T07:15:00Z'}, 'habiller-semaine': {done:true,doneAt:'2026-05-19T07:30:00Z'}, 'dents-matin': {done:true,doneAt:'2026-05-19T07:45:00Z'}, 'bain': {done:true,doneAt:'2026-05-19T19:30:00Z'}, 'pyjama': {done:true,doneAt:'2026-05-19T19:45:00Z'} },                                                                                                                                                                                  // 🙂 6/8
  '2026-05-20': { 'lever-semaine': {done:true,doneAt:'2026-05-20T07:00:00Z'}, 'bain': {done:true,doneAt:'2026-05-20T19:30:00Z'}, 'pyjama': {done:true,doneAt:'2026-05-20T19:45:00Z'} },                                                                                                                                                                                                                                                                                                                                                                            // 😐 3/8
  '2026-05-21': { 'lever-semaine': {done:true,doneAt:'2026-05-21T07:00:00Z'} },                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     // 😟 1/8
  '2026-05-22': { 'lever-semaine': {done:true,doneAt:'2026-05-22T07:00:00Z'}, 'dejeuner-semaine': {done:true,doneAt:'2026-05-22T07:15:00Z'}, 'habiller-semaine': {done:true,doneAt:'2026-05-22T07:30:00Z'}, 'dents-matin': {done:true,doneAt:'2026-05-22T07:45:00Z'}, 'bain': {done:true,doneAt:'2026-05-22T19:30:00Z'}, 'pyjama': {done:true,doneAt:'2026-05-22T19:45:00Z'}, 'dents-soir': {done:true,doneAt:'2026-05-22T20:00:00Z'}, 'histoire': {done:true,doneAt:'2026-05-22T20:15:00Z'} }  // 😄 8/8
};

var currentDateStr = '';
var isFirstLoad = true;
var lastKnownDate = null;

function seedDefaultData() {
  if (localStorage.getItem('koko-seed') !== SEED_VERSION) {
    Storage.savePeriods(DEFAULT_PERIODS);
    Object.keys(TEST_CHECKINS).forEach(function (dateStr) {
      Storage.saveCheckins(dateStr, TEST_CHECKINS[dateStr]);
    });
    localStorage.setItem('koko-seed', SEED_VERSION);
  }
}

function padZ(n) {
  return String(n).padStart(2, '0');
}


function buildPassiveTask(task) {
  var block = document.createElement('div');
  block.className = 'task-passive';
  block.dataset.taskId = task.id;

  var labelEl = document.createElement('div');
  labelEl.className = 'task-passive-label';
  labelEl.textContent = task.label;

  var img = document.createElement('img');
  img.className = 'task-passive-img';
  img.src = task.imageData || (SITE_BASE + '/assets/img/periods/' + task.image + '.png');
  img.alt = task.label;

  block.appendChild(labelEl);
  block.appendChild(img);
  return block;
}

function buildTaskCard(task, isDone) {
  var card = document.createElement('div');
  card.className = 'task-card' + (isDone ? ' task-done' : '');
  card.dataset.taskId = task.id;

  var emojiEl = document.createElement('span');
  emojiEl.className = 'task-emoji';
  emojiEl.textContent = task.emoji;

  var labelEl = document.createElement('span');
  labelEl.className = 'task-label';
  labelEl.textContent = task.label;

  var btn = document.createElement('button');
  btn.className = 'task-check' + (isDone ? ' task-check-done' : '');
  btn.setAttribute('aria-label', isDone ? 'Décocher' : 'Cocher');

  var inner = document.createElement('span');
  inner.className = 'task-check-inner';
  inner.textContent = isDone ? '✓' : '';
  btn.appendChild(inner);

  btn.addEventListener('click', function () {
    handleTaskToggle(task.id);
  });

  card.appendChild(emojiEl);
  card.appendChild(labelEl);
  card.appendChild(btn);
  return card;
}

function buildPeriodSection(period, checkins) {
  var now = new Date();
  var nowMins = toMinutes(now.getHours(), now.getMinutes());
  var startMins = toMinutes(period.startHour, period.startMinute);
  var endMins = toMinutes(period.endHour, period.endMinute);
  var isCurrent = nowMins >= startMins && nowMins < endMins;

  var section = document.createElement('section');
  section.className = 'period' + (isCurrent ? ' period-current' : '');
  section.dataset.periodId = period.id;

  // [────────────────] [Nom]
  var separator = document.createElement('div');
  separator.className = 'period-separator';
  var nameEl = document.createElement('span');
  nameEl.className = 'period-name';
  nameEl.textContent = period.name;
  separator.appendChild(nameEl);
  section.appendChild(separator);

  // Heure de début
  var startEl = document.createElement('div');
  startEl.className = 'period-time-start';
  startEl.textContent = padZ(period.startHour) + ':' + padZ(period.startMinute);
  section.appendChild(startEl);

  // Tâches
  if (period.tasks.length > 0) {
    var taskList = document.createElement('div');
    taskList.className = 'task-list';
    period.tasks.forEach(function (task) {
      if (task.image || task.imageData) {
        taskList.appendChild(buildPassiveTask(task));
      } else {
        var done = !!(checkins[task.id] && checkins[task.id].done);
        taskList.appendChild(buildTaskCard(task, done));
      }
    });
    section.appendChild(taskList);
  }

  // Heure de fin
  var endEl = document.createElement('div');
  endEl.className = 'period-time-end';
  endEl.textContent = padZ(period.endHour) + ':' + padZ(period.endMinute);
  section.appendChild(endEl);

  return section;
}

function handleTaskToggle(taskId) {
  var checkins = Storage.getCheckins(currentDateStr);
  var wasDone = !!(checkins[taskId] && checkins[taskId].done);
  Storage.toggleTask(currentDateStr, taskId);
  if (!wasDone) {
    playCheckSound();
    renderTimeline();
    if (allTasksDone()) triggerCelebration();
  } else {
    renderTimeline();
  }
}

function allTasksDone() {
  var periods = Storage.getPeriods();
  var active = getActivePeriodsForDay(periods, currentDateStr);
  var checkable = [];
  active.forEach(function (p) {
    p.tasks.forEach(function (t) { if (!t.image && !t.imageData) checkable.push(t); });
  });
  if (!checkable.length) return false;
  var ch = Storage.getCheckins(currentDateStr);
  return checkable.every(function (t) { return ch[t.id] && ch[t.id].done; });
}

function triggerCelebration() {
  var key = 'koko-celebration-' + currentDateStr;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  playCelebrationSound();
  showCelebration();
}

function playCelebrationSound() {
  try {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    var ctx = new AudioCtx();
    var notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    notes.forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      var t0 = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.28, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
      osc.start(t0);
      osc.stop(t0 + 0.6);
    });
  } catch (e) {}
}

function showCelebration() {
  var overlay = document.createElement('div');
  overlay.className = 'celebration-overlay';

  var prenom = localStorage.getItem('koko-prenom') || '';
  var msg = document.createElement('div');
  msg.className = 'celebration-msg';
  msg.textContent = prenom ? 'Bravo ' + prenom + ' ! 🎉' : 'Bravo ! 🎉';
  overlay.appendChild(msg);

  var colors = ['#F8BDAB','#D465A8','#8748A9','#FFD700','#4ADE80','#60A5FA','#FB923C','#ffffff'];
  for (var i = 0; i < 60; i++) {
    var piece = document.createElement('div');
    piece.className = 'confetti-piece';
    var size = 7 + Math.random() * 7;
    var duration = 2 + Math.random() * 1.5;
    var delay = Math.random() * 1.4;
    piece.style.cssText =
      'left:' + Math.random() * 100 + '%;' +
      'width:' + size + 'px;' +
      'height:' + (size * (0.4 + Math.random() * 0.8)) + 'px;' +
      'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
      'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';' +
      'animation-duration:' + duration + 's;' +
      'animation-delay:' + delay + 's;';
    overlay.appendChild(piece);
  }

  document.body.appendChild(overlay);
  setTimeout(function () {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }, 4000);
}

function playCheckSound() {
  try {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    var ctx = new AudioCtx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { /* Web Audio non disponible */ }
}

function renderTimeline() {
  var periods = Storage.getPeriods();
  var checkins = Storage.getCheckins(currentDateStr);
  var active = getActivePeriodsForDay(periods, currentDateStr);

  var timeline = document.getElementById('timeline');
  timeline.innerHTML = '';

  if (active.length === 0) {
    var empty = document.createElement('p');
    empty.className = 'timeline-empty';
    empty.textContent = 'Pas de tâches aujourd\'hui ! 🎉';
    timeline.appendChild(empty);
    updateProgressBar([]);
    return;
  }

  active.forEach(function (period) {
    timeline.appendChild(buildPeriodSection(period, checkins));
  });

  updateProgressBar(active);

  if (isFirstLoad) {
    isFirstLoad = false;
    setTimeout(function () { scrollToCurrent(active); }, 150);
  }
}

function updateProgressBar(active) {
  var barEl = document.getElementById('progress-bar');
  if (!barEl) return;

  if (!active.length) {
    barEl.style.setProperty('--progress', '0%');
    return;
  }

  var first = active[0];
  var last = active[active.length - 1];
  var startMins = toMinutes(first.startHour, first.startMinute);
  var endMins = toMinutes(last.endHour, last.endMinute);
  if (startMins >= endMins) return;

  var now = new Date();
  var nowMins = toMinutes(now.getHours(), now.getMinutes());
  var pct = Math.max(0, Math.min(1, (nowMins - startMins) / (endMins - startMins)));

  barEl.style.setProperty('--progress', (pct * 100).toFixed(2) + '%');
}

function scrollToCurrent(active) {
  var now = new Date();
  var nowMins = toMinutes(now.getHours(), now.getMinutes());
  var target = null;

  for (var i = 0; i < active.length; i++) {
    if (toMinutes(active[i].endHour, active[i].endMinute) > nowMins) {
      target = active[i];
      break;
    }
  }

  if (!target) return;
  var el = document.querySelector('[data-period-id="' + target.id + '"]');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getGreeting(hour, prenom) {
  if (!prenom) return '';
  if (hour >= 5  && hour < 12) return 'Bonjour ' + prenom + ' !';
  if (hour >= 12 && hour < 18) return 'Bon après-midi ' + prenom + ' !';
  if (hour >= 18 && hour < 22) return 'Bonsoir ' + prenom + ' !';
  return 'Bonne nuit ' + prenom + ' !';
}

function updateHeader() {
  var now = new Date();
  document.getElementById('header-time').textContent = formatTime(now);
  document.getElementById('header-date').textContent = formatDisplayDate(now);
  var prenom = localStorage.getItem('koko-prenom') || '';
  document.getElementById('header-greeting').textContent = getGreeting(now.getHours(), prenom);
}

function onNouveauJour() {
  currentDateStr = lastKnownDate;
  isFirstLoad = true;
  updateHeader();
  renderTimeline();
}

function tick() {
  var today = getTodayDateString();
  if (today !== lastKnownDate) {
    lastKnownDate = today;
    onNouveauJour();
  } else {
    updateHeader();
    renderTimeline();
  }
}

function migratePeriodsCreatedAt() {
  var periods = Storage.getPeriods();
  var needsSave = false;
  periods.forEach(function (p) {
    if (p.createdAt) return;
    var earliest = null;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key || !key.startsWith('koko-checkins-')) continue;
      var ds = key.replace('koko-checkins-', '');
      var ch = Storage.getCheckins(ds);
      var hasAny = p.tasks.some(function (t) { return ch[t.id] && ch[t.id].done; });
      if (hasAny && (!earliest || ds < earliest)) earliest = ds;
    }
    p.createdAt = earliest || getTodayDateString();
    needsSave = true;
  });
  if (needsSave) Storage.savePeriods(periods);
}

function init() {
  currentDateStr = getTodayDateString();
  lastKnownDate = currentDateStr;
  seedDefaultData();
  migratePeriodsCreatedAt();
  updateHeader();
  renderTimeline();
  setInterval(tick, 60000);
}

document.addEventListener('DOMContentLoaded', function () {
  init();

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    var today = getTodayDateString();
    if (today !== lastKnownDate) {
      lastKnownDate = today;
      onNouveauJour();
    } else {
      updateHeader();
    }
  });
  var secretTaps = 0;
  var secretTimer = null;
  var zone = document.getElementById('secret-zone');
  function handleSecretTap(e) {
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
  zone.addEventListener('click', handleSecretTap);
  zone.addEventListener('touchend', function (e) { e.preventDefault(); handleSecretTap(e); }, { passive: false });
});
