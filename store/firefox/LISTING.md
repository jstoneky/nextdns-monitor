# Firefox Add-ons Listing

## Name
NextDNS Traffic Monitor

## Summary (250 chars max)
Detects NextDNS-blocked requests that silently break websites. Groups blocked domains by risk level — High, Medium, or Low — and lets you allowlist them instantly via the NextDNS API.

## Description

**Ever wonder why a website isn't loading properly — even though your internet is fine?**

If you use NextDNS (or any DNS-based blocker), the answer is often a silently blocked domain. A feature flag service gets blocked, and the inventory page never loads. An auth service is blocked, and login breaks. You reload six times and never find the cause.

**NextDNS Traffic Monitor makes it visible.**

---

**What it does**

• Monitors every network request on every tab in real-time
• Detects DNS-level blocks (certificate issuer errors, name resolution failures, and similar)
• Classifies blocked domains by how likely they are to break site functionality
• Shows a live badge on the icon — red means high-risk blocks are happening right now
• One-click allowlist via the NextDNS API (API key required)

---

**Risk levels**

🔴 High — May break this site
Feature flag services (Statsig, LaunchDarkly, Optimizely), authentication providers (Auth0, Okta), search APIs (Algolia), payment processors (Stripe), and core CDNs. When these are blocked, sites often fail silently or show broken/empty states.

🟡 Medium — Worth reviewing
Tag managers (GTM, Tealium), support chat (Intercom, Zendesk), error monitoring (Sentry, Datadog), session replay tools (Hotjar, FullStory), and consent platforms (OneTrust). May affect functionality depending on how the site is built.

🟢 Low — Safe to ignore
Pure analytics (Google Analytics, Mixpanel, Amplitude) and advertising pixels. Blocking these is usually intentional and rarely breaks anything.

Unknown domains are flagged as Medium by default.

---

**One-click allowlist**

Connect your NextDNS account (API key + profile ID) and every blocked domain gets a + Allowlist button. One click — domain added, no dashboard required.

---

**Privacy**

• No data is ever sent to any third party
• All monitoring is session-only — cleared on navigation
• Only hostnames are stored, never full URLs or page content
• Your API key stays in your local browser storage

---

**Perfect for**

• NextDNS users who want visibility into what's being blocked
• Developers debugging sites behind DNS blockers
• Anyone who's ever had a site break mysteriously and suspected their DNS setup

---

## Category
Privacy & Security

## Tags
nextdns, dns, blocker, network monitor, privacy, allowlist, debugging, developer tools

## Support / Homepage
https://github.com/jstoneky/nextdns-monitor

## License
MIT

---

## Screenshots (recommended: 1280x800 or 640x400 PNG/JPG)
Located in store/firefox/screenshots/ — same as Chrome screenshots (identical UI).

## Privacy Policy URL
Link to raw GitHub: https://raw.githubusercontent.com/jstoneky/nextdns-monitor/main/store/PRIVACY.md
Or enable GitHub Pages for a cleaner URL.
