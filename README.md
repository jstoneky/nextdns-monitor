# NextDNS Medic

A browser extension for **Chrome** and **Firefox** that watches your network traffic in real-time and flags requests that NextDNS may be blocking — specifically ones that could silently break website functionality.

[![Chrome](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com)
[![Firefox](https://img.shields.io/badge/Firefox-MV2-FF7139?logo=firefox&logoColor=white)](https://addons.mozilla.org)

---

## The Problem

NextDNS (and other DNS-level blockers) work great for privacy, but they can cause subtle breakage on websites. A feature flag service gets blocked, and suddenly an inventory page won't load. A session replay tool is blocked, and the site's A/B test logic fails silently. You reload the page six times wondering what's wrong, never knowing DNS was the culprit.

This extension makes that visible.

---

## How It Works

1. **Monitors network errors** on every tab using the browser's `webRequest` API
2. **Identifies DNS-block signatures** — certificate issuer failures, name resolution errors, and other patterns that indicate a DNS-level block (not a server error or timeout)
3. **Classifies every blocked domain** against a database of 346+ known services, grouped by how likely they are to break site functionality:
   - 🔴 **High** — Feature flags, authentication, payment processors, search APIs, core CDNs. These break sites.
   - 🟡 **Medium** — Tag managers, support chat, consent platforms, session replay, error monitoring. May affect functionality depending on the site.
   - 🟢 **Low** — Pure analytics and advertising. Almost never affects how a site works.
4. **Unknown domains** fall back to Medium — worth reviewing, but not necessarily critical
5. **Badge updates** on the extension icon: count of blocked domains, red = high-risk detected

---

## Popup UI

Click the extension icon on any page to see:

- **Stats bar** — counts of High / Medium / Low blocked domains
- **Grouped list** — blocked domains sorted by risk, showing service name, error type, and hit count
- **📋 Copy button** — copies the domain to clipboard; works with any DNS blocker (Pi-hole, AdGuard, etc.)
- **+ Allowlist button** — one click adds the domain to your NextDNS allowlist via the API (requires credentials)

---

## Setup

### Install

**Chrome:** Load unpacked via `chrome://extensions` → Developer mode → Load unpacked (select the folder)

**Firefox:** Load via `about:debugging` → This Firefox → Load Temporary Add-on (select the zip)

*Both will be available on their respective extension stores once reviewed.*

### Configure NextDNS credentials (optional)
Click the extension icon → ⚙️ Settings and enter:
- **NextDNS API Key** — found at [my.nextdns.io](https://my.nextdns.io) → Account → API
- **Profile ID** — the 6-character ID in your NextDNS dashboard URL

Without credentials the extension still monitors and classifies — you just won't have the one-click allowlist button. You can always use the 📋 copy button to manually add domains in your DNS blocker's dashboard.

---

## Browser Compatibility

| Browser | Manifest | Background | Status |
|---|---|---|---|
| Chrome 109+ | MV3 | Service Worker | ✅ Supported |
| Firefox 109+ | MV2 | Background Scripts | ✅ Supported |
| Edge | MV3 | Service Worker | ✅ Should work (untested) |

**Firefox note:** NextDNS blocks appear as certificate issuer errors in Firefox (e.g. "Peer's Certificate issuer is not recognized"). The extension detects these correctly, including the curly-apostrophe variant (U+2019) that Firefox uses internally.

---

## Domain Classification Database

The extension ships with a bundled database of **346+ entries** and automatically fetches updates from this repository. The database is cached locally for 7 days and can be force-refreshed from the Settings panel at any time.

### Coverage

| Category | Examples | Risk |
|---|---|---|
| Feature Flags | Statsig, LaunchDarkly, Split.io, Optimizely, PostHog, GrowthBook, ConfigCat | 🔴 High |
| Authentication | Auth0, Okta, Clerk, Kinde, Stytch, WorkOS, Firebase Auth, AWS Cognito, Azure AD | 🔴 High |
| Payment Processors | Stripe, Braintree, PayPal, Klarna, Adyen, Affirm, Afterpay, Square | 🔴 High |
| Search APIs | Algolia, Constructor.io, Searchspring, Klevu, Bloomreach, Coveo, Yext | 🔴 High |
| Core CDNs | Cloudflare, Fastly, Akamai, jsDelivr, unpkg, Google APIs, AWS | 🔴 High |
| Real-time / WebSocket | Pusher, Ably, Twilio, LiveKit, Daily.co, Agora | 🔴 High |
| Tag Managers | GTM, Tealium, Adobe Launch, Segment, mParticle | 🟡 Medium |
| Support / Chat | Intercom, Zendesk, HubSpot, Drift, Crisp, Freshchat, LiveChat | 🟡 Medium |
| Error Monitoring | Sentry, Datadog RUM, New Relic, Bugsnag, Rollbar, Raygun | 🟡 Medium |
| Session Replay | Hotjar, FullStory, LogRocket, Clarity, Mouseflow, Quantum Metric | 🟡 Medium |
| Consent Platforms | OneTrust, Cookiebot, TrustArc, Didomi, Usercentrics | 🟡 Medium |
| Analytics | Google Analytics, Mixpanel, Amplitude, Heap, Pendo, Plausible | 🟢 Low |
| Advertising | DoubleClick, Meta Pixel, LinkedIn Insight, TikTok, Criteo, AdRoll | 🟢 Low |

### Dynamic updates

The database is maintained in [`domain-db.json`](./domain-db.json) in this repo. On first load the extension fetches the latest version and caches it for 7 days. If the fetch fails for any reason, the bundled fallback is used transparently.

**Security:** The remote DB is fetched as JSON only — never eval'd or executed. Every entry is validated against a strict schema (pattern allowlist, length caps, confidence enum) before being compiled into RegExp objects. Each regex test is wrapped in try/catch for ReDoS isolation.

---

## Building

```bash
# Build both Chrome and Firefox (runs tests first)
./build.sh all

# Build for a specific browser
./build.sh chrome
./build.sh firefox

# Remove old artifacts from store/dist/
./build.sh clean
```

The build script runs the full test suite before building. If any test fails, the build is aborted. Old version artifacts are automatically cleaned from `store/dist/` before each build.

Output goes to `store/dist/`.

---

## Testing

```bash
# Run all tests
npm test

# Run specific suites
npm run test:domain   # Domain classification (89 tests)
npm run test:errors   # Error string detection (24 tests)
npm run test:build    # Build artifact validation (41 tests)
```

No dependencies — uses Node's built-in `node:test` runner. Tests cover:
- Domain classification accuracy across all 13 categories
- Chrome and Firefox error string matching (including curly-apostrophe edge case)
- False-positive rejection (NS_BINDING_ABORTED, ERR_TIMED_OUT, etc.)
- `extractHostname()` edge cases
- Manifest schema validation (MV3 and MV2)
- Build artifact existence and size

---

## Privacy

This extension:
- **Does not collect or transmit any personal data**
- **Does not store browsing history** — all data is session-only and cleared on navigation
- **Only stores hostnames**, never full URLs or page content
- **Fetches domain-db.json** from GitHub on first load and every 7 days (no user data sent)
- Your NextDNS API key is stored locally in browser sync storage

Full privacy policy: [store/PRIVACY.md](./store/PRIVACY.md)

---

## Tech Stack

- Browser Extension (Chrome MV3 / Firefox MV2)
- Vanilla JS — no build step, no framework dependencies
- `webRequest.onErrorOccurred` — request error monitoring
- `webNavigation.onCommitted` — tab lifecycle management
- `storage.local` — DB caching
- `storage.sync` — settings sync across devices
- `navigator.clipboard` — copy to clipboard
- NextDNS REST API — allowlist management
- `browser-compat.js` — cross-browser API shim (`chrome.*` ↔ `browser.*`)
- `db-loader.js` — remote DB fetch, validation, and cache management

---

## Store Assets

```
store/
├── PRIVACY.md              # Shared privacy policy
├── chrome/
│   ├── LISTING.md          # Chrome Web Store listing copy
│   ├── icon-128-store.png  # 128×128 store icon
│   ├── promo-tile-440x280.jpg
│   ├── marquee-1400x560.jpg
│   └── screenshots/        # 1280×800 PNG (5 screenshots)
└── firefox/
    ├── LISTING.md          # Firefox Add-ons listing copy
    └── screenshots/        # Same screenshots, Firefox-compatible
```

---

## Contributing

PRs welcome. Most useful contributions:

- **New entries in `domain-db.json`** — add real hostnames with correct confidence and category
- **Confidence corrections** — if a domain is miscategorized, open a PR with justification
- **New categories** — e.g. A/B testing tools, e-commerce platforms, video infrastructure
- **Edge / Safari port**
- **Automated integration tests**

When adding entries to `domain-db.json`, match the schema:
```json
{ "pattern": "exact\\.domain\\.com", "flags": "", "label": "Category (Service Name)", "confidence": "HIGH", "category": "feature-flags" }
```

Run `npm test` before submitting — the test suite validates every entry and will catch malformed patterns or invalid confidence values.

---

## License

MIT
