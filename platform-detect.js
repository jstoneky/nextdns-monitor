// Set layout class before CSS renders to avoid flash
(function() {
  var mobile  = /Android/i.test(navigator.userAgent);
  var safari  = window.location.href.startsWith('safari-web-extension://');
  document.documentElement.classList.add(mobile ? 'is-mobile' : 'is-desktop');
  if (safari) document.documentElement.classList.add('is-safari');
  document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add(mobile ? 'mobile' : 'desktop');
    if (safari) document.body.classList.add('safari');
  });
})();

// ── Theme ──────────────────────────────────────────────────────────────────────
function applyTheme(pref) {
  var preferLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  var useLightMode = (pref === 'light') || (pref === 'system' && preferLight);
  document.body.classList.toggle('light-mode', useLightMode);
}

function loadAndApplyTheme() {
  var ext = (typeof browser !== 'undefined') ? browser : chrome;
  if (!ext || !ext.storage) return;
  ext.storage.sync.get(['themePreference'], function(result) {
    applyTheme(result.themePreference || 'system');
  });
}

// Apply on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  loadAndApplyTheme();

  // Re-apply if system color scheme changes (when pref is "system")
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function() {
    var ext = (typeof browser !== 'undefined') ? browser : chrome;
    if (!ext || !ext.storage) return;
    ext.storage.sync.get(['themePreference'], function(result) {
      var pref = result.themePreference || 'system';
      if (pref === 'system') applyTheme('system');
    });
  });

  // Re-apply if storage changes (e.g. toggle clicked)
  var ext = (typeof browser !== 'undefined') ? browser : chrome;
  if (ext && ext.storage && ext.storage.onChanged) {
    ext.storage.onChanged.addListener(function(changes) {
      if (changes.themePreference) {
        applyTheme(changes.themePreference.newValue || 'system');
      }
    });
  }
});
