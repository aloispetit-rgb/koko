/* ---- PIN ---- */
var PIN_KEY = 'koko-pin';
var currentPin = [];
var pinMode = 'unlock';
var pendingPin = null;

async function sha256(str) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(function (b) {
    return b.toString(16).padStart(2, '0');
  }).join('');
}

function updateDots() {
  document.querySelectorAll('#pin-dots .pin-dot').forEach(function (dot, i) {
    dot.classList.toggle('pin-dot-filled', i < currentPin.length);
  });
}

function showPinError(msg) {
  document.getElementById('pin-error').textContent = msg;
  var dots = document.getElementById('pin-dots');
  dots.classList.remove('pin-shake');
  void dots.offsetWidth;
  dots.classList.add('pin-shake');
  dots.addEventListener('animationend', function () { dots.classList.remove('pin-shake'); }, { once: true });
}

function clearPinError() { document.getElementById('pin-error').textContent = ''; }
function clearPin() { currentPin = []; updateDots(); }
function setPinTitle(t) { document.getElementById('pin-title').textContent = t; }

function enterCreateMode() { pinMode = 'create'; pendingPin = null; clearPin(); clearPinError(); setPinTitle('Choisir un code parent'); }
function enterUnlockMode() { pinMode = 'unlock'; pendingPin = null; clearPin(); clearPinError(); setPinTitle('Code parent'); }

function unlock() {
  document.getElementById('pin-gate').style.display = 'none';
  document.getElementById('parent-content').style.display = 'flex';
  renderPeriodsTab();
}

function lock() {
  document.getElementById('parent-content').style.display = 'none';
  document.getElementById('pin-gate').style.display = 'flex';
  enterUnlockMode();
}

async function validatePin() {
  var pinStr = currentPin.join('');
  if (pinMode === 'create') {
    pendingPin = pinStr; pinMode = 'confirm'; clearPin(); clearPinError(); setPinTitle('Confirmer le code'); return;
  }
  if (pinMode === 'confirm') {
    if (pinStr !== pendingPin) {
      showPinError('Les codes ne correspondent pas'); clearPin(); pendingPin = null; pinMode = 'create'; setPinTitle('Choisir un code parent'); return;
    }
    localStorage.setItem(PIN_KEY, await sha256(pinStr)); clearPin(); unlock(); return;
  }
  var hash = await sha256(pinStr);
  if (hash === localStorage.getItem(PIN_KEY)) { clearPin(); unlock(); }
  else { showPinError('Code incorrect'); clearPin(); }
}

function addDigit(d) {
  if (currentPin.length >= 4) return;
  currentPin.push(d); updateDots(); clearPinError();
  if (currentPin.length === 4) validatePin();
}

function removeDigit() { if (!currentPin.length) return; currentPin.pop(); updateDots(); clearPinError(); }

/* ---- Tabs ---- */
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(function (b) {
    b.classList.toggle('tab-active', b.getAttribute('data-tab') === name);
  });
  document.querySelectorAll('.tab-pane').forEach(function (p) {
    p.classList.toggle('tab-pane-active', p.id === 'tab-' + name);
  });
  if (name === 'calendar') renderParentCalendar();
  if (name === 'settings') initSettingsTab();
}

/* ---- Helpers ---- */
var DAYS_FR = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
var MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function pad2(n) { return String(n).padStart(2, '0'); }

function recurrenceLabel(rec) {
  if (!rec) return '';
  if (rec.type === 'always') return 'Tous les jours';
  if (rec.type === 'weekdays') return (rec.days || []).join(', ');
  if (rec.type === 'period') return 'Du ' + rec.from + ' au ' + rec.to;
  if (rec.type === 'once') return 'Le ' + rec.date;
  if (rec.type === 'dates') return (rec.dates || []).length + ' date(s)';
  if (rec.type === 'until_done') return 'Jusqu\'à complétion';
  return '';
}

