// Set layout class before CSS renders to avoid flash
(function() {
  var mobile = /Android/i.test(navigator.userAgent);
  var safari = typeof chrome === 'undefined' && typeof browser !== 'undefined'
    ? (browser.runtime && browser.runtime.getURL('').startsWith('safari-web-extension://'))
    : false;
  document.documentElement.classList.add(mobile ? 'is-mobile' : 'is-desktop');
  if (safari) document.documentElement.classList.add('is-safari');
  document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add(mobile ? 'mobile' : 'desktop');
    if (safari) document.body.classList.add('safari');
  });
})();
