# DNS Medic — Architecture Review & Recommendations
## Version 3.2.1 | March 2026

---

## Executive Summary

DNS Medic is a well-structured browser extension with a clean provider abstraction and solid validation in the DB loading layer. The core detection pipeline works. However, there are several areas of fragility — mostly around the dual-classification system in popup.js, the `domain-db.js` shim that should be deleted, and the fact that the two manifests are hand-maintained separately. Nothing is catastrophic, but a few issues could produce subtle bugs in production that are hard to reproduce.

---

## 1. Fragility Issues

### 1.1 Classification gets mutated in popup.js (HIGH)

**File:** `popup.js` lines ~330–350

The `blocks` array received from the background is mutated directly in the render path:

```js
for (const block of blocks) {
  if (!block.classification.known && blocklistCache[block.domain]?.length) {
    block.classification = { ...block.classification, known: true, confidence: "MEDIUM" };
  }
}
for (const block of blocks) {
  if (!block.classification.known && (block.isDefiniteBlock || ...)) {
    block.classification = { ...block.classification, known: true, confidence: "MEDIUM" };
  }
}
```

**Problem:** `loadBlocks()` calls `renderBlocks(blocks)` twice — first pass renders, second pass runs after `fetchBlocklistReasons()` resolves. On the second call, the mutations from the first call are already applied to the same object references. This means the "Unverified" section can disappear between renders as blocks get promoted on the first pass, making it look like logic is working when it isn't tested against re-render.

**Fix:** Never mutate the blocks array. Create a derived `displayBlocks` computed at render time. The background data stays clean; display logic only lives in the render function.

---

### 1.2 `domain-db.js` is a zombie with duplicate `classifyDomain` (HIGH)

**File:** `domain-db.js`

There are now **two `classifyDomain` implementations**:
- `domain-db.js` exports `classifyDomain()` — compiles fresh RegExps from raw JSON on every call, no caching
- `db-loader.js` exports `classifyDomainActive()` — uses pre-compiled `_activeDB` RegExp cache, then overrides `globalThis.classifyDomain`

The `domain-db.js` version is only used during the window between when the file loads and when `db-loader.js` overrides `globalThis.classifyDomain`. During that window, every classification call recompiles the regex from scratch. On Firefox, the background scripts load sequentially and this race is predictable. On Chrome's service worker, `importScripts` order is deterministic, but the window still exists.

More critically: `domain-db.js` still exists as a 60-line file that does work nobody asked it to do anymore.

**Fix:** Delete `classifyDomain` from `domain-db.js` entirely. The file should just export `DOMAIN_DB = []` for compat and nothing else — or be deleted entirely. `db-loader.js` owns classification now.

---

### 1.3 `initDB()` fires before `classifyDomain` override is set (MEDIUM)

**File:** `db-loader.js` bottom of file

```js
globalThis.classifyDomain = classifyDomainActive;
initDB(); // async — non-blocking
```

`initDB()` is async and non-blocking. During the time it takes to hit the cache or remote fetch, `_activeDB` is `null`. `classifyDomainActive()` returns `{ known: false }` for everything. Any request that comes in during this window (which could be seconds on a cold start with remote fetch) gets classified as unknown.

This is partially acceptable — the window is short for cache hits. But for cold starts or cache misses the window can be 500ms–2s during which every block is classified as "Unknown Domain".

**Fix:** Pre-load the bundled `domain-db.json` synchronously (or near-synchronously) to seed `_activeDB` before `initDB()` runs the async cache/remote path. The bundled DB is always available immediately — use it as the starting state, then upgrade to cache/remote in the background.

---

### 1.4 `tabData` is unbounded (MEDIUM)

**File:** `background.js`

`tabData` is a `Map<tabId, {...}>` that gets cleaned up on `tabs.onRemoved`. But on Firefox with `persistent: true`, the background page lives indefinitely. If a user opens 200 tabs over a day and closes them, `onRemoved` should clean up — but if the background page is reloaded (extension update, browser restart), `tabData` is lost anyway and rebuilt from scratch.

More concerning: the `blocks` Map inside each tab entry is never pruned. A single tab that stays open for hours on a tracker-heavy site could accumulate hundreds of block records. These are held in memory indefinitely.

**Fix:** Cap `blocks` per tab at a reasonable limit (e.g. 100 unique domains). Add a note in the code. Optionally periodically prune `tabData` entries for tabs that haven't had activity in >1 hour.

---

### 1.5 Pi-hole `fetchBlocklistReasons` makes N sequential HTTP calls (MEDIUM)

**File:** `providers/pihole.js`

```js
for (const domain of domains) {
  const res = await fetch(`${url}/api/search/${encodeURIComponent(domain)}`, ...);
}
```

