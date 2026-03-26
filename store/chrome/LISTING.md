# Chrome Web Store Listing

> Also available on Firefox: store/firefox/LISTING.md

## Name
NextDNS Traffic Monitor

## Short Description (132 chars max)
Detects NextDNS-blocked requests that silently break websites. Groups by risk and lets you allowlist with one click.

## Full Description

**Ever wonder why a website isn't loading properly — even though your internet is fine?**

If you use NextDNS (or any DNS-based blocker), the answer is often a silently blocked domain. A feature flag service gets blocked, and the inventory page never loads. An auth service is blocked, and login breaks. You reload six times and never find the cause.

**NextDNS Traffic Monitor makes it visible.**

---

### What it does

• Monitors every network request on every tab in real-time
• Detects DNS-level blocks (ERR_NAME_NOT_RESOLVED, ERR_CERT_AUTHORITY_INVALID, and similar)
• Classifies blocked domains by how likely they are to break site functionality
• Shows a live badge on the icon — red means high-risk blocks are happening right now
• One-click allowlist via the NextDNS API (API key required)

---

### Risk levels

🔴 **High — May break this site**
Feature flag services (Statsig, LaunchDarkly, Optimizely), authentication providers (Auth0, Okta), search APIs (Algolia), payment processors (Stripe), and core CDNs. When these are blocked, sites often fail silently or show broken/empty states.

🟡 **Medium — Worth reviewing**
Tag managers (GTM, Tealium), support chat (Intercom, Zendesk), error monitoring (Sentry, Datadog), session replay tools (Hotjar, FullStory), and consent platforms (OneTrust). May affect functionality depending on how the site is built.

🟢 **Low — Safe to ignore**
Pure analytics (Google Analytics, Mixpanel, Amplitude) and advertising pixels. Blocking these is usually intentional and rarely breaks anything.

Unknown domains are flagged as Medium by default.

---

### One-click allowlist

Connect your NextDNS account (API key + profile ID) and every blocked domain gets a **+ Allowlist** button. One click — domain added, no dashboard required.

---

### Privacy

• No data is ever sent to any third party
• All monitoring is session-only — cleared on navigation
• Only hostnames are stored, never full URLs or page content
• Your API key stays in your local Chrome storage

---

### Perfect for

• NextDNS users who want visibility into what's being blocked
• Developers debugging sites behind DNS blockers
• Anyone who's ever had a site break mysteriously and suspected their DNS setup

---

## Category
Productivity

## Language
English

## Tags / Keywords
nextdns, dns, blocker, network monitor, privacy, allowlist, debugging, web developer

---

## Screenshots needed (1280x800 or 640x400)
1. Popup showing a site with HIGH confidence blocks (red badge, red section)
2. Popup showing mixed High/Medium/Low blocks — full breakdown
3. Settings panel with API key entry
4. Clean state (no blocks detected — green checkmark)
5. Allowlist button in action (success state)

## Promotional tile (440x280)
See: store/promo-tile.html (to be rendered)

## Store icon
Use icons/icon128.png
