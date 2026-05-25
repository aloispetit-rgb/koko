var Storage = (function () {
  function getPeriods() {
    try {
      return JSON.parse(localStorage.getItem('koko-periods')) || [];
    } catch (e) {
      return [];
    }
  }

  function savePeriods(periods) {
    try {
      localStorage.setItem('koko-periods', JSON.stringify(periods));
    } catch (e) {
      console.error('[Storage] savePeriods échoué :', e.name, e.message);
      alert('Erreur : impossible de sauvegarder (stockage plein ?). ' + e.message);
    }
  }

  function getCheckins(dateStr) {
    try {
      return JSON.parse(localStorage.getItem('koko-checkins-' + dateStr)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveCheckins(dateStr, checkins) {
    localStorage.setItem('koko-checkins-' + dateStr, JSON.stringify(checkins));
  }

  function toggleTask(dateStr, taskId) {
    var checkins = getCheckins(dateStr);
    if (checkins[taskId] && checkins[taskId].done) {
      delete checkins[taskId];
    } else {
      checkins[taskId] = { done: true, doneAt: new Date().toISOString() };
    }
    saveCheckins(dateStr, checkins);
    return checkins;
  }

  return { getPeriods: getPeriods, savePeriods: savePeriods, getCheckins: getCheckins, saveCheckins: saveCheckins, toggleTask: toggleTask };
})();
