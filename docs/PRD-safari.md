# PRD: DNS Medic — Safari Support

**Status:** Draft  
**Author:** Sundance / Jeff  
**Date:** 2026-03-28  
**Version:** 1.0

---

## Overview

DNS Medic currently ships for Chrome (MV3) and Firefox / Firefox for Android (MV2). This PRD defines what it takes to bring DNS Medic to **Safari on macOS** and **Safari on iOS/iPadOS**.

Safari is structurally different from Chrome and Firefox in ways that require meaningful engineering decisions — not just a manifest tweak. The central challenge is that Safari's handling of the `webRequest` API (the heart of DNS Medic's detection engine) is restricted in ways that require a deliberate architectural choice before any other work begins.

---

## Goals

- Ship DNS Medic as a Safari Web Extension available on the Mac App Store and iOS App Store
- Preserve core functionality: DNS block detection, domain classification, popup UI, one-click allowlist
- Maintain a single shared JS codebase where possible (no Safari-only forks of business logic)
- Support macOS first; iOS as a fast-follow once macOS is stable

---

## Non-Goals

- Safari App Extensions (the older Obj-C/Swift model) — we're targeting Safari Web Extensions only
- Rewriting the extension in Swift or native code
- Supporting Safari versions below 15.4

---

## The Core Problem: `webRequest` in Safari

DNS Medic's detection engine is built on `webRequest.onErrorOccurred`. This API fires when a network request fails, and we inspect the error string to identify DNS-block signatures (e.g. `net::ERR_NAME_NOT_RESOLVED`, `NS_ERROR_UNKNOWN_HOST`, certificate issuer errors from NextDNS block pages).

**Safari's constraint:** `webRequest` is only available in Safari with **MV2 + `"persistent": true`** background pages. This is the same model Firefox MV2 uses, but with an important additional requirement: Safari enforces the `persistent` flag strictly, whereas Firefox doesn't require it.

**What this means practically:**

| Scenario | Status |
|---|---|
| MV3 + Service Worker | ❌ `webRequest` not available in Safari MV3 |
| MV2 + `"persistent": false` | ❌ Safari rejects this at install |
| MV2 + `"persistent": true` | ✅ `webRequest` works on macOS |
| iOS (any manifest version) | ❌ Persistent background pages not supported on iOS — `webRequest` unavailable |

**Consequence:** macOS Safari and iOS Safari require different detection strategies. This is the single biggest architectural decision in the project.

---

## Architecture Decision: Two Approaches

### Option A — MV2 Persistent (macOS only)

Use Safari MV2 with `"persistent": true` background page. This is the most direct path and preserves the existing `webRequest.onErrorOccurred` detection logic almost unchanged.

**Pros:**
- Minimal code change — reuse `background.js` with minor Safari guards
- Detection accuracy identical to Firefox MV2 build
- Ships faster

**Cons:**
- macOS only — iOS gets nothing
- Persistent background pages consume more memory (always-on process)
- Apple may flag this in review (persistent backgrounds draw scrutiny)
- May become unsupported if Apple deprecates MV2 in a future Safari version

**Verdict:** Best path for macOS v1. Acceptable tradeoff given iOS constraints.

---

### Option B — Content Script Fallback (macOS + iOS)

Use a content script that runs on every page and monitors `window.onerror`, resource timing entries (`PerformanceResourceTiming`), and failed `fetch()`/`XMLHttpRequest` calls from within the page context to infer DNS blocks.

**Pros:**
- Works on iOS (no persistent background required)
- Works with MV3 (future-proof)
- One manifest covers both platforms

**Cons:**
- Much lower detection fidelity — we can only see resource loads that the page itself initiates, not all browser-level requests
- Can't catch errors from cross-origin sub-resource loads that don't surface to JS
- False negative rate is significantly higher — DNS blocks that happen silently (the resource just fails to load without a JS-visible error) are invisible
- Implementation complexity is high

**Verdict:** Valid for iOS where we have no choice. Not the right approach for macOS where Option A works.

---

### Recommended Architecture: Hybrid

| Platform | Manifest | Background | Detection |
|---|---|---|---|
| macOS Safari | MV2 | Persistent background | `webRequest.onErrorOccurred` (same as Firefox) |
| iOS Safari | MV2 | Non-persistent | Content script heuristics (degraded mode) |