function genId() {
  return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

/* ---- Periods tab ---- */
function renderPeriodsTab() {
  var periods = Storage.getPeriods();
  var list = document.getElementById('periods-list');
  list.innerHTML = '';
  if (!periods.length) {
    var empty = document.createElement('p');
    empty.style.cssText = 'font-family:var(--font-body);color:rgba(255,255,255,.5);text-align:center;padding:32px 0;font-size:16px;';
    empty.textContent = 'Aucune période. Créez-en une !';
    list.appendChild(empty);
    return;
  }
  periods.forEach(function (p) {
    var item = document.createElement('div');
    item.className = 'period-item';
    item.innerHTML =
      '<span class="period-item-emoji">' + (p.emoji || '📌') + '</span>' +
      '<div class="period-item-info">' +
        '<div class="period-item-name">' + escHtml(p.name) + '</div>' +
        '<div class="period-item-meta">' + pad2(p.startHour) + 'h' + pad2(p.startMinute) + ' – ' + pad2(p.endHour) + 'h' + pad2(p.endMinute) + ' · ' + recurrenceLabel(p.recurrence) + ' · ' + (p.tasks || []).length + ' tâche(s)</div>' +
      '</div>' +
      '<div class="period-item-actions">' +
        '<button class="btn-icon" data-action="edit" data-id="' + p.id + '" title="Modifier">✏️</button>' +
        '<button class="btn-icon btn-icon-danger" data-action="delete" data-id="' + p.id + '" title="Supprimer">🗑️</button>' +
      '</div>';
    list.appendChild(item);
  });

  list.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
    btn.addEventListener('click', function () { openPeriodForm(btn.getAttribute('data-id')); });
  });
  list.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
    btn.addEventListener('click', function () { deletePeriod(btn.getAttribute('data-id')); });
  });
}

