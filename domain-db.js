// Domain categorization database
// Confidence levels: HIGH, MEDIUM, LOW
// HIGH = very likely to break site functionality if blocked
// MEDIUM = may break functionality, worth reviewing
// LOW = analytics/ads, almost never breaks anything functional

const DOMAIN_DB = [
  // ─── FEATURE FLAGS & EXPERIMENTATION (HIGH) ───────────────────────────────
  { pattern: /statsig/i,           label: "Feature Flags (Statsig)",      confidence: "HIGH",   category: "feature-flags" },
  { pattern: /featureassets\.org/, label: "Feature Flags (Statsig CDN)",  confidence: "HIGH",   category: "feature-flags" },
  { pattern: /launchdarkly/i,      label: "Feature Flags (LaunchDarkly)", confidence: "HIGH",   category: "feature-flags" },
  { pattern: /split\.io/,          label: "Feature Flags (Split.io)",     confidence: "HIGH",   category: "feature-flags" },
  { pattern: /optimizely/i,        label: "A/B Testing (Optimizely)",     confidence: "HIGH",   category: "feature-flags" },
  { pattern: /growthbook/i,        label: "Feature Flags (GrowthBook)",   confidence: "HIGH",   category: "feature-flags" },
  { pattern: /posthog/i,           label: "Feature Flags (PostHog)",      confidence: "HIGH",   category: "feature-flags" },
  { pattern: /unleash/i,           label: "Feature Flags (Unleash)",      confidence: "HIGH",   category: "feature-flags" },
  { pattern: /flagsmith/i,         label: "Feature Flags (Flagsmith)",    confidence: "HIGH",   category: "feature-flags" },
  { pattern: /amplitude\.com\/libs/, label: "Feature Flags (Amplitude Experiment)", confidence: "HIGH", category: "feature-flags" },

  // ─── AUTHENTICATION & SESSION (HIGH) ──────────────────────────────────────
  { pattern: /auth0\.com/,         label: "Auth (Auth0)",                 confidence: "HIGH",   category: "auth" },
  { pattern: /okta\.com/,          label: "Auth (Okta)",                  confidence: "HIGH",   category: "auth" },
  { pattern: /onelogin\.com/,      label: "Auth (OneLogin)",              confidence: "HIGH",   category: "auth" },
  { pattern: /cognito.*amazonaws/, label: "Auth (AWS Cognito)",           confidence: "HIGH",   category: "auth" },
  { pattern: /accounts\.google\.com/, label: "Auth (Google Sign-In)",     confidence: "HIGH",   category: "auth" },
  { pattern: /login\.microsoftonline/, label: "Auth (Microsoft SSO)",     confidence: "HIGH",   category: "auth" },

  // ─── SEARCH & INVENTORY APIS (HIGH for e-commerce) ────────────────────────
  { pattern: /algolia/i,           label: "Search (Algolia)",             confidence: "HIGH",   category: "search-api" },
  { pattern: /searchspring/i,      label: "Search (SearchSpring)",        confidence: "HIGH",   category: "search-api" },
  { pattern: /klevu/i,             label: "Search (Klevu)",               confidence: "HIGH",   category: "search-api" },
  { pattern: /constructor\.io/,    label: "Search (Constructor.io)",      confidence: "HIGH",   category: "search-api" },
  { pattern: /elastic\.co/,        label: "Search (Elasticsearch)",       confidence: "HIGH",   category: "search-api" },

  // ─── PAYMENT & COMMERCE (HIGH) ────────────────────────────────────────────
  { pattern: /stripe\.com/,        label: "Payments (Stripe)",            confidence: "HIGH",   category: "payments" },
  { pattern: /braintree/i,         label: "Payments (Braintree)",         confidence: "HIGH",   category: "payments" },
  { pattern: /paypal\.com/,        label: "Payments (PayPal)",            confidence: "HIGH",   category: "payments" },
  { pattern: /square(up)?\.com/,   label: "Payments (Square)",            confidence: "HIGH",   category: "payments" },

  // ─── CORE CDNS & INFRASTRUCTURE (HIGH) ────────────────────────────────────
  { pattern: /cloudflare/i,        label: "CDN (Cloudflare)",             confidence: "HIGH",   category: "cdn" },
  { pattern: /fastly\.net/,        label: "CDN (Fastly)",                 confidence: "HIGH",   category: "cdn" },
  { pattern: /akamai/i,            label: "CDN (Akamai)",                 confidence: "HIGH",   category: "cdn" },
  { pattern: /amazonaws\.com/,     label: "Cloud (AWS)",                  confidence: "HIGH",   category: "cdn" },
  { pattern: /googleapis\.com/,    label: "APIs (Google APIs)",           confidence: "HIGH",   category: "cdn" },
  { pattern: /gstatic\.com/,       label: "Assets (Google Static)",       confidence: "HIGH",   category: "cdn" },

  // ─── API GATEWAYS / REAL-TIME (HIGH) ──────────────────────────────────────
  { pattern: /pusher/i,            label: "Real-time (Pusher)",           confidence: "HIGH",   category: "realtime" },
  { pattern: /ably\.io/,           label: "Real-time (Ably)",             confidence: "HIGH",   category: "realtime" },
  { pattern: /socket\.io/,         label: "Real-time (Socket.io)",        confidence: "HIGH",   category: "realtime" },
  { pattern: /twilio/i,            label: "Messaging (Twilio)",           confidence: "HIGH",   category: "realtime" },

  // ─── CUSTOMER SUPPORT CHAT (MEDIUM — functional on some sites) ────────────
  { pattern: /intercom/i,          label: "Chat (Intercom)",              confidence: "MEDIUM", category: "chat" },
  { pattern: /zendesk/i,           label: "Support (Zendesk)",            confidence: "MEDIUM", category: "chat" },
  { pattern: /freshchat/i,         label: "Chat (Freshchat)",             confidence: "MEDIUM", category: "chat" },
  { pattern: /drift\.com/,         label: "Chat (Drift)",                 confidence: "MEDIUM", category: "chat" },
  { pattern: /livechat/i,          label: "Chat (LiveChat)",              confidence: "MEDIUM", category: "chat" },
  { pattern: /crisp\.chat/,        label: "Chat (Crisp)",                 confidence: "MEDIUM", category: "chat" },
  { pattern: /hubspot/i,           label: "Chat/CRM (HubSpot)",           confidence: "MEDIUM", category: "chat" },

  // ─── ERROR MONITORING (MEDIUM — some sites gate features on this) ──────────
  { pattern: /sentry\.io/,         label: "Error Tracking (Sentry)",      confidence: "MEDIUM", category: "monitoring" },
  { pattern: /bugsnag/i,           label: "Error Tracking (Bugsnag)",     confidence: "MEDIUM", category: "monitoring" },
  { pattern: /rollbar/i,           label: "Error Tracking (Rollbar)",     confidence: "MEDIUM", category: "monitoring" },
  { pattern: /datadog/i,           label: "Monitoring (Datadog)",         confidence: "MEDIUM", category: "monitoring" },
  { pattern: /newrelic/i,          label: "Monitoring (New Relic)",       confidence: "MEDIUM", category: "monitoring" },
  { pattern: /dynatrace/i,         label: "Monitoring (Dynatrace)",       confidence: "MEDIUM", category: "monitoring" },

  // ─── SESSION REPLAY (MEDIUM — sites sometimes gate UX on these) ────────────
  { pattern: /hotjar/i,            label: "Session Replay (Hotjar)",      confidence: "MEDIUM", category: "session-replay" },
  { pattern: /fullstory/i,         label: "Session Replay (FullStory)",   confidence: "MEDIUM", category: "session-replay" },
  { pattern: /logrocket/i,         label: "Session Replay (LogRocket)",   confidence: "MEDIUM", category: "session-replay" },
  { pattern: /mouseflow/i,         label: "Session Replay (Mouseflow)",   confidence: "MEDIUM", category: "session-replay" },
  { pattern: /inspectlet/i,        label: "Session Replay (Inspectlet)",  confidence: "MEDIUM", category: "session-replay" },
  { pattern: /luckyorange/i,       label: "Session Replay (Lucky Orange)", confidence: "MEDIUM", category: "session-replay" },

  // ─── TAG MANAGEMENT (MEDIUM — GTM can load critical scripts) ──────────────
  { pattern: /googletagmanager/i,  label: "Tag Manager (GTM)",            confidence: "MEDIUM", category: "tag-manager" },
  { pattern: /tealium/i,           label: "Tag Manager (Tealium)",        confidence: "MEDIUM", category: "tag-manager" },
  { pattern: /ensighten/i,         label: "Tag Manager (Ensighten)",      confidence: "MEDIUM", category: "tag-manager" },
  { pattern: /segment\.(com|io)/,  label: "Data Pipeline (Segment)",      confidence: "MEDIUM", category: "tag-manager" },

  // ─── CONSENT MANAGEMENT (MEDIUM — can block entire page init) ─────────────
  { pattern: /cookielaw/i,         label: "Consent (OneTrust/CookieLaw)", confidence: "MEDIUM", category: "consent" },
  { pattern: /onetrust/i,          label: "Consent (OneTrust)",           confidence: "MEDIUM", category: "consent" },
  { pattern: /cookiebot/i,         label: "Consent (Cookiebot)",          confidence: "MEDIUM", category: "consent" },
  { pattern: /usercentrics/i,      label: "Consent (Usercentrics)",       confidence: "MEDIUM", category: "consent" },
  { pattern: /quantcast/i,         label: "Consent (Quantcast Choice)",   confidence: "MEDIUM", category: "consent" },

  // ─── PURE ANALYTICS (LOW — almost never breaks functionality) ─────────────
  { pattern: /google-analytics/i,  label: "Analytics (Google Analytics)", confidence: "LOW",    category: "analytics" },
  { pattern: /analytics\.google/,  label: "Analytics (Google Analytics)", confidence: "LOW",    category: "analytics" },
  { pattern: /mixpanel/i,          label: "Analytics (Mixpanel)",         confidence: "LOW",    category: "analytics" },
  { pattern: /heap\.io/,           label: "Analytics (Heap)",             confidence: "LOW",    category: "analytics" },
  { pattern: /amplitude\.com/,     label: "Analytics (Amplitude)",        confidence: "LOW",    category: "analytics" },
  { pattern: /kissmetrics/i,       label: "Analytics (Kissmetrics)",      confidence: "LOW",    category: "analytics" },
  { pattern: /clicky\.com/,        label: "Analytics (Clicky)",           confidence: "LOW",    category: "analytics" },
  { pattern: /statcounter/i,       label: "Analytics (StatCounter)",      confidence: "LOW",    category: "analytics" },
  { pattern: /plausible\.io/,      label: "Analytics (Plausible)",        confidence: "LOW",    category: "analytics" },
  { pattern: /fathom/i,            label: "Analytics (Fathom)",           confidence: "LOW",    category: "analytics" },

  // ─── ADVERTISING (LOW — never breaks functionality) ───────────────────────
  { pattern: /doubleclick/i,       label: "Ads (Google DoubleClick)",     confidence: "LOW",    category: "advertising" },
  { pattern: /googlesyndication/i, label: "Ads (Google AdSense)",         confidence: "LOW",    category: "advertising" },
  { pattern: /facebook\.net/,      label: "Ads (Facebook Pixel)",         confidence: "LOW",    category: "advertising" },
  { pattern: /connect\.facebook/,  label: "Ads (Facebook)",               confidence: "LOW",    category: "advertising" },
  { pattern: /ads\.linkedin/,      label: "Ads (LinkedIn)",               confidence: "LOW",    category: "advertising" },
  { pattern: /snap\.licdn/,        label: "Ads (LinkedIn Insight)",       confidence: "LOW",    category: "advertising" },
  { pattern: /twitter\.com\/i\/adsct/, label: "Ads (Twitter)",            confidence: "LOW",    category: "advertising" },
  { pattern: /criteo/i,            label: "Ads (Criteo)",                 confidence: "LOW",    category: "advertising" },
  { pattern: /adroll/i,            label: "Ads (AdRoll)",                 confidence: "LOW",    category: "advertising" },
  { pattern: /rubiconproject/i,    label: "Ads (Rubicon)",                confidence: "LOW",    category: "advertising" },
  { pattern: /pubmatic/i,          label: "Ads (PubMatic)",               confidence: "LOW",    category: "advertising" },
  { pattern: /adnxs/i,             label: "Ads (AppNexus)",               confidence: "LOW",    category: "advertising" },
];

const NEXTDNS_ERRORS = [
  "net::ERR_NAME_NOT_RESOLVED",
  "net::ERR_CERT_AUTHORITY_INVALID",
  "net::ERR_BLOCKED_BY_ADMINISTRATOR",
  "net::ERR_BLOCKED_BY_CLIENT",
  "net::ERR_FAILED",
];

function classifyDomain(hostname) {
  for (const entry of DOMAIN_DB) {
    if (entry.pattern.test(hostname)) {
      return {
        label: entry.label,
        confidence: entry.confidence,
        category: entry.category,
        known: true,
      };
    }
  }
  return {
    label: "Unknown Domain",
    confidence: "MEDIUM",
    category: "unknown",
    known: false,
  };
}

function isLikelyNextDNSBlock(error) {
  return NEXTDNS_ERRORS.some(e => error.includes(e));
}

// Export for use in background.js and popup.js
if (typeof module !== "undefined") {
  module.exports = { classifyDomain, isLikelyNextDNSBlock, DOMAIN_DB };
}
