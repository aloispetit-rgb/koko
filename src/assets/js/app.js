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
  img.src = SITE_BASE + '/assets/img/periods/' + task.image + '.png';
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
      if (task.image) {
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
  if (!wasDone) playCheckSound();
  renderTimeline();
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

function updateHeader() {
  var now = new Date();
  document.getElementById('header-time').textContent = formatTime(now);
  document.getElementById('header-date').textContent = formatDisplayDate(now);
}

function tick() {
  var newDate = getTodayDateString();
  if (newDate !== currentDateStr) {
    currentDateStr = newDate;
    isFirstLoad = true;
  }
  updateHeader();
  renderTimeline();
}

function init() {
  currentDateStr = getTodayDateString();
  seedDefaultData();
  updateHeader();
  renderTimeline();
  setInterval(tick, 60000);
}

document.addEventListener('DOMContentLoaded', init);