This is a sequential loop — each domain is fetched one at a time with `await`. On a page with 20 blocked domains, that's 20 sequential round trips to the Pi-hole API. If Pi-hole is on local network at ~5ms per call, fine. But if it's behind a VPN or slow LAN it'll be 20 × timeout = noticeable popup lag.

**Fix:** Batch with `Promise.all()` (or `Promise.allSettled()` for fault tolerance). The Pi-hole v6 API may not support bulk domain search, but parallelizing the individual requests would still be much faster.

---

### 1.6 Two manifests maintained by hand (MEDIUM)

`manifest.json` (Chrome MV3) and `manifest.firefox.json` (Firefox MV2) share ~80% of content but are entirely separate files. Every time a permission, icon path, version, or description changes it has to be done twice — and can silently drift.

The version bump today almost missed this: it had to be done in both files. Eventually they will diverge.

**Fix:** Single `manifest.base.json` with shared fields. Build script merges Chrome-specific and Firefox-specific overrides at build time. The `build.sh` already generates the packages — adding a manifest merge step is trivial. This is a maintenance win, not just cleanup.

---

### 1.7 `ERR_FAILED` is too broad (LOW-MEDIUM)

**File:** `background.js` `POSSIBLE_BLOCK_ERRORS`

`net::ERR_FAILED` is one of Chrome's most generic errors — it fires for CORS failures, mixed content blocks, CSP violations, network interruptions, and yes, sometimes DNS blocks. Treating it as a "possible block" means any failed request on any site gets flagged.

In the logs from today's testing: `images.dickssportinggoods.com ERR_FAILED` was the site's own CDN failing, not a DNS block. We tried to filter it with the eTLD1 guard and reverted because it was too aggressive.

**The real fix is** to only show `ERR_FAILED` if the domain is in the DB (known tracker/analytics domain), not for every `ERR_FAILED` on any domain. That keeps it useful (detects DNS blocks on known domains) without producing noise for generic network failures.

---

### 1.8 No rate limiting on `fetchBlocklistReasons` (LOW)

**File:** `providers/nextdns.js`

The NextDNS logs API has undocumented rate limits. The current code can loop up to 1000 log entries per page across multiple pages. Under normal conditions fine — but a user with a heavily-used NextDNS profile and many blocked domains could hit pagination heavily every time the popup opens.

**Fix:** Add a simple per-session debounce — only fetch blocklist reasons once per popup open per tab, not on every `renderBlocks` call.

---

## 2. Cleanup / Simplification

### 2.1 Delete `domain-db.js` `classifyDomain` function

Already noted in 1.2. The function is dead code — `db-loader.js` owns this. Leaving it creates confusion about which classify function is authoritative.

---

### 2.2 Consolidate the two "promotion" loops in popup.js

Currently in `renderBlocks()`:
```
// Loop 1: promote blocks confirmed by NextDNS logs
// Loop 2: promote definite/possible non-Safari blocks
// Then: split into knownBlocks / unknownBlocks
```

This is 3 passes over the same array. It should be one pass that produces a `displayBlocks` array with a computed `displayConfidence` property. Single-pass, immutable, readable.

---

### 2.3 `browser-compat.js` `browserAction` alias is one-way

The compat file does:
```js
if (!ext.action && ext.browserAction) ext.action = ext.browserAction;
if (!ext.browserAction && ext.action) ext.browserAction = ext.action;
```

The second alias (setting `browserAction` from `action`) is never needed — no code in the extension calls `ext.browserAction` directly after the alias. It's dead code and adds confusion about which API surface is canonical. Just keep the single alias that matters.

---

### 2.4 `domain-db.js` `getDB()` Node.js branch is only used in tests

```js
if (typeof require !== "undefined") {
  _db = require("./domain-db.json");
  return _db;
}
```

This is test scaffolding baked into production code. Tests should mock their own DB or use `db-loader.js` directly. This is a minor issue but it's the kind of thing that makes the file confusing to read.

---

### 2.5 `creds` object in popup.js holds Pi-hole token and NextDNS API key in memory

This is fine for a popup (short-lived), but the credentials are passed as plain objects to provider functions. If there's ever a popup memory dump or error log that captures the `creds` object, keys leak. Low risk in practice, but worth noting — the pattern to move toward is provider functions reading from `ext.storage.sync` directly rather than receiving raw credential objects from popup state.

---

## 3. Ways It Could Fail

### 3.1 Chrome service worker termination loses all `tabData`

Chrome MV3 service workers are killed after 30 seconds of inactivity. When the service worker restarts, `tabData` is empty. The badge will show stale count from before the restart, but clicking the popup will show "Nothing blocked on this page" because `tabData` is gone.

