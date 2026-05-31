var SCHEDULE_RANGES = {
  'matin':      { startMinutes: 360,  endMinutes: 719,  label: 'Matin' },
  'matinée':    { startMinutes: 540,  endMinutes: 779,  label: 'Matinée' },
  'midi':       { startMinutes: 720,  endMinutes: 839,  label: 'Midi' },
  'après-midi': { startMinutes: 840,  endMinutes: 1019, label: 'Après-midi' },
  'goûter':     { startMinutes: 960,  endMinutes: 1079, label: 'Goûter' },
  'soir':       { startMinutes: 1080, endMinutes: 1259, label: 'Soir' },
  // nuit : startMinutes > endMinutes — chevauche minuit
  'nuit':       { startMinutes: 1260, endMinutes: 359,  label: 'Nuit' },
};

function getScheduleRange(schedule) {
  if (schedule.type === 'period') {
    var r = SCHEDULE_RANGES[schedule.value];
    if (!r) return null;
    return { startMinutes: r.startMinutes, endMinutes: r.endMinutes, label: r.label };
  }
  if (schedule.type === 'time') {
    var parts = schedule.value.split(':');
    var center = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    return { startMinutes: center - 30, endMinutes: center + 30, label: schedule.value };
  }
  return null;
}

function getTaskInstancesForDay(task, dateStr) {
  if (task.deletedAt) return [];
  if (task.recurrence && task.recurrence.untilCompletion && task.completedAt) return [];
  if ((task.exceptions || []).indexOf(dateStr) !== -1) return [];
  if (typeof window.taskMatchesDay === 'function' && !window.taskMatchesDay(task, dateStr)) return [];

  var instances = [];
  (task.schedules || []).forEach(function (schedule, i) {
    var range = getScheduleRange(schedule);
    if (!range) return;
    instances.push({
      taskId:        task.id,
      scheduleIndex: i,
      label:         task.label,
      emoji:         task.emoji  || null,
      image:         task.image  || null,
      startMinutes:  range.startMinutes,
      endMinutes:    range.endMinutes,
      scheduleLabel: range.label,
    });
  });
  return instances;
}
