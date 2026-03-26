# Chrome Web Store Listing

## Name
NextDNS Medic

## Short Description (132 chars max)
Detects DNS-blocked requests that silently break websites. Filter by risk, copy domains, and flush DNS — all in one click.

## Full Description

**Ever wonder why a website isn't loading properly — even though your internet is fine?**

If you use NextDNS (or any DNS-based blocker), the answer is often a silently blocked domain. A feature flag service gets blocked, and the inventory page never loads. An auth provider is blocked, and login breaks. You reload six times and never find the cause.

**NextDNS Medic makes it visible.**

---

### What it does

• Monitors every network request on every tab in real-time
• Detects DNS-level blocks (ERR_NAME_NOT_RESOLVED, ERR_CERT_AUTHORITY_INVALID, and similar)
• Classifies blocked domains by how likely they are to break site functionality
• Shows a live badge on the icon — red means high-risk blocks are active right now
• Filter by risk level with a single click on the stats bar
• Copy any domain to clipboard — works with Pi-hole, AdGuard, or any DNS blocker
• One-click allowlist via the NextDNS API (API key required)
• DNS flush reminder after every allowlist or copy action — exact command for your OS, ready to copy

---

### Risk levels

🔴 **High — May break this site**
Feature flag services (Statsig, LaunchDarkly, Optimizely, PostHog), authentication providers (Auth0, Okta, Clerk), search APIs (Algolia, Bloomreach), payment processors (Stripe, Braintree, Adyen), and core CDNs. When these are blocked, sites often fail silently or show broken/empty states.

🟡 **Medium — Worth reviewing**
Tag managers (GTM, Tealium, Segment), support chat (Intercom, Zendesk, Drift), error monitoring (Sentry, Datadog, New Relic), session replay tools (Hotjar, FullStory, LogRocket), and consent platforms (OneTrust, Cookiebot). May affect functionality depending on how the site is built.

🟢 **Low — Safe to ignore**
Pure analytics (Google Analytics, Mixpanel, Amplitude, Heap) and advertising pixels (Meta, LinkedIn, TikTok). Blocking these is usually intentional and rarely breaks anything.

Unknown domains are flagged as Medium by default.

---

### Filter by risk level

Click **High**, **Medium**, or **Low** in the stats bar to filter the list instantly. Click again to clear. Active level is highlighted; inactive ones dim out — so you can focus on what matters.

---

### Copy to clipboard

Every blocked domain has a 📋 copy button. No NextDNS account needed — copy the domain and paste it into Pi-hole, AdGuard Home, or any other DNS blocker's dashboard.

---

### DNS flush reminder

After you allowlist or copy a domain, a banner appears with the exact DNS flush command for your OS (macOS, Windows, or Linux) — with its own copy button. No more wondering why changes aren't taking effect.

---

### One-click allowlist (NextDNS users)

Connect your NextDNS account (API key + profile ID from my.nextdns.io) and every blocked domain gets a **+ Allowlist** button. One click — domain added, no dashboard required.

---

### 346+ domain database, always up to date

Ships with a curated database of 346+ known services across 13 categories. The database is automatically fetched from GitHub and cached locally for 7 days. Force-refresh anytime from the Settings panel.

---

### Privacy

• No data is ever sent to any third party
• All monitoring is session-only — cleared on navigation
• Only hostnames are stored, never full URLs or page content
• Your API key stays in your local Chrome storage
• Remote DB fetch contacts GitHub only (no user data sent)

---

### Perfect for

• NextDNS users who want visibility into what's being blocked
• Developers debugging sites behind DNS blockers
• Pi-hole and AdGuard users who need to identify broken domains
• Anyone who's ever had a site break mysteriously and suspected their DNS setup

---

## Category
Productivity

## Language
English

## Tags / Keywords
nextdns, dns, blocker, network monitor, privacy, allowlist, debugging, web developer, pi-hole, adguard

---

## Screenshots (1280x800)
Located in store/chrome/screenshots/
1. Popup with HIGH confidence blocks detected (red badge, red section visible)
2. Popup showing mixed High/Medium/Low breakdown
3. Filter active — only High items shown, Medium/Low dimmed
4. Settings panel open showing DB meta + refresh button
5. DNS flush banner visible after allowlist action

## Promotional tile (440x280)
store/chrome/promo-tile-440x280.jpg

## Marquee (1400x560)
store/chrome/marquee-1400x560.jpg

## Store icon (128x128)
store/chrome/icon-128-store.png
