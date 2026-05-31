/* ---- UUID ---- */

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/* ---- Hash PIN (SHA-256) ---- */

function hashPin(pin, callback) {
  var data = new TextEncoder().encode(pin);
  crypto.subtle.digest('SHA-256', data).then(function (buf) {
    var hex = Array.from(new Uint8Array(buf))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
    callback(hex);
  });
}

/* ---- PIN Gate ---- */

var pinBuffer    = '';
var pinSetupMode = false;

function updatePinDots(dotsId, count) {
  document.querySelectorAll('#' + dotsId + ' .pin-dot').forEach(function (d, i) {
    d.classList.toggle('pin-dot-filled', i < count);
  });
}

function shakePinDots() {
  var dotsEl = document.getElementById('pin-dots');
  dotsEl.classList.add('pin-shake');
  dotsEl.addEventListener('animationend', function () {
    dotsEl.classList.remove('pin-shake');
  }, { once: true });
}

function showPinError(msg) {
  document.getElementById('pin-error').textContent = msg;
}

function unlockParent() {
  document.getElementById('pin-gate').style.display       = 'none';
  document.getElementById('parent-content').style.display = '';
  renderTaskList();
  renderArchivedList();
  renderGallery();
}

function onPinComplete(pin) {
  hashPin(pin, function (hash) {
    if (pinSetupMode) {
      Storage.savePin(hash);
      unlockParent();
      return;
    }
    if (hash === Storage.getPin()) {
      showPinError('');
      unlockParent();
    } else {
      shakePinDots();
      showPinError('Code incorrect');
    }
  });
}

function initPinGate() {
  pinSetupMode = !Storage.getPin();
  if (pinSetupMode) {
    document.getElementById('pin-title').textContent = 'Créer votre code';
  }

  document.querySelectorAll('.pin-key[data-digit]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (pinBuffer.length >= 4) return;
      pinBuffer += btn.dataset.digit;
      updatePinDots('pin-dots', pinBuffer.length);
      if (pinBuffer.length === 4) {
        var pin = pinBuffer;
        pinBuffer = '';
        updatePinDots('pin-dots', 0);
        onPinComplete(pin);
      }
    });
  });

  document.getElementById('pin-back').addEventListener('click', function () {
    if (!pinBuffer.length) return;
    pinBuffer = pinBuffer.slice(0, -1);
    showPinError('');
    updatePinDots('pin-dots', pinBuffer.length);
  });

  document.getElementById('btn-lock').addEventListener('click', function () {
    pinBuffer = '';
    updatePinDots('pin-dots', 0);
    showPinError('');
    document.getElementById('parent-content').style.display = 'none';
    document.getElementById('pin-gate').style.display       = '';
  });
}

/* ---- Onglets ---- */

var oldPinKp = null;
var newPinKp = null;

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(function (b) {
        b.classList.toggle('tab-active', b === btn);
      });
      document.querySelectorAll('.tab-pane').forEach(function (p) {
        p.classList.toggle('tab-pane-active', p.id === 'tab-' + tab);
      });
      if (tab === 'calendar') initParentCalendarTab();
      if (tab === 'settings') onSettingsTabActivated();
    });
  });
}

/* ---- Résumé récurrence ---- */

function recurrenceSummary(task) {
  var rec = task.recurrence || {};
  if (rec.untilCompletion) return 'Jusqu\'à complétion';
  var every  = rec.every || 1;
  var unit   = rec.unit  || 'days';
  var single = { days: 'jour', weeks: 'semaine', months: 'mois', years: 'an' };
  var plural = { days: 'jours', weeks: 'semaines', months: 'mois', years: 'ans' };
  var base = every === 1
    ? 'Chaque ' + single[unit]
    : 'Tous les ' + every + ' ' + plural[unit];
  if (unit === 'weeks' && (rec.days || []).length) {
    var SHORT = { lundi: 'lun', mardi: 'mar', mercredi: 'mer', jeudi: 'jeu', vendredi: 'ven', samedi: 'sam', dimanche: 'dim' };
    base += ' (' + rec.days.map(function (d) { return SHORT[d] || d; }).join(', ') + ')';
  }
  if (unit === 'months' && rec.dayOfMonth) base += ' le ' + rec.dayOfMonth;
  return base;
}

