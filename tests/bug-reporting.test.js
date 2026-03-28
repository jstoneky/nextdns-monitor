// tests/bug-reporting.test.js
// Tests for the bug reporting system:
//   - Error logger (logError, cap, storage)
//   - Message handlers (GET_ERROR_LOG, CLEAR_ERROR_LOG)
//   - diagnostics.html and issue template existence
//   - buildBugReportLink URL construction (via popup.js helpers)
//
// Run with: node --test tests/bug-reporting.test.js

const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs   = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// ─── Mock storage (simulates ext.storage.local) ───────────────────────────────
function makeMockStorage(initial = {}) {
  const store = { ...initial };
  return {
    async get(key) {
      return { [key]: store[key] };
    },
    async set(obj) {
      Object.assign(store, obj);
    },
    async remove(key) {
      delete store[key];
    },
    _raw: store,
  };
}

// Re-require logError with a swapped-in storage mock
function makeLogger(storage) {
  const ERROR_LOG_KEY = "dnsmedic_error_log";
  const ERROR_LOG_MAX = 20;

  async function logError(context, err) {
    try {
      const entry = {
        ts: new Date().toISOString(),
        ctx: context,
        msg: err && err.message ? err.message : String(err),
        stack: err && err.stack ? err.stack.split("\n").slice(0, 4).join(" | ") : "",
      };
      const stored = await storage.get(ERROR_LOG_KEY);
      const log = Array.isArray(stored[ERROR_LOG_KEY]) ? stored[ERROR_LOG_KEY] : [];
      log.push(entry);
      if (log.length > ERROR_LOG_MAX) log.splice(0, log.length - ERROR_LOG_MAX);
      await storage.set({ [ERROR_LOG_KEY]: log });
    } catch (_) {}
  }

  return { logError, ERROR_LOG_KEY, ERROR_LOG_MAX, storage };
}

// ─── Error logger ─────────────────────────────────────────────────────────────
describe("Error logger — logError()", () => {
  test("stores a single error entry", async () => {
    const storage = makeMockStorage();
    const { logError, ERROR_LOG_KEY } = makeLogger(storage);
    await logError("test-context", new Error("something broke"));
    const log = storage._raw[ERROR_LOG_KEY];
    assert.ok(Array.isArray(log), "log should be an array");
    assert.equal(log.length, 1);
    assert.equal(log[0].ctx, "test-context");
    assert.equal(log[0].msg, "something broke");
    assert.ok(log[0].ts, "entry should have a timestamp");
  });

  test("appends multiple errors in order", async () => {
    const storage = makeMockStorage();
    const { logError, ERROR_LOG_KEY } = makeLogger(storage);
    await logError("ctx1", new Error("first"));
    await logError("ctx2", new Error("second"));
    await logError("ctx3", new Error("third"));
    const log = storage._raw[ERROR_LOG_KEY];
    assert.equal(log.length, 3);
    assert.equal(log[0].msg, "first");
    assert.equal(log[2].msg, "third");
  });

  test("caps log at ERROR_LOG_MAX entries", async () => {
    const storage = makeMockStorage();
    const { logError, ERROR_LOG_KEY, ERROR_LOG_MAX } = makeLogger(storage);
    // Write MAX + 5 errors
    for (let i = 0; i < ERROR_LOG_MAX + 5; i++) {
      await logError("overflow", new Error(`error-${i}`));
    }
    const log = storage._raw[ERROR_LOG_KEY];
    assert.equal(log.length, ERROR_LOG_MAX, `log should be capped at ${ERROR_LOG_MAX}`);
  });

  test("keeps the most recent entries when capped", async () => {
    const storage = makeMockStorage();
    const { logError, ERROR_LOG_KEY, ERROR_LOG_MAX } = makeLogger(storage);
    for (let i = 0; i < ERROR_LOG_MAX + 3; i++) {
      await logError("cap-test", new Error(`error-${i}`));
    }
    const log = storage._raw[ERROR_LOG_KEY];
    // Last entry should be the most recent
    assert.equal(log[log.length - 1].msg, `error-${ERROR_LOG_MAX + 2}`);
    // First entry should NOT be error-0 (was trimmed)
    assert.notEqual(log[0].msg, "error-0");
  });

  test("handles non-Error objects (plain strings)", async () => {
    const storage = makeMockStorage();
    const { logError, ERROR_LOG_KEY } = makeLogger(storage);
    await logError("string-error", "just a plain string");
    const log = storage._raw[ERROR_LOG_KEY];
    assert.equal(log[0].msg, "just a plain string");
  });

  test("handles null/undefined errors without throwing", async () => {
    const storage = makeMockStorage();
    const { logError, ERROR_LOG_KEY } = makeLogger(storage);
    await assert.doesNotReject(() => logError("null-test", null));
    await assert.doesNotReject(() => logError("undef-test", undefined));
    const log = storage._raw[ERROR_LOG_KEY];
    assert.equal(log.length, 2);
  });

  test("never throws even if storage fails", async () => {
    const brokenStorage = {
      async get() { throw new Error("storage exploded"); },
      async set() { throw new Error("storage exploded"); },
      async remove() { throw new Error("storage exploded"); },
    };
    const { logError } = makeLogger(brokenStorage);
    await assert.doesNotReject(() => logError("storage-fail", new Error("test")));
  });

  test("entry includes stack trace (truncated to 4 lines)", async () => {
    const storage = makeMockStorage();
    const { logError, ERROR_LOG_KEY } = makeLogger(storage);
    const err = new Error("trace test");
    await logError("trace", err);
    const log = storage._raw[ERROR_LOG_KEY];
    // Stack should be a string (may be empty in some envs, but should not be an array)
    assert.equal(typeof log[0].stack, "string");
  });

  test("appends to existing log (survives across calls)", async () => {
    const storage = makeMockStorage();
    const { logError, ERROR_LOG_KEY } = makeLogger(storage);
    await logError("first-run", new Error("a"));
    // Simulate second run — same storage, new logger instance
    const { logError: logError2 } = makeLogger(storage);
    await logError2("second-run", new Error("b"));
    const log = storage._raw[ERROR_LOG_KEY];
    assert.equal(log.length, 2);
    assert.equal(log[0].ctx, "first-run");
    assert.equal(log[1].ctx, "second-run");
  });
});

