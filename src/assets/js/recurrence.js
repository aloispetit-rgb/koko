(function () {
  var DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  function parseDate(dateStr) {
    return new Date(dateStr + 'T12:00:00');
  }

  function daysBetween(fromStr, toStr) {
    return Math.round((parseDate(toStr) - parseDate(fromStr)) / 86400000);
  }

  function mondayOf(dateStr) {
    var d = parseDate(dateStr);
    var dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function monthsBetween(fromStr, toStr) {
    var f = parseDate(fromStr);
    var t = parseDate(toStr);
    return (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth());
  }

  function matchesRecurrence(rec, anchorDate, dateStr) {
    var every = rec.every || 1;
    var unit  = rec.unit  || 'days';
    if (every <= 0) return false;

    switch (unit) {
      case 'days': {
        var diff = daysBetween(anchorDate, dateStr);
        return diff >= 0 && diff % every === 0;
      }
      case 'weeks': {
        var dayName = DAYS_FR[parseDate(dateStr).getDay()];
        if ((rec.days || []).indexOf(dayName) === -1) return false;
        var wDiff = daysBetween(mondayOf(anchorDate), mondayOf(dateStr));
        return wDiff >= 0 && (wDiff / 7) % every === 0;
      }
      case 'months': {
        var dateObj   = parseDate(dateStr);
        var anchorObj = parseDate(anchorDate);
        var targetDay = rec.dayOfMonth || anchorObj.getDate();
        if (dateObj.getDate() !== targetDay) return false;
        var mDiff = monthsBetween(anchorDate, dateStr);
        return mDiff >= 0 && mDiff % every === 0;
      }
      case 'years': {
        var dY = parseDate(dateStr);
        var cY = parseDate(anchorDate);
        if (dY.getMonth() !== cY.getMonth() || dY.getDate() !== cY.getDate()) return false;
        var yDiff = dY.getFullYear() - cY.getFullYear();
        return yDiff >= 0 && yDiff % every === 0;
      }
      default:
        return false;
    }
  }

  // Compte les jours correspondant à la récurrence entre fromDate et toDate inclus,
  // sans appliquer la condition de fin (évite la circularité pour le décompte occurrences).
  function countMatchingDays(task, fromDate, toDate) {
    var count      = 0;
    var cur        = parseDate(fromDate);
    var endDate    = parseDate(toDate);
    var rec        = task.recurrence || {};
    var exceptions = task.exceptions || [];

    while (cur <= endDate) {
      var ds = cur.getFullYear() + '-' +
               String(cur.getMonth() + 1).padStart(2, '0') + '-' +
               String(cur.getDate()).padStart(2, '0');
      if (exceptions.indexOf(ds) === -1 && matchesRecurrence(rec, fromDate, ds)) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  window.taskMatchesDay = function (task, dateStr) {
    // 1. Supprimée
    if (task.deletedAt) return false;

    // 2. Tâche à complétion déjà cochée
    var rec = task.recurrence || {};
    if (rec.untilCompletion && task.completedAt) return false;

    // 3. Date exclue explicitement
    if ((task.exceptions || []).indexOf(dateStr) !== -1) return false;

    // Pas encore créée
    var createdDate = (task.createdAt || '').slice(0, 10) || dateStr;
    if (dateStr < createdDate) return false;

    // 4. Récurrence
    if (!matchesRecurrence(rec, createdDate, dateStr)) return false;

    // 5. Condition de fin
    var end = task.end || { type: 'never' };
    if (end.type === 'date') {
      if (end.date && dateStr > end.date) return false;
    } else if (end.type === 'occurrences' && end.occurrences) {
      if (countMatchingDays(task, createdDate, dateStr) > end.occurrences) return false;
    }

    return true;
  };
})();