/* ---- Ligne horaire (schedule row) ---- */

function buildScheduleRow(schedule) {
  var li = document.createElement('li');
  li.className = 'schedule-row';

  var toggle = document.createElement('div');
  toggle.className = 'task-type-toggle';

  var periodBtn = document.createElement('button');
  periodBtn.type = 'button';
  periodBtn.className = 'task-type-btn' + (schedule.type === 'period' ? ' task-type-active' : '');
  periodBtn.dataset.type = 'period';
  periodBtn.textContent  = 'Période';

  var timeBtn = document.createElement('button');
  timeBtn.type = 'button';
  timeBtn.className = 'task-type-btn' + (schedule.type === 'time' ? ' task-type-active' : '');
  timeBtn.dataset.type  = 'time';
  timeBtn.textContent   = 'Heure';

  toggle.appendChild(periodBtn);
  toggle.appendChild(timeBtn);

  var periodSel = document.createElement('select');
  periodSel.className = 'form-select sched-period-select';
  if (schedule.type === 'time') periodSel.style.display = 'none';
  ['matin', 'matinée', 'midi', 'après-midi', 'goûter', 'soir', 'nuit'].forEach(function (p) {
    var opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
    if (schedule.type === 'period' && schedule.value === p) opt.selected = true;
    periodSel.appendChild(opt);
  });

  var timeInput = document.createElement('input');
  timeInput.type = 'time';
  timeInput.className = 'form-input sched-time-input';
  if (schedule.type === 'time') { timeInput.value = schedule.value || ''; }
  else                          { timeInput.style.display = 'none'; }

  var removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-icon';
  removeBtn.setAttribute('aria-label', 'Supprimer');
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', function () { li.remove(); });

  function activateType(type) {
    periodBtn.classList.toggle('task-type-active', type === 'period');
    timeBtn.classList.toggle('task-type-active',   type === 'time');
    periodSel.style.display = type === 'period' ? '' : 'none';
    timeInput.style.display = type === 'time'   ? '' : 'none';
  }
  periodBtn.addEventListener('click', function () { activateType('period'); });
  timeBtn.addEventListener('click',   function () { activateType('time');   });

  li.appendChild(toggle);
  li.appendChild(periodSel);
  li.appendChild(timeInput);
  li.appendChild(removeBtn);
  return li;
}

/* ---- Ligne exception ---- */

function addExceptionRow(dateStr) {
  var ul = document.getElementById('exceptions-list');
  var li = document.createElement('li');
  li.className    = 'exception-item date-chip';
  li.dataset.date = dateStr;

  var span = document.createElement('span');
  span.textContent = dateStr;

  var removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'date-chip-remove';
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', function () { li.remove(); });

  li.appendChild(span);
  li.appendChild(removeBtn);
  ul.appendChild(li);
}

/* ---- Visibilité récurrence ---- */

function syncRecurrenceVisibility() {
  var unit            = document.getElementById('tf-unit').value;
  var untilCompletion = document.getElementById('tf-until-completion').checked;
  document.getElementById('tf-days-group').style.display      = unit === 'weeks'  ? '' : 'none';
  document.getElementById('tf-month-day-group').style.display = unit === 'months' ? '' : 'none';
  document.getElementById('tf-end-group').style.display       = untilCompletion   ? 'none' : '';
}

/* ---- Overlay tâche ---- */

var overlayImageId = null;

