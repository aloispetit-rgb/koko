function getActivePeriodsForDay(periods, dateStr) {
  return periods
    .filter(function (p) { return periodMatchesDay(p, dateStr); })
    .sort(function (a, b) {
      return toMinutes(a.startHour, a.startMinute) - toMinutes(b.startHour, b.startMinute);
    });
}
