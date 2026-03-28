# Mac App Store Listing — DNS Medic

## App Name
DNS Medic

## Subtitle (30 chars max)
See what your DNS is blocking

## Description (4000 chars max)

Ever wonder why a website isn't loading — even though your internet is fine?

If you use NextDNS, Pi-hole, or Control D, the answer is often a silently blocked domain. A feature flag service gets blocked and the page shows an empty state. An auth provider is blocked and login fails. A CAPTCHA is blocked and the form won't submit. You reload six times and never find the cause.

DNS Medic makes it visible — and tells you exactly what's at stake.

---

FUNCTIONAL IMPACT BADGES

Most DNS debuggers just show you a list of blocked domains. DNS Medic shows you what actually breaks:

🔴 High — May break this site (auth, payments, CAPTCHA, feature flags, core CDNs)
🟡 Medium — Worth reviewing (support chat, video players, maps, error monitoring)
🟢 Low — Safe to ignore (pure analytics, ad pixels)

So instead of "statsig.com is blocked", you see "statsig.com — 🟣 feature flags". You know immediately whether it matters.

---

WHAT IT DOES

• Monitors network requests in real-time across every tab
• Detects DNS blocks — ERR_ABORTED, certificate errors, and similar signals
• Shows a functional impact badge on every blocked domain
• Blocklist attribution — see which blocklist (HaGeZi, AdGuard, uBlock, etc.) flagged each domain
• Database of 561 known services across 27 categories
• Live badge on the toolbar icon — red means high-risk blocks are active
• Filter by risk level with a single click
• One-click allowlist for NextDNS, Pi-hole, and Control D
• DNS flush reminder after every allowlist action — exact command, ready to copy
• NextDNS profile auto-detection — labels your current device's profile "This device"

---

SAFARI-SPECIFIC

Safari uses a different blocking signal than Chrome or Firefox. DNS Medic handles this correctly:

• Known tracker domains are classified immediately from the built-in database
• Unknown aborted domains appear in a separate "Unverified" section
• For NextDNS users: unverified domains are automatically confirmed using the NextDNS logs API

---

PRIVACY

• No data is ever sent to any third party
• All monitoring is session-only — cleared on navigation
• Only hostnames are stored, never full URLs or page content
• Your API key stays in your local browser storage
• Remote database updates contact GitHub only (no user data sent)

---

Perfect for NextDNS, Pi-hole, and Control D users who want to understand what's being blocked — and make informed decisions about what to allow.

## Keywords (100 chars max, comma separated)
dns,nextdns,pihole,blocker,network,privacy,allowlist,debugger,tracker,safari,extension,control d

## Category
Productivity

## Secondary Category
Developer Tools

## Age Rating
4+

## Price
Free

## What's New (v3.1.1)
• Fixed unverified section incorrectly appearing for non-DNS aborted requests
• Popup now closes automatically when the page navigates or refreshes
• Database expanded to 561 known services across 27 categories

---

## App Store Screenshots
Required sizes for macOS:
- 1280x800 or 1440x900 (MacBook)
- 2560x1600 or 2880x1800 (MacBook Pro Retina)

Use same screenshots as Chrome/Firefox store — crop/resize as needed.
Located in: store/chrome/screenshots/

## App Icon
1024x1024 PNG (no alpha, no rounded corners — Apple applies mask)
Source: store/chrome/icon-128-store.png (upscale needed)

## Support URL
https://github.com/jstoneky/nextdns-medic

## Marketing URL (optional)
https://github.com/jstoneky/nextdns-medic

## Privacy Policy URL
https://github.com/jstoneky/nextdns-medic/blob/main/store/PRIVACY.md

---

## App Review Notes (for Apple reviewers)

DNS Medic is a Safari Web Extension that monitors DNS-level network errors to identify blocked domains. It does not inject scripts into web pages, does not read page content, and does not transmit any user data. It uses the webRequest API to observe network error codes only.

To test: install the extension, enable it in Safari → Settings → Extensions, visit any website while using NextDNS or Pi-hole as your DNS resolver, and click the toolbar icon to see blocked domains.

Optional features (NextDNS API, Pi-hole API, Control D API) require the user to enter their own API credentials in the Settings panel. These credentials are stored locally only.