function deletePeriod(id) {
  if (!confirm('Supprimer cette période et toutes ses tâches ?')) return;
  var periods = Storage.getPeriods().filter(function (p) { return p.id !== id; });
  Storage.savePeriods(periods);
  renderPeriodsTab();
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ---- Period form ---- */
var pfEditingId = null;
var pfDates = [];
var pfExceptions = [];

function openPeriodForm(id) {
  pfEditingId = id || null;
  pfDates = [];
  pfExceptions = [];

  var periods = Storage.getPeriods();
  var p = id ? periods.find(function (x) { return x.id === id; }) : null;

  document.getElementById('period-overlay-title').textContent = p ? 'Modifier la période' : 'Nouvelle période';
  document.getElementById('pf-id').value = p ? p.id : '';
  document.getElementById('pf-emoji').value = p ? (p.emoji || '') : '';
  document.getElementById('pf-name').value = p ? p.name : '';
  document.getElementById('pf-start-hour').value = p ? p.startHour : '';
  document.getElementById('pf-start-min').value = p ? pad2(p.startMinute) : '';
  document.getElementById('pf-end-hour').value = p ? p.endHour : '';
  document.getElementById('pf-end-min').value = p ? pad2(p.endMinute) : '';

  var rec = p ? (p.recurrence || { type: 'always' }) : { type: 'always' };
  document.getElementById('pf-recurrence-type').value = rec.type;

  // Days
  var selectedDays = (rec.type === 'weekdays' || rec.type === 'period') ? (rec.days || []) : [];
  document.querySelectorAll('#pf-days-row .day-btn').forEach(function (btn) {
    btn.classList.toggle('day-selected', selectedDays.indexOf(btn.getAttribute('data-day')) !== -1);
  });

  // Period range
  document.getElementById('pf-from').value = rec.type === 'period' ? (rec.from || '') : '';
  document.getElementById('pf-to').value = rec.type === 'period' ? (rec.to || '') : '';

  // Once
  document.getElementById('pf-once-date').value = rec.type === 'once' ? (rec.date || '') : '';

  // Dates list
  pfDates = rec.type === 'dates' ? (rec.dates || []).slice() : [];
  var removePfDate = function (d) {
    pfDates = pfDates.filter(function (x) { return x !== d; });
    renderPfDatesList('pf-dates-list', pfDates, removePfDate);
  };
  renderPfDatesList('pf-dates-list', pfDates, removePfDate);

  // Since
  document.getElementById('pf-since').value = rec.type === 'until_done' ? (rec.since || '') : '';

  // Exceptions
  pfExceptions = p ? (p.exceptions || []).slice() : [];
  var removePfException = function (d) {
    pfExceptions = pfExceptions.filter(function (x) { return x !== d; });
    renderPfDatesList('pf-exceptions-list', pfExceptions, removePfException);
  };
  renderPfDatesList('pf-exceptions-list', pfExceptions, removePfException);

  updateRecurrenceFields();
  showOverlay('period-overlay');
}

function updateRecurrenceFields() {
  var type = document.getElementById('pf-recurrence-type').value;
  document.getElementById('pf-days-group').style.display = (type === 'weekdays' || type === 'period') ? '' : 'none';
  document.getElementById('pf-period-range-group').style.display = type === 'period' ? '' : 'none';
  document.getElementById('pf-once-group').style.display = type === 'once' ? '' : 'none';
  document.getElementById('pf-dates-group').style.display = type === 'dates' ? '' : 'none';
  document.getElementById('pf-since-group').style.display = type === 'until_done' ? '' : 'none';
}

function renderPfDatesList(listId, dates, onRemove) {
  var el = document.getElementById(listId);
  el.innerHTML = '';
  dates.forEach(function (d) {
    var chip = document.createElement('div');
    chip.className = 'date-chip';
    chip.innerHTML = '<span>' + d + '</span><button class="date-chip-remove" type="button">×</button>';
    chip.querySelector('button').addEventListener('click', function () { onRemove(d); });
    el.appendChild(chip);
  });
}

function getPfRecurrence() {
  var type = document.getElementById('pf-recurrence-type').value;
  var rec = { type: type };
  if (type === 'weekdays') {
    rec.days = getSelectedDays();
  } else if (type === 'period') {
    rec.from = document.getElementById('pf-from').value;
    rec.to = document.getElementById('pf-to').value;
    rec.days = getSelectedDays();
  } else if (type === 'once') {
    rec.date = document.getElementById('pf-once-date').value;
  } else if (type === 'dates') {
    rec.dates = pfDates.slice();
  } else if (type === 'until_done') {
    rec.since = document.getElementById('pf-since').value;
  }
  return rec;
}

function getSelectedDays() {
  var days = [];
  document.querySelectorAll('#pf-days-row .day-btn.day-selected').forEach(function (b) { days.push(b.getAttribute('data-day')); });
  return days;
}

function savePeriod() {
  var name = document.getElementById('pf-name').value.trim();
  if (!name) { alert('Le nom est requis.'); return; }

  var periods = Storage.getPeriods();
  var isNew = !pfEditingId;
  var existing = isNew ? null : periods.find(function (p) { return p.id === pfEditingId; });

  var period = {
    id: pfEditingId || genId(),
    name: name,
    emoji: document.getElementById('pf-emoji').value.trim() || '📌',
    startHour: parseInt(document.getElementById('pf-start-hour').value) || 0,
    startMinute: parseInt(document.getElementById('pf-start-min').value) || 0,
    endHour: parseInt(document.getElementById('pf-end-hour').value) || 0,
    endMinute: parseInt(document.getElementById('pf-end-min').value) || 0,
    recurrence: getPfRecurrence(),
    exceptions: pfExceptions.slice(),
    tasks: existing ? existing.tasks : [],
  };

  if (isNew) {
    periods.push(period);
  } else {
    var idx = periods.findIndex(function (p) { return p.id === pfEditingId; });
    if (idx !== -1) periods[idx] = period;
  }

  Storage.savePeriods(periods);
  hideOverlay('period-overlay');
  renderPeriodsTab();
}

/* ---- Tasks overlay ---- */
var tasksEditingPeriodId = null;

function openTasksOverlay(periodId) {
  tasksEditingPeriodId = periodId;
  var periods = Storage.getPeriods();
  var p = periods.find(function (x) { return x.id === periodId; });
  document.getElementById('tasks-overlay-title').textContent = (p ? p.name : '') + ' — Tâches';
  document.getElementById('new-task-label').value = '';
  document.getElementById('new-task-emoji').value = '';
  document.getElementById('new-task-image').value = '';
  setTaskTypeMode('emoji');
  renderTasksEditList();
  showOverlay('tasks-overlay');
}

function renderTasksEditList() {
  var periods = Storage.getPeriods();
  var p = periods.find(function (x) { return x.id === tasksEditingPeriodId; });
  var tasks = p ? (p.tasks || []) : [];
  var list = document.getElementById('tasks-edit-list');
  list.innerHTML = '';
  tasks.forEach(function (t, i) {
    var item = document.createElement('div');
    item.className = 'task-edit-item';
    var icon = t.image ? '🖼️' : (t.emoji || '?');
    item.innerHTML =
      '<span class="task-edit-icon">' + icon + '</span>' +
      '<span class="task-edit-label">' + escHtml(t.label) + '</span>' +
      '<div class="task-edit-actions">' +
        (i > 0 ? '<button class="task-edit-btn" data-action="up" data-i="' + i + '">↑</button>' : '<span style="width:36px"></span>') +
        (i < tasks.length - 1 ? '<button class="task-edit-btn" data-action="down" data-i="' + i + '">↓</button>' : '<span style="width:36px"></span>') +
        '<button class="task-edit-btn" data-action="del" data-i="' + i + '" style="color:rgba(255,100,100,.8)">🗑️</button>' +
      '</div>';
    list.appendChild(item);
  });

  list.querySelectorAll('[data-action="up"]').forEach(function (btn) {
    btn.addEventListener('click', function () { moveTask(parseInt(btn.getAttribute('data-i')), -1); });
  });
  list.querySelectorAll('[data-action="down"]').forEach(function (btn) {
    btn.addEventListener('click', function () { moveTask(parseInt(btn.getAttribute('data-i')), 1); });
  });
  list.querySelectorAll('[data-action="del"]').forEach(function (btn) {
    btn.addEventListener('click', function () { deleteTask(parseInt(btn.getAttribute('data-i'))); });
  });
}

function moveTask(i, dir) {
  var periods = Storage.getPeriods();
  var p = periods.find(function (x) { return x.id === tasksEditingPeriodId; });
  if (!p) return;
  var j = i + dir;
  if (j < 0 || j >= p.tasks.length) return;
  var tmp = p.tasks[i]; p.tasks[i] = p.tasks[j]; p.tasks[j] = tmp;
  Storage.savePeriods(periods);
  renderTasksEditList();
}

function deleteTask(i) {
  var periods = Storage.getPeriods();
  var p = periods.find(function (x) { return x.id === tasksEditingPeriodId; });
  if (!p) return;
  p.tasks.splice(i, 1);
  Storage.savePeriods(periods);
  renderTasksEditList();
}

var taskTypeMode = 'emoji';

function setTaskTypeMode(mode) {
  taskTypeMode = mode;
  document.getElementById('task-type-emoji-btn').classList.toggle('task-type-active', mode === 'emoji');
  document.getElementById('task-type-image-btn').classList.toggle('task-type-active', mode === 'image');
  document.getElementById('new-task-emoji-group').style.display = mode === 'emoji' ? '' : 'none';
  document.getElementById('new-task-image-group').style.display = mode === 'image' ? '' : 'none';
}

function addTask() {
  var label = document.getElementById('new-task-label').value.trim();
  if (!label) { alert('Le label est requis.'); return; }

  var task = { id: genId(), label: label };
  if (taskTypeMode === 'emoji') {
    task.emoji = document.getElementById('new-task-emoji').value.trim() || '•';
  } else {
    var img = document.getElementById('new-task-image').value.trim();
    if (!img) { alert('Le nom de l\'image est requis.'); return; }
    task.image = img;
  }

  var periods = Storage.getPeriods();
  var p = periods.find(function (x) { return x.id === tasksEditingPeriodId; });
  if (!p) return;
  p.tasks.push(task);
  Storage.savePeriods(periods);

  document.getElementById('new-task-label').value = '';
  document.getElementById('new-task-emoji').value = '';
  document.getElementById('new-task-image').value = '';
  renderTasksEditList();
}

/* ---- Overlay helpers ---- */
function showOverlay(id) { document.getElementById(id).style.display = 'flex'; }
function hideOverlay(id) { document.getElementById(id).style.display = 'none'; }

/* ---- Parent calendar ---- */
var pcalState = { year: 0, month: 0 };

function renderParentCalendar() {
  if (!pcalState.year) {
    var now = new Date();
    pcalState.year = now.getFullYear();
    pcalState.month = now.getMonth();
  }
  var year = pcalState.year;
  var month = pcalState.month;
  var today = getTodayDateString();
  var now = new Date();

  document.getElementById('pcal-month-title').textContent = MONTHS_FR[month] + ' ' + year;
  document.getElementById('pcal-next-btn').disabled = (year === now.getFullYear() && month === now.getMonth());

  var grid = document.getElementById('pcalendar-grid');
  grid.innerHTML = '';

  ['L','M','M','J','V','S','D'].forEach(function (h) {
    var cell = document.createElement('div');
    cell.className = 'cal-header-cell';
    cell.textContent = h;
    grid.appendChild(cell);
  });

  var firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  for (var i = 0; i < firstDow; i++) {
    var pad = document.createElement('div');
    pad.className = 'cal-cell cal-cell-empty';
    grid.appendChild(pad);
  }

  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var periods = Storage.getPeriods();

  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = year + '-' + pad2(month + 1) + '-' + pad2(d);
    var isFuture = dateStr > today;
    var isToday = dateStr === today;

    var cell = document.createElement('div');
    cell.className = 'cal-cell' + (isToday ? ' cal-cell-today' : '') + (isFuture ? ' cal-cell-future' : '');

    var numEl = document.createElement('span');
    numEl.className = 'cal-day-num';
    numEl.textContent = d;
    cell.appendChild(numEl);

    if (!isFuture) {
      var smiley = getPCalSmiley(periods, dateStr);
      if (smiley) {
        var img = document.createElement('img');
        img.className = 'cal-smiley';
        img.src = SITE_BASE + '/assets/img/calendar/' + smiley.image + '.png';
        img.alt = smiley.label;
        cell.appendChild(img);
      }
      cell.addEventListener('click', function (ds) {
        return function () { openDayOverlay(ds); };
      }(dateStr));
    }

    grid.appendChild(cell);
  }
}