Ship macOS first with full parity. Ship iOS as a "lite" version with a degraded-mode indicator in the UI — honest about the limitation.

---

## Platform Requirements

### Apple Developer Program
- **Required:** $99/year Apple Developer membership
- Safari extensions must ship as part of a native macOS/iOS app wrapper
- The extension itself is JS/HTML, but it must be wrapped in an Xcode project and submitted to the App Store as a native app
- Xcode 16+ required (enforced by App Store Connect as of April 2025)

### Xcode Project
- Apple provides `safari-web-extension-converter` CLI tool that converts an existing Chrome/Firefox extension into an Xcode project scaffold
- Command: `xcrun safari-web-extension-converter --bundle-identifier com.jstoneky.dnsmedic ./` 
- This generates a Swift wrapper app (minimal — essentially just a launch screen and settings toggle) with the extension embedded
- The Swift wrapper does not need custom logic for v1, but Apple requires it have some UI (a settings/help screen is sufficient)

### Manifest (`manifest.safari.json`)
New Safari-specific manifest required alongside existing `manifest.json` and `manifest.firefox.json`:

```json
{
  "manifest_version": 2,
  "name": "DNS Medic",
  "background": {
    "scripts": ["browser-compat.js", "db-loader.js", "domain-db.js", "background.js"],
    "persistent": true
  },
  "permissions": [
    "webRequest",
    "webNavigation",
    "storage",
    "tabs",
    "clipboardWrite",
    "<all_urls>"
  ]
}
```

