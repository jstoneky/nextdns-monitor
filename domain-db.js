// domain-db.js — DNS Medic
//
// THIS FILE IS AUTO-GENERATED. DO NOT EDIT.
// Source of truth: nextdns-medic-research/db/*.yaml
// Regenerate: npm run build (in nextdns-medic-research) or ./build.sh (here)
//
// Classification is handled entirely by db-loader.js (classifyDomainActive).
// This file is a thin shim kept for script-load ordering only.

// Stub: db-loader.js overrides globalThis.classifyDomain immediately on load.
// This no-op stub ensures any request arriving before db-loader.js is ready
// returns a safe default rather than throwing a ReferenceError.
if (typeof globalThis.classifyDomain === "undefined") {
  globalThis.classifyDomain = function classifyDomain() {
    return { label: "Unknown Domain", confidence: "MEDIUM", category: "unknown", known: false };
  };
}

// DOMAIN_DB kept for backwards compat only — not used for classification
const DOMAIN_DB = [];

if (typeof module !== "undefined") {
  module.exports = { DOMAIN_DB };
}