function openTaskOverlay(task) {
  overlayImageId = task ? (task.image || null) : null;

  document.getElementById('task-overlay-title').textContent = task ? 'Modifier la tâche' : 'Nouvelle tâche';
  document.getElementById('tf-id').value    = task ? task.id    : '';
  document.getElementById('tf-label').value = task ? task.label : '';
  document.getElementById('tf-emoji').value = (task && task.emoji) ? task.emoji : '';

  var _gallEntry = (task && task.image)
    ? (Storage.getGallery().filter(function (g) { return g.id === task.image; })[0] || null)
    : null;

  if (_gallEntry) {
    overlayImageId = task.image;
    document.getElementById('tf-type-image-btn').classList.add('task-type-active');
    document.getElementById('tf-type-emoji-btn').classList.remove('task-type-active');
    document.getElementById('tf-emoji-group').style.display    = 'none';
    document.getElementById('tf-image-group').style.display    = '';
    document.getElementById('tf-image-preview-img').src        = _gallEntry.data;
    document.getElementById('tf-image-preview').style.display  = '';
    document.getElementById('tf-gallery-picker').style.display = 'none';
  } else {
    overlayImageId = null;
    document.getElementById('tf-type-emoji-btn').classList.add('task-type-active');
    document.getElementById('tf-type-image-btn').classList.remove('task-type-active');
    document.getElementById('tf-emoji-group').style.display    = '';
    document.getElementById('tf-image-group').style.display    = 'none';
    document.getElementById('tf-image-preview').style.display  = 'none';
  }

  var schedList = document.getElementById('schedules-list');
  schedList.innerHTML = '';
  var schedules = (task && task.schedules && task.schedules.length)
    ? task.schedules : [{ type: 'period', value: 'matin' }];
  schedules.forEach(function (s) { schedList.appendChild(buildScheduleRow(s)); });

  var rec = (task && task.recurrence)
    ? task.recurrence : { every: 1, unit: 'days', untilCompletion: false };
  document.getElementById('tf-every').value = rec.every || 1;
  document.getElementById('tf-unit').value  = rec.unit  || 'days';
  document.querySelectorAll('input[name="tf-day"]').forEach(function (cb) {
    cb.checked = (rec.unit === 'weeks' && (rec.days || []).indexOf(cb.value) !== -1);
  });
  document.getElementById('tf-day-of-month').value =
    (rec.unit === 'months' && rec.dayOfMonth) ? rec.dayOfMonth : '';
  document.getElementById('tf-until-completion').checked = !!rec.untilCompletion;

  var end = (task && task.end) ? task.end : { type: 'never' };
  var endRadio = document.querySelector('input[name="tf-end"][value="' + (end.type || 'never') + '"]');
  if (endRadio) endRadio.checked = true;
  document.getElementById('tf-end-date').value        = end.date        || '';
  document.getElementById('tf-end-occurrences').value = end.occurrences || '';

  var excList = document.getElementById('exceptions-list');
  excList.innerHTML = '';
  if (task && task.exceptions) task.exceptions.forEach(function (ds) { addExceptionRow(ds); });

  document.getElementById('tf-delete-group').style.display = task ? '' : 'none';
  syncRecurrenceVisibility();
  document.getElementById('task-overlay').style.display = 'flex';
  document.getElementById('tf-label').focus();
}

function closeTaskOverlay() {
  document.getElementById('task-overlay').style.display = 'none';
  overlayImageId = null;
}

function collectFormData() {
  var schedules = [];
  document.querySelectorAll('#schedules-list .schedule-row').forEach(function (row) {
    var activeBtn = row.querySelector('.task-type-btn.task-type-active');
    var type = activeBtn ? activeBtn.dataset.type : 'period';
    if (type === 'period') {
      var sel = row.querySelector('.sched-period-select');
      if (sel) schedules.push({ type: 'period', value: sel.value });
    } else {
      var inp = row.querySelector('.sched-time-input');
      if (inp && inp.value) schedules.push({ type: 'time', value: inp.value });
    }
  });

  var unit = document.getElementById('tf-unit').value;
  var days = [];
  if (unit === 'weeks') {
    document.querySelectorAll('input[name="tf-day"]:checked').forEach(function (cb) { days.push(cb.value); });
  }
  var dayOfMonth = null;
  if (unit === 'months') {
    dayOfMonth = parseInt(document.getElementById('tf-day-of-month').value, 10) || null;
  }

  var untilCompletion = document.getElementById('tf-until-completion').checked;
  var endRadio = document.querySelector('input[name="tf-end"]:checked');
  var endType  = endRadio ? endRadio.value : 'never';
  var endDate  = endType === 'date'
    ? (document.getElementById('tf-end-date').value || null) : null;
  var endOcc   = endType === 'occurrences'
    ? (parseInt(document.getElementById('tf-end-occurrences').value, 10) || null) : null;

  var exceptions = [];
  document.querySelectorAll('#exceptions-list .exception-item').forEach(function (li) {
    if (li.dataset.date) exceptions.push(li.dataset.date);
  });

  return {
    label:   document.getElementById('tf-label').value.trim(),
    emoji:   document.getElementById('tf-emoji').value.trim() || '•',
    image:   overlayImageId,
    schedules: schedules,
    recurrence: {
      every:           parseInt(document.getElementById('tf-every').value, 10) || 1,
      unit:            unit,
      days:            days,
      dayOfMonth:      dayOfMonth,
      untilCompletion: untilCompletion,
    },
    end: {
      type:        untilCompletion ? 'never' : endType,
      date:        untilCompletion ? null    : endDate,
      occurrences: untilCompletion ? null    : endOcc,
    },
    exceptions: exceptions,
  };
}

