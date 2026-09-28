// Applied before first paint so a saved theme never flashes the default one.
(function () {
  try {
    var prefs = JSON.parse(localStorage.getItem('secure-notes-appearance') || '{}');
    if (prefs.mode === 'light' || prefs.mode === 'dark') document.documentElement.dataset.theme = prefs.mode;
    if (prefs.accent) document.documentElement.dataset.accent = prefs.accent;
  } catch (e) {}
})();