function getPCalSmiley(periods, dateStr) {
  var active = getActivePeriodsForDay(periods, dateStr);
  var checkable = [];
  active.forEach(function (p) {
    p.tasks.forEach(function (t) { if (!t.image) checkable.push(t); });
  });
  if (!checkable.length) return null;
  var ch = Storage.getCheckins(dateStr);
  var done = checkable.filter(function (t) { return ch[t.id] && ch[t.id].done; }).length;
  return getSmiley(checkable.length, done);
}

/* ---- Day overlay ---- */
var dayOverlayDate = null;

function openDayOverlay(dateStr) {
  dayOverlayDate = dateStr;
  var d = new Date(dateStr + 'T12:00:00');
  var label = DAYS_FR[d.getDay()].charAt(0).toUpperCase() + DAYS_FR[d.getDay()].slice(1) + ' ' + d.getDate() + ' ' + MONTHS_FR[d.getMonth()];
  document.getElementById('day-overlay-title').textContent = label;
  renderDayOverlay();
  showOverlay('day-overlay');
}

function renderDayOverlay() {
  var periods = Storage.getPeriods();
  var active = getActivePeriodsForDay(periods, dayOverlayDate);
  var list = document.getElementById('day-tasks-list');
  list.innerHTML = '';

  var checkable = [];
  active.forEach(function (p) {
    p.tasks.forEach(function (t) { if (!t.image) checkable.push(t); });
  });

  var emptyEl = document.getElementById('day-empty');
  emptyEl.style.display = checkable.length ? 'none' : '';

  var ch = Storage.getCheckins(dayOverlayDate);

  checkable.forEach(function (t) {
    var done = !!(ch[t.id] && ch[t.id].done);
    var item = document.createElement('div');
    item.className = 'day-task-item' + (done ? ' day-task-done' : '');
    item.innerHTML =
      '<span class="day-task-emoji">' + (t.emoji || '•') + '</span>' +
      '<span class="day-task-label">' + escHtml(t.label) + '</span>' +
      '<div class="day-task-check">' + (done ? '✓' : '') + '</div>';
    item.addEventListener('click', function () {
      Storage.toggleTask(dayOverlayDate, t.id);
      renderDayOverlay();
      renderParentCalendar();
    });
    list.appendChild(item);
  });
}