function saveTask() {
  var data       = collectFormData();
  var labelInput = document.getElementById('tf-label');
  if (!data.label) {
    labelInput.style.borderColor = 'rgba(255,100,100,0.8)';
    labelInput.focus();
    return;
  }
  labelInput.style.borderColor = '';

  var id = document.getElementById('tf-id').value;
  if (id) {
    Storage.updateTask(id, {
      label:      data.label,
      emoji:      data.emoji,
      image:      data.image,
      schedules:  data.schedules,
      recurrence: data.recurrence,
      end:        data.end,
      exceptions: data.exceptions,
    });
  } else {
    Storage.addTask({
      id:          generateUUID(),
      label:       data.label,
      emoji:       data.emoji,
      image:       data.image,
      schedules:   data.schedules,
      recurrence:  data.recurrence,
      end:         data.end,
      exceptions:  data.exceptions,
      createdAt:   new Date().toISOString(),
      deletedAt:   null,
      completedAt: null,
    });
  }

  closeTaskOverlay();
  renderTaskList();
  renderArchivedList();
}

function initTaskOverlay() {
  document.getElementById('btn-add-task').addEventListener('click', function () { openTaskOverlay(null); });
  document.getElementById('task-overlay-back').addEventListener('click', closeTaskOverlay);
  document.getElementById('task-cancel-btn').addEventListener('click', closeTaskOverlay);
  document.getElementById('task-save-btn').addEventListener('click', saveTask);
  document.getElementById('task-save-btn-bottom').addEventListener('click', saveTask);

  document.getElementById('task-delete-btn').addEventListener('click', function () {
    var id = document.getElementById('tf-id').value;
    if (!id || !confirm('Supprimer cette tâche ?')) return;
    Storage.softDeleteTask(id);
    closeTaskOverlay();
    renderTaskList();
    renderArchivedList();
  });

  document.getElementById('btn-add-schedule').addEventListener('click', function () {
    document.getElementById('schedules-list').appendChild(buildScheduleRow({ type: 'period', value: 'matin' }));
  });

  document.getElementById('tf-unit').addEventListener('change', syncRecurrenceVisibility);
  document.getElementById('tf-until-completion').addEventListener('change', syncRecurrenceVisibility);

  document.getElementById('tf-type-emoji-btn').addEventListener('click', function () {
    document.getElementById('tf-type-emoji-btn').classList.add('task-type-active');
    document.getElementById('tf-type-image-btn').classList.remove('task-type-active');
    document.getElementById('tf-emoji-group').style.display    = '';
    document.getElementById('tf-image-group').style.display    = 'none';
    document.getElementById('tf-gallery-picker').style.display = 'none';
    overlayImageId = null;
  });

  document.getElementById('tf-type-image-btn').addEventListener('click', function () {
    document.getElementById('tf-type-image-btn').classList.add('task-type-active');
    document.getElementById('tf-type-emoji-btn').classList.remove('task-type-active');
    document.getElementById('tf-emoji-group').style.display = 'none';
    document.getElementById('tf-image-group').style.display = '';
  });

  document.getElementById('tf-image-btn').addEventListener('click', function () {
    document.getElementById('tf-image-file').click();
  });

  document.getElementById('tf-image-file').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var entry = Storage.addToGallery(file.name, ev.target.result);
      selectGalleryImage(entry.id, entry.data);
      renderGallery();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  document.getElementById('tf-image-remove').addEventListener('click', function () {
    overlayImageId = null;
    document.getElementById('tf-image-preview').style.display  = 'none';
    document.getElementById('tf-gallery-picker').style.display = 'none';
    document.getElementById('tf-image-file').value = '';
  });

  document.getElementById('tf-gallery-btn').addEventListener('click', function () {
    var picker = document.getElementById('tf-gallery-picker');
    if (picker.style.display !== 'none') { picker.style.display = 'none'; return; }
    openGalleryPicker();
  });

  document.getElementById('btn-add-exception').addEventListener('click', function () {
    var input = document.getElementById('tf-exception-date');
    if (input.value) { addExceptionRow(input.value); input.value = ''; }
  });
}