This is a **known MV3 limitation** — there's no perfect fix. But the current code doesn't attempt recovery. A minimal mitigation: persist `tabData` to `storage.local` periodically (or on each new block) and restore on service worker startup. Badge state could then be restored too.

---

### 3.2 `initDB()` failure is silent

If `initDB()` fails for any reason (cache corrupt, remote 500, bundled fetch fails), `_activeDB` stays null and `_dbMeta` is set to `{ source: "empty" }`. The popup shows "Unknown Domain" for everything. The user has no indication anything went wrong unless they open settings and notice the DB label says "empty".

**Fix:** Show a visible indicator in the popup when `dbMeta.source === "empty"` — a small warning banner in settings, or a different badge state.

---

### 3.3 `TAB_NAVIGATED` message on Firefox can close the wrong popup

`background.js` sends:
```js
ext.runtime.sendMessage({ type: "TAB_NAVIGATED", tabId: details.tabId });
```

`popup.js` listens:
```js
ext.runtime.onMessage.addListener((msg) => {
  if (msg.type === "TAB_NAVIGATED" && msg.tabId === currentTabId) window.close();
});
```

On Firefox, if two popup windows are open (e.g. detached popups or multiple windows), both listen to `runtime.onMessage`. The tabId check protects most cases, but if Firefox ever fires `onCommitted` for a tab from another window with the same tab ID (possible with multi-window), the wrong popup closes.

Low probability, but the message handler in popup.js is never cleaned up — it persists for the life of the popup even after the tab navigates.

---

### 3.4 `fetchBlocklistReasons` runs on every `renderBlocks` call

`loadBlocks()` calls `fetchBlocklistReasons(domains).then(() => renderBlocks(blocks))`. If the popup stays open and the user changes the active filter, `loadBlocks()` is called again — triggering another API round trip to NextDNS/Pi-hole for the same domains that were already fetched.

`blocklistCache` is cleared at the start of `loadBlocks()`. This means every filter toggle re-fetches blocklist reasons for all domains. On slow connections this produces visible lag.

**Fix:** Only clear `blocklistCache` on explicit "Refresh" or tab navigation, not on every `loadBlocks` call.

---

### 3.5 DB version in `domain-db.json` advances on every build

`build.sh` increments the DB version (`v2.x.x`) on every rebuild, even when no entries changed. This means users who just rebuilt for a code-only change (no DB changes) will see their cache invalidated by version mismatch on next remote fetch (if version checking is added later). Currently there's no version-based cache invalidation, so it's harmless — but it's misleading in the meta display ("DB v2.17.0 fetched today") and will cause problems if version-gated logic is ever added.

**Fix:** Only bump DB version when `db/*.yaml` content actually changes (detect via git diff or content hash).

---

## 4. Priority Matrix

| # | Issue | Severity | Effort | Recommend |
|---|-------|----------|--------|-----------|
| 1.1 | Block mutation in popup render | High | Small | Do it |
| 1.2 | Zombie classifyDomain in domain-db.js | High | Small | Do it |
| 1.3 | initDB cold-start window | Medium | Small | Do it |
| 2.6 | Manifest consolidation | Medium | Medium | Plan it |
| 3.4 | blocklistCache cleared on filter toggle | Medium | Small | Do it |
| 1.5 | Pi-hole sequential HTTP loop | Medium | Small | Do it |
| 1.4 | Unbounded tabData/blocks Map | Medium | Small | Do it |
| 3.1 | Service worker termination loses tabData | Medium | Large | Backlog |
| 1.7 | ERR_FAILED too broad | Low-Med | Medium | Plan it |
| 3.2 | Silent initDB failure | Low | Small | Do it |
| 3.5 | DB version bumps on every build | Low | Small | Do it |
| 2.2 | Consolidate promotion loops | Low | Small | Cleanup sprint |
| 1.8 | NextDNS API rate limiting | Low | Small | Backlog |

---

## 5. Recommended Next Sprint

**"Cleanup + Reliability" sprint — estimated 2–3 hours:**

1. Fix block mutation in `popup.js` — create immutable `displayBlocks` computed at render time
2. Delete `classifyDomain` from `domain-db.js`
3. Seed `_activeDB` from bundled JSON before `initDB()` runs async
4. Fix `blocklistCache` clearing — only on navigation/refresh, not filter toggle
5. Parallelize Pi-hole `fetchBlocklistReasons` with `Promise.allSettled()`
6. Cap `blocks` Map per tab at 100 entries
7. Show warning in settings when `dbMeta.source === "empty"`
8. Only bump DB version when YAML content changes

Items 3, 4, 5, and 7 will produce the most noticeable UX improvements.

---

*Generated by Sundance — arch review based on full source read of v3.2.1*