/* ---- Settings / PIN change ---- */
var settingsPinState = { step: 'old', oldPin: [], newPin: [], confirmPin: [] };

function initSettingsTab() {
  settingsPinState = { step: 'old', oldPin: [], newPin: [], confirmPin: [] };
  document.getElementById('settings-pin-error').textContent = '';
  document.getElementById('settings-pin-success').textContent = '';
  document.getElementById('new-pin-group').style.display = 'none';
  document.getElementById('new-pin-label').textContent = 'Nouveau code';
  updateSettingsDots();
  buildMiniKeypad('old-pin-keypad', 'old');
  buildMiniKeypad('new-pin-keypad', 'new');
}

function buildMiniKeypad(containerId, target) {
  var container = document.getElementById(containerId);
  container.innerHTML = '';
  var digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  digits.forEach(function (d) {
    if (d === '') { var spacer = document.createElement('div'); container.appendChild(spacer); return; }
    var btn = document.createElement('button');
    btn.className = 'pin-mini-key';
    btn.textContent = d;
    btn.type = 'button';
    btn.addEventListener('click', function () { handleSettingsDigit(target, d); });
    container.appendChild(btn);
  });
}

function handleSettingsDigit(target, d) {
  var step = settingsPinState.step;
  var currentArr = step === 'old' ? settingsPinState.oldPin : (step === 'new' ? settingsPinState.newPin : settingsPinState.confirmPin);

  if (d === '⌫') {
    if (currentArr.length) { currentArr.pop(); updateSettingsDots(); }
    return;
  }
  if (currentArr.length >= 4) return;
  currentArr.push(d);
  updateSettingsDots();

  if (currentArr.length === 4) {
    if (step === 'old') validateOldPin();
    else if (step === 'new') { settingsPinState.step = 'confirm'; document.getElementById('new-pin-label').textContent = 'Confirmer le code'; updateSettingsDots(); }
    else validateNewPinConfirm();
  }
}

