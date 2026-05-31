var CAL_MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/* ---- Smiley du jour (nouveau modèle) ---- */

function getDaySmiley(dateStr) {
  var tasks     = Storage.getTasks();
  var instances = [];
  tasks.forEach(function (task) {
    instances = instances.concat(getTaskInstancesForDay(task, dateStr));
  });
  if (!instances.length) return null;
  var completions = Storage.getCompletions(dateStr);
  var done = instances.filter(function (inst) {
    return !!completions[inst.taskId + ':' + inst.scheduleIndex];
  }).length;
  return getSmiley(instances.length, done);
}

/* ---- Rendu d'une grille calendrier (partagé enfant + parent) ---- */

function renderCalendarGrid(gridEl, titleEl, nextBtn, state, onDayClick) {
  var year  = state.year;
  var month = state.month;
  var today = getTodayDateString();
  var now   = new Date();

  if (titleEl) titleEl.textContent = CAL_MONTH_NAMES[month] + ' ' + year;
  if (nextBtn)  nextBtn.disabled   = (year === now.getFullYear() && month === now.getMonth());

  gridEl.innerHTML = '';

  ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(function (h) {
    var cell = document.createElement('div');
    cell.className  = 'cal-header-cell';
    cell.textContent = h;
    gridEl.appendChild(cell);
  });

  var firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  for (var i = 0; i < firstDow; i++) {
    var pad = document.createElement('div');
    pad.className = 'cal-cell cal-cell-empty';
    gridEl.appendChild(pad);
  }

  var daysInMonth = new Date(year, month + 1, 0).getDate();
  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = year + '-' +
      String(month + 1).padStart(2, '0') + '-' +
      String(d).padStart(2, '0');

    var isFuture = dateStr > today;
    var isToday  = dateStr === today;

    var cell = document.createElement('div');
    cell.className = 'cal-cell' +
      (isToday  ? ' cal-cell-today'  : '') +
      (isFuture ? ' cal-cell-future' : '');

    var numEl = document.createElement('span');
    numEl.className   = 'cal-day-num';
    numEl.textContent = d;
    cell.appendChild(numEl);

    if (!isFuture) {
      var smiley = getDaySmiley(dateStr);
      if (smiley) {
        var imgEl   = document.createElement('img');
        imgEl.className = 'cal-smiley';
        imgEl.src   = SITE_BASE + '/assets/img/calendar/' + smiley.image + '.png';
        imgEl.alt   = smiley.label;
        cell.appendChild(imgEl);
      }
      if (typeof onDayClick === 'function') {
        (function (ds) {
          cell.addEventListener('click', function () { onDayClick(ds); });
        })(dateStr);
      }
    }

    gridEl.appendChild(cell);
  }
}

/* ---- Calendrier vue enfant (index.njk) ---- */

var childCalState = { year: 0, month: 0 };

function openCalendar() {
  var now = new Date();
  childCalState.year  = now.getFullYear();
  childCalState.month = now.getMonth();
  renderChildCalendar();
  var overlay = document.getElementById('calendar-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function closeCalendar() {
  var overlay = document.getElementById('calendar-overlay');
  if (overlay) overlay.style.display = 'none';
}

function renderChildCalendar() {
  var grid    = document.getElementById('calendar-grid');
  var title   = document.getElementById('cal-month-title');
  var nextBtn = document.getElementById('cal-next-btn');
  if (!grid) return;
  renderCalendarGrid(grid, title, nextBtn, childCalState, null);
}

document.addEventListener('DOMContentLoaded', function () {
  var btnCal = document.getElementById('btn-calendar');
  if (btnCal) btnCal.addEventListener('click', openCalendar);

  var backBtn = document.getElementById('cal-back-btn');
  if (backBtn) backBtn.addEventListener('click', closeCalendar);

  var prevBtn = document.getElementById('cal-prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      childCalState.month--;
      if (childCalState.month < 0) { childCalState.month = 11; childCalState.year--; }
      renderChildCalendar();
    });
  }

  var nextBtn2 = document.getElementById('cal-next-btn');
  if (nextBtn2) {
    nextBtn2.addEventListener('click', function () {
      var n = new Date();
      if (childCalState.year === n.getFullYear() && childCalState.month === n.getMonth()) return;
      childCalState.month++;
      if (childCalState.month > 11) { childCalState.month = 0; childCalState.year++; }
      renderChildCalendar();
    });
  }
});
