function periodMatchesDay(period, dateStr) {
  var date = new Date(dateStr + 'T12:00:00');
  var dayName = getDayName(date);
  var r = period.recurrence;
  var exceptions = period.exceptions || [];

  if (period.createdAt && dateStr < period.createdAt) return false;
  if (exceptions.indexOf(dateStr) !== -1) return false;

  switch (r.type) {
    case 'always':
      return true;

    case 'weekdays':
      return r.days.indexOf(dayName) !== -1;

    case 'period':
      if (r.days.indexOf(dayName) === -1) return false;
      return dateStr >= r.from && dateStr <= r.to;

    case 'once':
      return dateStr === r.date;

    case 'dates':
      return r.dates.indexOf(dateStr) !== -1;

    case 'until_done': {
      if (dateStr < r.since) return false;
      var checkableTasks = period.tasks.filter(function (t) { return !t.image && !t.imageData; });
      var checkDate = new Date(r.since + 'T12:00:00');
      var targetDate = new Date(dateStr + 'T12:00:00');
      while (checkDate < targetDate) {
        var ds = checkDate.getFullYear() + '-' +
          String(checkDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(checkDate.getDate()).padStart(2, '0');
        var ch = Storage.getCheckins(ds);
        if (checkableTasks.length && checkableTasks.every(function (t) {
          return ch[t.id] && ch[t.id].done;
        })) {
          return false;
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }
      return true;
    }

    default:
      return false;
  }
}