function updateSettingsDots() {
  var step = settingsPinState.step;
  var arr = step === 'old' ? settingsPinState.oldPin : (step === 'new' ? settingsPinState.newPin : settingsPinState.confirmPin);
  var dotsId = step === 'old' ? 'old-pin-dots' : 'new-pin-dots';

  // Show/hide new pin group
  document.getElementById('new-pin-group').style.display = (step === 'old') ? 'none' : '';

  document.querySelectorAll('#' + dotsId + ' .pin-dot').forEach(function (dot, i) {
    dot.classList.toggle('pin-dot-filled', i < arr.length);
  });
}

async function validateOldPin() {
  var stored = localStorage.getItem(PIN_KEY);
  var hash = await sha256(settingsPinState.oldPin.join(''));
  if (hash !== stored) {
    document.getElementById('settings-pin-error').textContent = 'Code incorrect';
    settingsPinState.oldPin = [];
    updateSettingsDots();
    return;
  }
  document.getElementById('settings-pin-error').textContent = '';
  settingsPinState.step = 'new';
  settingsPinState.newPin = [];
  document.getElementById('new-pin-group').style.display = '';
  document.getElementById('new-pin-label').textContent = 'Nouveau code';
  updateSettingsDots();
}

async function validateNewPinConfirm() {
  var np = settingsPinState.newPin.join('');
  var cp = settingsPinState.confirmPin.join('');
  if (np !== cp) {
    document.getElementById('settings-pin-error').textContent = 'Les codes ne correspondent pas';
    settingsPinState.step = 'new';
    settingsPinState.newPin = [];
    settingsPinState.confirmPin = [];
    document.getElementById('new-pin-label').textContent = 'Nouveau code';
    updateSettingsDots();
    return;
  }
  localStorage.setItem(PIN_KEY, await sha256(np));
  document.getElementById('settings-pin-error').textContent = '';
  document.getElementById('settings-pin-success').textContent = 'Code mis à jour ✓';
  settingsPinState = { step: 'old', oldPin: [], newPin: [], confirmPin: [] };
  document.getElementById('new-pin-group').style.display = 'none';
  updateSettingsDots();
  setTimeout(function () { document.getElementById('settings-pin-success').textContent = ''; }, 3000);
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', function () {
  // PIN gate
  var stored = localStorage.getItem(PIN_KEY);
  if (!stored) enterCreateMode(); else enterUnlockMode();

  document.querySelectorAll('.pin-key[data-digit]').forEach(function (btn) {
    btn.addEventListener('click', function () { addDigit(btn.getAttribute('data-digit')); });
  });
  document.getElementById('pin-back').addEventListener('click', removeDigit);
  document.getElementById('btn-lock').addEventListener('click', lock);

  document.addEventListener('keydown', function (e) {
    if (document.getElementById('parent-content').style.display !== 'none') return;
    if (e.key >= '0' && e.key <= '9') addDigit(e.key);
    else if (e.key === 'Backspace') removeDigit();
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-tab')); });
  });

  // Period overlay
  document.getElementById('btn-add-period').addEventListener('click', function () { openPeriodForm(null); });
  document.getElementById('period-overlay-back').addEventListener('click', function () { hideOverlay('period-overlay'); });
  document.getElementById('period-save-btn').addEventListener('click', savePeriod);
  document.getElementById('pf-recurrence-type').addEventListener('change', updateRecurrenceFields);

  document.querySelectorAll('#pf-days-row .day-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { btn.classList.toggle('day-selected'); });
  });

  document.getElementById('pf-add-date-btn').addEventListener('click', function () {
    var val = document.getElementById('pf-add-date-input').value;
    if (val && pfDates.indexOf(val) === -1) {
      pfDates.push(val); pfDates.sort();
      var cb = function (d) { pfDates = pfDates.filter(function (x) { return x !== d; }); renderPfDatesList('pf-dates-list', pfDates, cb); };
      renderPfDatesList('pf-dates-list', pfDates, cb);
      document.getElementById('pf-add-date-input').value = '';
    }
  });

  document.getElementById('pf-add-exception-btn').addEventListener('click', function () {
    var val = document.getElementById('pf-add-exception-input').value;
    if (val && pfExceptions.indexOf(val) === -1) {
      pfExceptions.push(val); pfExceptions.sort();
      var cb = function (d) { pfExceptions = pfExceptions.filter(function (x) { return x !== d; }); renderPfDatesList('pf-exceptions-list', pfExceptions, cb); };
      renderPfDatesList('pf-exceptions-list', pfExceptions, cb);
      document.getElementById('pf-add-exception-input').value = '';
    }
  });

  document.getElementById('btn-manage-tasks').addEventListener('click', function () {
    var id = pfEditingId || document.getElementById('pf-id').value;
    if (!id) { alert('Enregistrez d\'abord la période avant de gérer ses tâches.'); return; }
    openTasksOverlay(id);
  });

  // Tasks overlay
  document.getElementById('tasks-overlay-back').addEventListener('click', function () {
    hideOverlay('tasks-overlay');
    // Refresh period form tasks count if still open
    renderPeriodsTab();
  });
  document.getElementById('task-type-emoji-btn').addEventListener('click', function () { setTaskTypeMode('emoji'); });
  document.getElementById('task-type-image-btn').addEventListener('click', function () { setTaskTypeMode('image'); });
  document.getElementById('btn-add-task').addEventListener('click', addTask);

  // Calendar
  document.getElementById('pcal-prev-btn').addEventListener('click', function () {
    pcalState.month--;
    if (pcalState.month < 0) { pcalState.month = 11; pcalState.year--; }
    renderParentCalendar();
  });
  document.getElementById('pcal-next-btn').addEventListener('click', function () {
    pcalState.month++;
    if (pcalState.month > 11) { pcalState.month = 0; pcalState.year++; }
    renderParentCalendar();
  });

  // Day overlay
  document.getElementById('day-overlay-back').addEventListener('click', function () {
    hideOverlay('day-overlay');
    renderParentCalendar();
  });
});