/* ---- Liste des tâches actives ---- */

function buildTaskItem(task) {
  var li = document.createElement('li');
  li.className = 'task-item';

  var iconEl = document.createElement('span');
  iconEl.className = 'task-item-icon';
  if (task.image) {
    var img = document.createElement('img');
    img.src = task.image; img.alt = task.label;
    iconEl.appendChild(img);
  } else {
    iconEl.textContent = task.emoji || '•';
  }

  var infoEl  = document.createElement('div');
  infoEl.className = 'task-item-info';
  var labelEl = document.createElement('span');
  labelEl.className = 'task-item-label'; labelEl.textContent = task.label;
  var metaEl  = document.createElement('span');
  metaEl.className  = 'task-item-meta';  metaEl.textContent  = recurrenceSummary(task);
  infoEl.appendChild(labelEl);
  infoEl.appendChild(metaEl);

  var actionsEl = document.createElement('div');
  actionsEl.className = 'task-item-actions';

  var editBtn = document.createElement('button');
  editBtn.className = 'btn-icon';
  editBtn.setAttribute('aria-label', 'Modifier');
  editBtn.textContent = '✏️';
  (function (t) { editBtn.addEventListener('click', function () { openTaskOverlay(t); }); })(task);

  var deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-icon btn-icon-danger';
  deleteBtn.setAttribute('aria-label', 'Supprimer');
  deleteBtn.textContent = '🗑';
  (function (t) {
    deleteBtn.addEventListener('click', function () {
      Storage.softDeleteTask(t.id);
      renderTaskList();
      renderArchivedList();
    });
  })(task);

  actionsEl.appendChild(editBtn);
  actionsEl.appendChild(deleteBtn);
  li.appendChild(iconEl);
  li.appendChild(infoEl);
  li.appendChild(actionsEl);
  return li;
}

function renderTaskList() {
  var ul    = document.getElementById('task-list');
  var tasks = Storage.getActiveTasks();
  ul.innerHTML = '';
  if (!tasks.length) {
    var empty = document.createElement('li');
    empty.className = 'task-item-empty'; empty.textContent = 'Aucune tâche active.';
    ul.appendChild(empty);
    return;
  }
  tasks.forEach(function (t) { ul.appendChild(buildTaskItem(t)); });
}

/* ---- Section archivées ---- */

function buildArchivedItem(task) {
  var li = document.createElement('li');
  li.className = 'task-item task-item-archived';

  var iconEl = document.createElement('span');
  iconEl.className = 'task-item-icon'; iconEl.textContent = task.emoji || '•';

  var infoEl  = document.createElement('div');
  infoEl.className = 'task-item-info';
  var labelEl = document.createElement('span');
  labelEl.className = 'task-item-label'; labelEl.textContent = task.label;
  var dateEl  = document.createElement('span');
  dateEl.className  = 'task-item-meta';
  dateEl.textContent = 'Archivée le ' + ((task.deletedAt || '').slice(0, 10) || '—');
  infoEl.appendChild(labelEl);
  infoEl.appendChild(dateEl);

  var actionsEl = document.createElement('div');
  actionsEl.className = 'task-item-actions';

  var restoreBtn = document.createElement('button');
  restoreBtn.className = 'btn-icon';
  restoreBtn.setAttribute('aria-label', 'Restaurer');
  restoreBtn.textContent = '↩️';
  (function (t) {
    restoreBtn.addEventListener('click', function () {
      Storage.restoreTask(t.id);
      renderTaskList();
      renderArchivedList();
    });
  })(task);

  var deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-icon btn-icon-danger';
  deleteBtn.setAttribute('aria-label', 'Supprimer définitivement');
  deleteBtn.textContent = '🗑';
  (function (t) {
    deleteBtn.addEventListener('click', function () {
      if (!confirm('Supprimer définitivement "' + t.label + '" ?')) return;
      Storage.hardDeleteTask(t.id);
      renderArchivedList();
    });
  })(task);

  actionsEl.appendChild(restoreBtn);
  actionsEl.appendChild(deleteBtn);
  li.appendChild(iconEl);
  li.appendChild(infoEl);
  li.appendChild(actionsEl);
  return li;
}