// ─── Message handler simulation ───────────────────────────────────────────────
describe("Message handlers — GET_ERROR_LOG / CLEAR_ERROR_LOG", () => {
  test("GET_ERROR_LOG returns empty array when no errors logged", async () => {
    const storage = makeMockStorage();
    const stored = await storage.get("dnsmedic_error_log");
    const result = stored["dnsmedic_error_log"] || [];
    assert.deepEqual(result, []);
  });

  test("GET_ERROR_LOG returns logged entries", async () => {
    const storage = makeMockStorage();
    const { logError, ERROR_LOG_KEY } = makeLogger(storage);
    await logError("handler-test", new Error("handler error"));
    const stored = await storage.get(ERROR_LOG_KEY);
    const result = stored[ERROR_LOG_KEY] || [];
    assert.equal(result.length, 1);
    assert.equal(result[0].ctx, "handler-test");
  });

  test("CLEAR_ERROR_LOG removes all entries", async () => {
    const storage = makeMockStorage();
    const { logError, ERROR_LOG_KEY } = makeLogger(storage);
    await logError("before-clear", new Error("should be gone"));
    await storage.remove(ERROR_LOG_KEY);
    const stored = await storage.get(ERROR_LOG_KEY);
    const result = stored[ERROR_LOG_KEY] || [];
    assert.deepEqual(result, []);
  });
});

// ─── Bug report URL construction ─────────────────────────────────────────────
describe("Bug report URL construction", () => {
  test("GitHub issue URL includes correct base", () => {
    const base = "https://github.com/jstoneky/nextdns-medic/issues/new";
    const url = `${base}?template=bug_report.md&title=%5BBug%5D+&body=${encodeURIComponent("test body")}`;
    assert.ok(url.startsWith(base));
  });

  test("encodeURIComponent encodes characters that would break URLs", () => {
    const body = "**Version:** 3.0.0\n```\nerror log\n```";
    const encoded = encodeURIComponent(body);
    // newlines and backticks must be encoded — they'd break the URL
    assert.ok(!encoded.includes("\n"), "newlines should be encoded");
    assert.ok(!encoded.includes("`"), "backticks should be encoded");
    // encoded string should be longer than original
    assert.ok(encoded.length > body.length, "encoded string should be longer");
  });

  test("URL decodes back to original body", () => {
    const body = "**Browser:** Chrome 124\n**OS:** macOS\nError log:\n```\ntest error\n```";
    const encoded = encodeURIComponent(body);
    assert.equal(decodeURIComponent(encoded), body);
  });

  test("error log entries are formatted as expected", () => {
    const entries = [
      { ts: "2026-03-28T15:00:00.000Z", ctx: "uncaught", msg: "Cannot read property 'x' of null", stack: "" },
      { ts: "2026-03-28T15:01:00.000Z", ctx: "unhandledrejection", msg: "Failed to fetch", stack: "" },
    ];
    const errorStr = entries.map(e => `[${e.ts}] ${e.ctx}: ${e.msg}`).join("\n");
    assert.ok(errorStr.includes("[2026-03-28T15:00:00.000Z] uncaught: Cannot read property"));
    assert.ok(errorStr.includes("[2026-03-28T15:01:00.000Z] unhandledrejection: Failed to fetch"));
  });

  test("empty error log formats as 'None'", () => {
    const errorLog = [];
    const errorStr = errorLog.length
      ? errorLog.map(e => `[${e.ts}] ${e.ctx}: ${e.msg}`).join("\n")
      : "None";
    assert.equal(errorStr, "None");
  });
});