Key differences from Firefox manifest:
- `"persistent": true` is **required** (not optional)
- No `data_collection_permissions` key (Safari doesn't support it — would cause install failure)
- No `browser_specific_settings` / gecko block
- Icons must be referenced with explicit sizes Safari supports (16, 32, 48, 96, 128)

---

## Code Changes Required

### 1. `browser-compat.js`
Currently shims `chrome.*` ↔ `browser.*`. Safari uses `browser.*` natively but has gaps. Additions needed:
- Guard `browser.action` vs `browser.browserAction` (Safari varies by version)
- Guard `navigator.clipboard` — Safari requires explicit user gesture; our copy button should be fine but needs testing
- Add `isSafari` detection flag

### 2. `background.js`
The main detection loop uses `webRequest.onErrorOccurred` — this should work as-is under MV2 persistent. Likely changes:
- Safari error strings for DNS blocks differ slightly from Chrome and Firefox
  - Known Safari DNS error: `"Frame load interrupted"` and `"A server with the specified hostname could not be found"` (the CFNetwork error message)
  - These need to be added to `NEXTDNS_ERRORS` / detection logic
  - **Research required:** Capture actual Safari error strings by testing against a known-blocked domain on NextDNS

### 3. `platform-detect.js` (new or extend existing)
Add Safari detection:
```js
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
```
Used to conditionally suppress features not available in Safari (e.g. `data_collection_permissions` UI references).

### 4. `popup.js` / `popup.html`
- Safari's popup dimensions and behavior differ slightly — test and adjust
- Safari does not support `window.close()` from popups in the same way; may need Safari-specific close handling
- Remove or guard any UI that references Firefox-only or Chrome-only features

### 5. Error String Research (Critical Path)
Before writing any Safari-specific detection code, we need to capture the actual error strings Safari surfaces for DNS-blocked requests. Testing approach:
1. Set up a NextDNS profile that blocks a known test domain
2. Load the domain in Safari with the extension active and `webRequest.onErrorOccurred` logging to console
3. Capture and document the `error` field values
4. Add them to the error detection array in `background.js`

This is blocking — without real Safari error strings, the detector will silently miss DNS blocks.

### 6. `build.sh`
Add a `safari` build target:
```bash
./build.sh safari   # Produces store/dist/dns-medic-safari-vX.X.X.zip
```
The output is the raw extension source (for the Xcode import step). The actual `.app` bundle is produced by Xcode, not the shell script.

### 7. iOS Degraded Mode (Phase 2)
If iOS support is pursued:
- Detect non-persistent context at runtime
- Show a "Limited detection on iOS" banner in the popup
- Implement content script resource timing monitor as a best-effort fallback
- This is a separate phase and should not block macOS launch

---

## Testing Plan

### Unit Tests
- Add Safari error string variants to `tests/errors.test.js`
- Add Safari manifest validation to `tests/build.test.js` (validate `manifest.safari.json` schema)

### Manual Testing (macOS)
- Load extension via Xcode → Run in Safari Simulator or direct Safari install
- Enable Developer menu in Safari → Web Extension Background Page console available
- Test against NextDNS, Pi-hole, and Control D blocks
- Verify popup renders correctly in Safari's extension popover
- Verify one-click allowlist (all three providers) works in Safari

### Manual Testing (iOS) — Phase 2
- Use Simulator first (faster iteration)
- Verify degraded mode banner appears correctly
- Verify read-only classification still works (DB loads, domains shown even if detection is limited)

---

## Distribution

### Mac App Store
- Must be submitted as a macOS app containing the extension
- App requires: name, description, screenshots (macOS format), privacy policy URL, support URL
- Extension enable/disable toggle happens in Safari Preferences → Extensions — the native app just needs to tell users this
- Review time: typically 1–3 business days for extensions; can be faster

### iOS App Store
- Same app, universal build (macOS + iOS in one submission, or separate)
- iOS version in degraded mode — must clearly disclose limited functionality in App Store description
- Phase 2 — do not submit until iOS detection story is stronger

### Pricing
- Free (matches Chrome and Firefox distribution)
- No in-app purchases for v1

---

## Build.sh Update (proposed target structure)

```
store/dist/
├── dns-medic-chrome-v3.x.x.zip
├── dns-medic-firefox-v3.x.x.zip
├── dns-medic-firefox-v3.x.x.xpi
└── dns-medic-safari-v3.x.x.zip   ← new (raw source for Xcode import)
```

The Xcode project lives at `platforms/safari/` (generated once, then maintained):
```
platforms/
└── safari/
    ├── DNSMedic.xcodeproj
    ├── DNSMedic/              ← Swift wrapper app (minimal)
    └── DNSMedic Extension/   ← auto-linked to root extension source
```

---

## Risks & Open Questions

| Risk | Severity | Notes |
|---|---|---|
| Safari error strings unknown | 🔴 High | Blocks detection accuracy. Must research first. |
| Apple App Review rejection | 🟡 Medium | Persistent background pages draw scrutiny. Mitigate with clear privacy policy and minimal permissions. |
| MV2 deprecation in Safari | 🟡 Medium | No announced timeline, but watch Apple WWDC announcements. If Safari drops MV2, we need Option B for macOS too. |
| iOS detection fidelity | 🟡 Medium | Content script approach is best-effort. Be honest in UI and App Store listing. |
| Xcode maintenance burden | 🟢 Low | The Swift wrapper is minimal; main burden is rebuilding/signing for each release. Can be scripted. |
| `data_collection_permissions` manifest key | 🟢 Low | Already known — just omit from `manifest.safari.json`. |

---

## Phased Delivery

### Phase 1 — macOS Safari (target: Q2 2026)
1. Research Safari DNS error strings (1–2 days, needs a Mac with Safari + NextDNS)
2. Create `manifest.safari.json`
3. Update `browser-compat.js` with Safari guards
4. Add Safari error strings to detection logic
5. Run `safari-web-extension-converter` to generate Xcode project
6. Build and test locally in Safari
7. Add Safari manifest validation to test suite
8. Update `build.sh` with `safari` target
9. Submit to Mac App Store
10. Update README with Safari compat row

### Phase 2 — iOS Safari (target: Q3 2026)
1. Implement content script resource timing monitor
2. Add degraded mode UI to popup
3. Test in iOS Simulator
4. Submit universal app update to App Store

---

## Success Criteria

- DNS Medic installs and runs in Safari on macOS without errors
- `webRequest.onErrorOccurred` fires correctly and DNS blocks are detected with accuracy comparable to Firefox
- One-click allowlist works for at least NextDNS (Pi-hole and Control D to be verified)
- Extension passes App Store review on first or second submission
- All existing tests pass; Safari-specific tests added and green
