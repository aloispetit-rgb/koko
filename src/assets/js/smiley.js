function getSmiley(totalTasks, doneTasks) {
  if (totalTasks === 0) return null;
  var percent = (doneTasks / totalTasks) * 100;
  if (percent >= 80) return { image: 'smiley-4', label: 'Super journée !'     };
  if (percent >= 60) return { image: 'smiley-3', label: 'Très bonne journée'  };
  if (percent >= 40) return { image: 'smiley-2', label: 'Bonne journée'       };
  if (percent >= 20) return { image: 'smiley-1', label: 'Peut mieux faire'    };
  return                    { image: 'smiley-0', label: 'On essaie demain !'  };
}
