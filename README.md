# NextDNS Traffic Monitor

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
2. **Identifies DNS-block signatures** — errors like certificate issuer failures and name resolution errors that indicate a DNS-level block (as opposed to a server error or network timeout)
3. **Classifies every blocked domain** against a curated database of 60+ known services, categorized by how likely they are to affect site functionality:
   - 🔴 **High** — Feature flags, A/B testing, authentication, search APIs, payment processors, core CDNs. These break sites.
   - 🟡 **Medium** — Tag managers, chat widgets, consent platforms, session replay, error monitoring. May affect functionality depending on the site.
   - 🟢 **Low** — Pure analytics and advertising. Almost never affects how a site works.
4. **Unknown domains** are flagged as Medium by default — worth a look, but not necessarily critical
5. **Badge updates** on the extension icon showing count of blocked domains (red badge = high-risk issues detected)

---

## Popup UI

Click the extension icon on any page to see:

- **Stats bar** — counts of High / Medium / Low blocked domains
- **Grouped list** — blocked domains sorted by risk, with the service name (e.g. "Feature Flags (Statsig)"), the error type, and how many times it was hit
- **+ Allowlist button** — one click adds the domain to your NextDNS allowlist via the NextDNS API

---

## Setup

### Install

**Chrome:** Load unpacked via `chrome://extensions` → Developer mode → Load unpacked (folder)

**Firefox:** Load via `about:debugging` → This Firefox → Load Temporary Add-on (zip)

*Both will be available on their respective extension stores once reviewed.*

### Configure NextDNS credentials
Click the extension icon → ⚙️ Settings and enter:
- **NextDNS API Key** — found at [my.nextdns.io](https://my.nextdns.io) → Settings → API
- **Profile ID** — the 6-character ID shown in your NextDNS dashboard

Without credentials, the extension still monitors and classifies — you just won't have the one-click allowlist feature.

---

## Browser Compatibility

| Browser | Manifest | Background | Status |
|---|---|---|---|
| Chrome 109+ | MV3 | Service Worker | ✅ Supported |
| Firefox 109+ | MV2 | Background Scripts | ✅ Supported |
| Edge | MV3 | Service Worker | ✅ Should work (untested) |

**Note for Firefox users:** NextDNS blocks show as certificate issuer errors in Firefox (e.g. "Certificate issuer is not recognized"). The extension detects these correctly alongside standard DNS error codes.

---

## Domain Classification Database

The extension ships with a categorized database covering:

| Category | Examples | Risk Level |
|---|---|---|
| Feature Flags | Statsig, LaunchDarkly, Split.io, Optimizely | 🔴 High |
| Authentication | Auth0, Okta, AWS Cognito, Google Sign-In | 🔴 High |
| Search APIs | Algolia, SearchSpring, Klevu | 🔴 High |
| Payment Processors | Stripe, Braintree, PayPal | 🔴 High |
| Core CDNs | Cloudflare, Fastly, Akamai, AWS | 🔴 High |
| Real-time APIs | Pusher, Ably, Twilio | 🔴 High |
| Tag Managers | Google Tag Manager, Tealium, Segment | 🟡 Medium |
| Support Chat | Intercom, Zendesk, Drift | 🟡 Medium |
| Error Monitoring | Sentry, Datadog, New Relic | 🟡 Medium |
| Session Replay | Hotjar, FullStory, LogRocket | 🟡 Medium |
| Consent Platforms | OneTrust, Cookiebot | 🟡 Medium |
| Analytics | Google Analytics, Mixpanel, Amplitude | 🟢 Low |
| Advertising | DoubleClick, Facebook Pixel, LinkedIn Ads | 🟢 Low |

---

## Building

```bash
# Build both Chrome and Firefox zips
./build.sh all

# Build for a specific browser
./build.sh chrome
./build.sh firefox
```

Output goes to `store/dist/`.

---

## Privacy

This extension:
- **Does not send any data externally** (except direct calls to the NextDNS API when you click Allowlist)
- **Does not store browsing history** — all data is session-only and cleared on page navigation
- **Does not collect or transmit URLs** — only hostnames are stored, and only in local extension memory
- Your NextDNS API key is stored locally in browser sync storage

Full privacy policy: [store/PRIVACY.md](./store/PRIVACY.md)

---

## Tech Stack

- Browser Extension (Chrome MV3 / Firefox MV2)
- Vanilla JS — no build step, no dependencies
- `webRequest.onErrorOccurred` for request monitoring
- `webNavigation.onCommitted` for tab lifecycle
- NextDNS REST API for allowlist management
- `browser-compat.js` shim for cross-browser API normalization

---

## Store Assets

```
store/
├── PRIVACY.md              # Shared privacy policy
├── chrome/
│   ├── LISTING.md          # Chrome Web Store copy
│   ├── icon-128-store.png  # 128×128 store icon
│   ├── promo-tile-440x280.jpg
│   ├── marquee-1400x560.jpg
│   └── screenshots/        # 1280×800 PNG screenshots
└── firefox/
    ├── LISTING.md          # Firefox Add-ons listing copy
    └── screenshots/        # Same screenshots, Firefox-compatible
```

---

## Contributing

PRs welcome, especially for:
- Additional entries in `domain-db.js`
- Improved confidence scoring heuristics
- Edge / Safari port
- Automated tests

---

## License

MIT
