// browser-compat.js
// Normalizes chrome.* vs browser.* across Chrome and Firefox.
// Load this before any other extension scripts.
// eslint-disable-next-line no-var
var ext = (function () {
  if (typeof browser !== "undefined" && browser.runtime) return browser;
  if (typeof chrome !== "undefined" && chrome.runtime) return chrome;
  throw new Error("No WebExtension API found");
})();