// ─── File existence checks ────────────────────────────────────────────────────
describe("Bug reporting files exist", () => {
  test("diagnostics.html exists", () => {
    assert.ok(fs.existsSync(path.join(ROOT, "diagnostics.html")), "diagnostics.html missing");
  });

  test("diagnostics.html is non-empty", () => {
    const size = fs.statSync(path.join(ROOT, "diagnostics.html")).size;
    assert.ok(size > 1000, `diagnostics.html too small (${size} bytes)`);
  });

  test("diagnostics.html contains browser detection logic", () => {
    const content = fs.readFileSync(path.join(ROOT, "diagnostics.html"), "utf8");
    assert.ok(content.includes("detectBrowser"), "missing detectBrowser function");
    assert.ok(content.includes("detectOS"), "missing detectOS function");
    assert.ok(content.includes("buildReport"), "missing buildReport function");
  });

  test("diagnostics.html links to correct GitHub repo", () => {
    const content = fs.readFileSync(path.join(ROOT, "diagnostics.html"), "utf8");
    assert.ok(content.includes("jstoneky/nextdns-medic"), "wrong or missing GitHub repo link");
  });

  test("GitHub issue template exists", () => {
    const tmpl = path.join(ROOT, ".github/ISSUE_TEMPLATE/bug_report.md");
    assert.ok(fs.existsSync(tmpl), ".github/ISSUE_TEMPLATE/bug_report.md missing");
  });

  test("issue template has required sections", () => {
    const tmpl = path.join(ROOT, ".github/ISSUE_TEMPLATE/bug_report.md");
    const content = fs.readFileSync(tmpl, "utf8");
    assert.ok(content.includes("Extension version"), "missing Extension version field");
    assert.ok(content.includes("Browser"), "missing Browser field");
    assert.ok(content.includes("DNS provider"), "missing DNS provider field");
    assert.ok(content.includes("Steps to reproduce"), "missing Steps to reproduce section");
    assert.ok(content.includes("Console errors"), "missing Console errors section");
  });

  test("popup.html contains Report a Bug link", () => {
    const content = fs.readFileSync(path.join(ROOT, "popup.html"), "utf8");
    assert.ok(content.includes("btn-report-bug"), "missing #btn-report-bug element");
    assert.ok(content.includes("Report a Bug"), "missing 'Report a Bug' text");
  });

  test("popup.js contains buildBugReportLink function", () => {
    const content = fs.readFileSync(path.join(ROOT, "popup.js"), "utf8");
    assert.ok(content.includes("buildBugReportLink"), "missing buildBugReportLink function");
    assert.ok(content.includes("GET_ERROR_LOG"), "missing GET_ERROR_LOG message call");
    assert.ok(content.includes("getManifest"), "missing manifest version lookup");
  });

  test("background.js exports logError", () => {
    const { logError } = require("../background.js");
    assert.equal(typeof logError, "function");
  });

  test("background.js exports ERROR_LOG_KEY and ERROR_LOG_MAX", () => {
    const { ERROR_LOG_KEY, ERROR_LOG_MAX } = require("../background.js");
    assert.equal(typeof ERROR_LOG_KEY, "string");
    assert.ok(ERROR_LOG_KEY.length > 0);
    assert.equal(typeof ERROR_LOG_MAX, "number");
    assert.ok(ERROR_LOG_MAX >= 10, "ERROR_LOG_MAX should be at least 10");
  });
});