function renderArchivedList() {
  var ul    = document.getElementById('archived-list');
  var tasks = Storage.getArchivedTasks();
  ul.innerHTML = '';
  if (!tasks.length) {
    var empty = document.createElement('li');
    empty.className = 'task-item-empty'; empty.textContent = 'Aucune tâche archivée.';
    ul.appendChild(empty);
    return;
  }
  tasks.forEach(function (t) { ul.appendChild(buildArchivedItem(t)); });
}

/* ---- Galerie ---- */

function selectGalleryImage(id, data) {
  overlayImageId = id;
  document.getElementById('tf-image-preview-img').src      = data;
  document.getElementById('tf-image-preview').style.display  = '';
  document.getElementById('tf-gallery-picker').style.display = 'none';
}

function openGalleryPicker() {
  var gallery  = Storage.getGallery();
  var grid     = document.getElementById('tf-gallery-picker-grid');
  var emptyEl  = document.getElementById('tf-gallery-picker-empty');
  var picker   = document.getElementById('tf-gallery-picker');
  grid.innerHTML = '';

  if (!gallery.length) {
    emptyEl.style.display = '';
    picker.style.display  = '';
    return;
  }
  emptyEl.style.display = 'none';

  gallery.forEach(function (entry) {
    var item = document.createElement('div');
    item.className = 'gallery-picker-item' + (overlayImageId === entry.id ? ' gallery-item-selected' : '');

    var img = document.createElement('img');
    img.src = entry.data; img.alt = entry.name;
    item.appendChild(img);

    (function (e) {
      item.addEventListener('click', function () { selectGalleryImage(e.id, e.data); });
    })(entry);

    grid.appendChild(item);
  });
  picker.style.display = '';
}

function renderGallery() {
  var gallery  = Storage.getGallery();
  var grid     = document.getElementById('gallery-grid');
  var emptyEl  = document.getElementById('gallery-empty-msg');
  if (!grid) return;
  grid.innerHTML = '';

  if (!gallery.length) { emptyEl.style.display = ''; return; }
  emptyEl.style.display = 'none';

  gallery.forEach(function (entry) {
    var item = document.createElement('div');
    item.className = 'gallery-mgmt-item';

    var img = document.createElement('img');
    img.src = entry.data; img.alt = entry.name;
    item.appendChild(img);

    var delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'gallery-item-delete';
    delBtn.setAttribute('aria-label', 'Supprimer');
    delBtn.textContent = '✕';
    (function (id) {
      delBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (!confirm('Supprimer cette image de la galerie ?')) return;
        Storage.removeFromGallery(id);
        renderGallery();
        renderTaskList();
      });
    })(entry.id);

    item.appendChild(delBtn);
    grid.appendChild(item);
  });
}

function initGallery() {
  document.getElementById('btn-gallery-import').addEventListener('click', function () {
    document.getElementById('gallery-import-file').click();
  });
  document.getElementById('gallery-import-file').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      Storage.addToGallery(file.name, ev.target.result);
      renderGallery();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
}

/* ---- Calendrier parent ---- */

var parentCalState = { year: 0, month: 0, ready: false };

