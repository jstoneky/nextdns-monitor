# NextDNS Traffic Monitor

A Chrome extension that watches your network traffic in real-time and flags requests that NextDNS may be blocking — specifically ones that could silently break website functionality.

---

## The Problem

NextDNS (and other DNS-level blockers) work great for privacy, but they can cause subtle breakage on websites. A feature flag service gets blocked, and suddenly an inventory page won't load. A session replay tool is blocked, and the site's A/B test logic fails silently. You reload the page six times wondering what's wrong, never knowing DNS was the culprit.

This extension makes that visible.

---

## How It Works

1. **Monitors network errors** on every tab using Chrome's `webRequest` API
2. **Identifies DNS-block signatures** — errors like `ERR_NAME_NOT_RESOLVED` and `ERR_CERT_AUTHORITY_INVALID` that indicate a DNS-level block (as opposed to a server error or network timeout)
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
- **Grouped list** — blocked domains sorted by risk, with the service name (e.g. "Feature Flags (Statsig)"), the DNS error type, and how many times it was hit
- **+ Allowlist button** — one click adds the domain to your NextDNS allowlist via the NextDNS API

---

## Setup

### 1. Install the extension
Load unpacked via `chrome://extensions` → Developer mode → Load unpacked (until available on the Chrome Web Store).

### 2. Configure your NextDNS credentials
Click the extension icon → ⚙️ Settings and enter:
- **NextDNS API Key** — found at [my.nextdns.io](https://my.nextdns.io) → Settings → API
- **Profile ID** — the 6-character ID shown in your NextDNS dashboard URL or profile settings

Without credentials, the extension still monitors and classifies — you just won't have the one-click allowlist feature.

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

Contributions to the database are welcome — see [Contributing](#contributing).

---

## Privacy

This extension:
- **Does not send any data externally** (except direct calls to the NextDNS API when you click Allowlist)
- **Does not store browsing history** — all data is session-only and cleared on page navigation
- **Does not collect or transmit URLs** — only hostnames are stored, and only in local extension memory
- Your NextDNS API key is stored locally in `chrome.storage.sync` (synced across your Chrome profile only)

Full privacy policy: [PRIVACY.md](./store/PRIVACY.md)

---

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JS (no build step, no dependencies)
- `chrome.webRequest.onErrorOccurred` for request monitoring
- `chrome.webNavigation.onCommitted` for tab lifecycle
- NextDNS REST API for allowlist management

---

## Contributing

PRs welcome, especially for:
- Additional entries in `domain-db.js`
- Improved confidence scoring heuristics
- Firefox / Edge port
- Automated tests

---

## License

MIT
