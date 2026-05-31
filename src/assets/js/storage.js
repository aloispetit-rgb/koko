var Storage = (function () {
  var TASKS_KEY = 'koko:tasks';
  var PIN_KEY   = 'koko-pin';

  function completionsKey(dateStr) {
    return 'koko:completions:' + dateStr;
  }

  /* ---- Tâches ---- */

  function getTasks() {
    try {
      return JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      alert('Erreur : impossible de sauvegarder (stockage plein ?). ' + e.message);
    }
  }

  function getActiveTasks() {
    return getTasks().filter(function (t) {
      if (t.deletedAt) return false;
      var untilCompletion = !!(t.recurrence && t.recurrence.untilCompletion);
      return !t.completedAt || !untilCompletion;
    });
  }

  function getArchivedTasks() {
    return getTasks().filter(function (t) { return !!t.deletedAt; });
  }

  function addTask(task) {
    var tasks = getTasks();
    tasks.push(task);
    saveTasks(tasks);
  }

  function updateTask(id, changes) {
    var tasks = getTasks();
    var idx = tasks.findIndex(function (t) { return t.id === id; });
    if (idx === -1) return;
    Object.assign(tasks[idx], changes);
    saveTasks(tasks);
  }

  function softDeleteTask(id) {
    updateTask(id, { deletedAt: new Date().toISOString() });
  }

  function restoreTask(id) {
    updateTask(id, { deletedAt: null, completedAt: null });
  }

  function hardDeleteTask(id) {
    saveTasks(getTasks().filter(function (t) { return t.id !== id; }));
  }

  /* ---- Cochages ---- */

  function getCompletions(dateStr) {
    try {
      return JSON.parse(localStorage.getItem(completionsKey(dateStr))) || {};
    } catch (e) {
      return {};
    }
  }

  function saveCompletions(dateStr, obj) {
    localStorage.setItem(completionsKey(dateStr), JSON.stringify(obj));
  }

  function toggleCompletion(dateStr, taskId, scheduleIndex) {
    var obj = getCompletions(dateStr);
    var key = taskId + ':' + scheduleIndex;
    if (obj[key]) {
      delete obj[key];
    } else {
      obj[key] = true;
    }
    saveCompletions(dateStr, obj);
    return !!obj[key];
  }

  /* ---- PIN ---- */

  function getPin()       { return localStorage.getItem(PIN_KEY) || null; }
  function savePin(hash)  { localStorage.setItem(PIN_KEY, hash); }

  /* ---- Galerie ---- */

  var GALLERY_KEY = 'koko:gallery';

  function _galleryUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function getGallery() {
    try { return JSON.parse(localStorage.getItem(GALLERY_KEY)) || []; } catch (e) { return []; }
  }

  function saveGallery(gallery) {
    try { localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery)); }
    catch (e) { alert('Erreur : stockage plein ? ' + e.message); }
  }

  function addToGallery(name, data) {
    var gallery = getGallery();
    var entry   = { id: _galleryUuid(), name: name || '', data: data };
    gallery.push(entry);
    saveGallery(gallery);
    return entry;
  }

  function removeFromGallery(id) {
    saveGallery(getGallery().filter(function (g) { return g.id !== id; }));
    var tasks   = getTasks();
    var changed = false;
    tasks.forEach(function (t) { if (t.image === id) { t.image = null; changed = true; } });
    if (changed) saveTasks(tasks);
  }

  return {
    getTasks:         getTasks,
    saveTasks:        saveTasks,
    getActiveTasks:   getActiveTasks,
    getArchivedTasks: getArchivedTasks,
    addTask:          addTask,
    updateTask:       updateTask,
    softDeleteTask:   softDeleteTask,
    restoreTask:      restoreTask,
    hardDeleteTask:   hardDeleteTask,
    getCompletions:   getCompletions,
    saveCompletions:  saveCompletions,
    toggleCompletion: toggleCompletion,
    getPin:           getPin,
    savePin:          savePin,
    getGallery:        getGallery,
    addToGallery:      addToGallery,
    removeFromGallery: removeFromGallery,
  };
})();