function initParentCalendarTab() {
  var container = document.getElementById('parent-calendar');
  if (!container) return;

  if (!parentCalState.ready) {
    parentCalState.ready = true;
    var now = new Date();
    parentCalState.year  = now.getFullYear();
    parentCalState.month = now.getMonth();

    var topbar = document.createElement('div');
    topbar.className = 'pcal-topbar';
    var nav = document.createElement('div');
    nav.className = 'cal-nav';

    var prevBtn = document.createElement('button');
    prevBtn.className = 'cal-nav-btn';
    prevBtn.setAttribute('aria-label', 'Mois précédent');
    prevBtn.textContent = '‹';

    var titleEl = document.createElement('span');
    titleEl.className = 'cal-month-title';

    var nextBtn = document.createElement('button');
    nextBtn.className = 'cal-nav-btn';
    nextBtn.setAttribute('aria-label', 'Mois suivant');
    nextBtn.textContent = '›';

    nav.appendChild(prevBtn);
    nav.appendChild(titleEl);
    nav.appendChild(nextBtn);
    topbar.appendChild(nav);
    container.appendChild(topbar);

    var gridEl = document.createElement('div');
    gridEl.className = 'calendar-grid';
    container.appendChild(gridEl);

    container._calTitle = titleEl;
    container._calNext  = nextBtn;
    container._calGrid  = gridEl;

    prevBtn.addEventListener('click', function () {
      parentCalState.month--;
      if (parentCalState.month < 0) { parentCalState.month = 11; parentCalState.year--; }
      renderParentCalendar();
    });
    nextBtn.addEventListener('click', function () {
      var n = new Date();
      if (parentCalState.year === n.getFullYear() && parentCalState.month === n.getMonth()) return;
      parentCalState.month++;
      if (parentCalState.month > 11) { parentCalState.month = 0; parentCalState.year++; }
      renderParentCalendar();
    });
  }

  renderParentCalendar();
}

function renderParentCalendar() {
  var c = document.getElementById('parent-calendar');
  if (!c || !c._calGrid) return;
  renderCalendarGrid(c._calGrid, c._calTitle, c._calNext, parentCalState, openDayOverlay);
}

/* ---- Overlay jour (validation rétroactive) ---- */

var DAY_NAMES_LONG   = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
var MONTH_NAMES_LONG = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function openDayOverlay(dateStr) {
  var d = new Date(dateStr + 'T12:00:00');
  document.getElementById('day-overlay-title').textContent =
    DAY_NAMES_LONG[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH_NAMES_LONG[d.getMonth()];
  document.getElementById('day-overlay').dataset.dateStr = dateStr;
  renderDayTasks(dateStr);
  document.getElementById('day-overlay').style.display = 'flex';
}

function closeDayOverlay() {
  document.getElementById('day-overlay').style.display = 'none';
  renderParentCalendar();
}

function renderDayTasks(dateStr) {
  var list    = document.getElementById('day-tasks-list');
  var emptyEl = document.getElementById('day-empty');
  list.innerHTML = '';

  var tasks     = Storage.getTasks();
  var instances = [];
  tasks.forEach(function (task) {
    instances = instances.concat(getTaskInstancesForDay(task, dateStr));
  });
  instances.sort(function (a, b) { return a.startMinutes - b.startMinutes; });

  if (!instances.length) { emptyEl.style.display = ''; return; }
  emptyEl.style.display = 'none';

  var completions = Storage.getCompletions(dateStr);

  instances.forEach(function (inst) {
    var key    = inst.taskId + ':' + inst.scheduleIndex;
    var isDone = !!completions[key];

    var item = document.createElement('div');
    item.className = 'day-task-item' + (isDone ? ' day-task-done' : '');

    var iconEl = document.createElement('span');
    iconEl.className = 'day-task-emoji';
    if (inst.image) {
      var img = document.createElement('img');
      img.src = inst.image; img.alt = inst.label;
      img.style.cssText = 'width:32px;height:32px;object-fit:cover;border-radius:6px;';
      iconEl.appendChild(img);
    } else {
      iconEl.textContent = inst.emoji || '•';
    }

    var labelEl = document.createElement('span');
    labelEl.className = 'day-task-label'; labelEl.textContent = inst.label;

    var checkEl = document.createElement('span');
    checkEl.className = 'day-task-check';
    if (isDone) checkEl.textContent = '✓';

    item.appendChild(iconEl);
    item.appendChild(labelEl);
    item.appendChild(checkEl);

    (function (k) {
      item.addEventListener('click', function () {
        var obj = Storage.getCompletions(dateStr);
        if (obj[k]) { delete obj[k]; } else { obj[k] = true; }
        Storage.saveCompletions(dateStr, obj);
        renderDayTasks(dateStr);
      });
    })(key);

    list.appendChild(item);
  });
}

/* ---- Paramètres ---- */

var settingsInitialized = false;

function initMiniKeypad(containerId, dotsId, onComplete) {
  var container = document.getElementById(containerId);
  if (!container) return null;
  var state = { buffer: '' };

  function syncDots() {
    document.querySelectorAll('#' + dotsId + ' .pin-dot').forEach(function (d, i) {
      d.classList.toggle('pin-dot-filled', i < state.buffer.length);
    });
  }

  function addKey(label, handler) {
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'pin-mini-key';
    btn.textContent = label;
    btn.addEventListener('click', handler);
    container.appendChild(btn);
  }

  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (d) {
    addKey(String(d), function () {
      if (state.buffer.length >= 4) return;
      state.buffer += String(d); syncDots();
      if (state.buffer.length === 4) {
        var pin = state.buffer; state.buffer = ''; syncDots(); onComplete(pin);
      }
    });
  });
  container.appendChild(document.createElement('div'));
  addKey('0', function () {
    if (state.buffer.length >= 4) return;
    state.buffer += '0'; syncDots();
    if (state.buffer.length === 4) {
      var pin = state.buffer; state.buffer = ''; syncDots(); onComplete(pin);
    }
  });
  addKey('⌫', function () {
    if (!state.buffer.length) return;
    state.buffer = state.buffer.slice(0, -1); syncDots();
  });

  return { reset: function () { state.buffer = ''; syncDots(); } };
}

