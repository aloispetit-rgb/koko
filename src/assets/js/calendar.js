var calendarState = { year: 0, month: 0 };

var CAL_MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function openCalendar() {
  var now = new Date();
  calendarState.year = now.getFullYear();
  calendarState.month = now.getMonth();
  renderCalendar();
  document.getElementById('calendar-overlay').style.display = 'flex';
}

function closeCalendar() {
  document.getElementById('calendar-overlay').style.display = 'none';
}

function calendarPrevMonth() {
  calendarState.month--;
  if (calendarState.month < 0) {
    calendarState.month = 11;
    calendarState.year--;
  }
  renderCalendar();
}

function calendarNextMonth() {
  calendarState.month++;
  if (calendarState.month > 11) {
    calendarState.month = 0;
    calendarState.year++;
  }
  renderCalendar();
}

function getDaySmiley(periods, dateStr) {
  var activePeriods = getActivePeriodsForDay(periods, dateStr);
  var checkable = [];
  activePeriods.forEach(function (p) {
    p.tasks.forEach(function (t) {
      if (!t.image) checkable.push(t);
    });
  });
  if (!checkable.length) return null;
  var checkins = Storage.getCheckins(dateStr);
  var done = checkable.filter(function (t) {
    return checkins[t.id] && checkins[t.id].done;
  }).length;
  return getSmiley(checkable.length, done);
}

function renderCalendar() {
  var year = calendarState.year;
  var month = calendarState.month;
  var today = getTodayDateString();
  var now = new Date();

  document.getElementById('cal-month-title').textContent =
    CAL_MONTH_NAMES[month] + ' ' + year;

  // Bloquer la navigation vers l'avenir
  var atCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  document.getElementById('cal-next-btn').disabled = atCurrentMonth;

  var grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  // En-têtes des jours
  ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(function (h) {
    var cell = document.createElement('div');
    cell.className = 'cal-header-cell';
    cell.textContent = h;
    grid.appendChild(cell);
  });

  // Cases vides avant le 1er du mois (lun = 0)
  var firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  for (var i = 0; i < firstDow; i++) {
    var pad = document.createElement('div');
    pad.className = 'cal-cell cal-cell-empty';
    grid.appendChild(pad);
  }

  // Jours du mois
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var periods = Storage.getPeriods();

  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = year + '-' +
      String(month + 1).padStart(2, '0') + '-' +
      String(d).padStart(2, '0');

    var isFuture = dateStr > today;
    var isToday = dateStr === today;

    var cell = document.createElement('div');
    cell.className = 'cal-cell' +
      (isToday ? ' cal-cell-today' : '') +
      (isFuture ? ' cal-cell-future' : '');

    var numEl = document.createElement('span');
    numEl.className = 'cal-day-num';
    numEl.textContent = d;
    cell.appendChild(numEl);

    if (!isFuture) {
      var smiley = getDaySmiley(periods, dateStr);
      if (smiley) {
        var imgEl = document.createElement('img');
        imgEl.className = 'cal-smiley';
        imgEl.src = SITE_BASE + '/assets/img/calendar/' + smiley.image + '.png';
        imgEl.alt = smiley.label;
        cell.appendChild(imgEl);
      }
    }

    grid.appendChild(cell);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('btn-calendar').addEventListener('click', openCalendar);
  document.getElementById('cal-back-btn').addEventListener('click', closeCalendar);
  document.getElementById('cal-prev-btn').addEventListener('click', calendarPrevMonth);
  document.getElementById('cal-next-btn').addEventListener('click', calendarNextMonth);
});