function onSettingsTabActivated() {
  if (!settingsInitialized) {
    settingsInitialized = true;

    oldPinKp = initMiniKeypad('old-pin-keypad', 'old-pin-dots', function (pin) {
      hashPin(pin, function (hash) {
        if (hash !== Storage.getPin()) {
          document.getElementById('settings-pin-error').textContent = 'Code incorrect.';
          return;
        }
        document.getElementById('settings-pin-error').textContent = '';
        document.getElementById('new-pin-group').style.display    = '';
      });
    });

    newPinKp = initMiniKeypad('new-pin-keypad', 'new-pin-dots', function (pin) {
      hashPin(pin, function (hash) {
        Storage.savePin(hash);
        document.getElementById('new-pin-group').style.display      = 'none';
        document.getElementById('settings-pin-success').textContent = 'Code modifié !';
        if (oldPinKp) oldPinKp.reset();
        setTimeout(function () {
          document.getElementById('settings-pin-success').textContent = '';
        }, 2000);
      });
    });

    var prenomInput = document.getElementById('input-prenom');
    prenomInput.value = localStorage.getItem('koko-prenom') || '';
    document.getElementById('btn-save-prenom').addEventListener('click', function () {
      var val = prenomInput.value.trim();
      if (val) localStorage.setItem('koko-prenom', val);
      else     localStorage.removeItem('koko-prenom');
      document.getElementById('prenom-success').textContent = 'Enregistré !';
      setTimeout(function () { document.getElementById('prenom-success').textContent = ''; }, 2000);
    });

    document.getElementById('btn-export').addEventListener('click', function () {
      var data = {};
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.startsWith('koko')) data[key] = localStorage.getItem(key);
      }
      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href = url; a.download = 'koko-backup-' + getTodayDateString() + '.json';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    });

    document.getElementById('btn-import').addEventListener('click', function () {
      document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) { applyImport(ev.target.result); };
      reader.readAsText(file);
    });
    document.getElementById('btn-import-paste').addEventListener('click', function () {
      applyImport(document.getElementById('import-paste-area').value);
    });
  }

  document.getElementById('new-pin-group').style.display      = 'none';
  document.getElementById('settings-pin-error').textContent   = '';
  document.getElementById('settings-pin-success').textContent = '';
  if (oldPinKp) oldPinKp.reset();
  if (newPinKp) newPinKp.reset();
}

function applyImport(json) {
  var errEl = document.getElementById('import-error');
  var obj;
  try { obj = JSON.parse(json); } catch (e) { errEl.textContent = 'JSON invalide.'; return; }
  errEl.textContent = '';
  Object.keys(obj).forEach(function (key) {
    if (key.startsWith('koko')) localStorage.setItem(key, obj[key]);
  });
  renderTaskList();
  renderArchivedList();
  document.getElementById('import-paste-area').value = '';
  alert('Données importées.');
}

/* ---- Init ---- */

document.addEventListener('DOMContentLoaded', function () {
  initPinGate();
  initTabs();
  initTaskOverlay();
  initGallery();
  document.getElementById('day-overlay-back').addEventListener('click', closeDayOverlay);
});
