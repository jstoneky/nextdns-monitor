// tests/popup-display.test.js
// Tests for computeDisplayBlocks() in popup.js
//
// Regression coverage for: "displayBlocks referenced before initialization"
// which occurred because sort/stats code appeared above the const declaration.
// Extracting the pure function lets us verify display logic without a DOM.

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// popup.js uses browser globals — stub the minimum needed to import it
globalThis.chrome = {
  storage: { sync: { get: () => {}, set: () => {} }, local: { get: () => {}, set: () => {} } },
  runtime: { sendMessage: () => {}, onMessage: { addListener: () => {} }, getURL: (p) => p },
  tabs: { query: () => {}, onActivated: { addListener: () => {} }, onUpdated: { addListener: () => {} }, onRemoved: { addListener: () => {} } },
  action: { setBadgeText: () => {}, setBadgeBackgroundColor: () => {} },
};
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ classList: { add(){}, remove(){}, toggle(){} }, appendChild(){}, textContent: "", style: {} }),
  body: { classList: { add(){}, remove(){}, toggle(){} } },
};
globalThis.window = { NDMProviders: {} };

const { computeDisplayBlocks } = require("../popup.js");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBlock(overrides = {}) {
  return {
    domain: "example.com",
    count: 1,
    isDefiniteBlock: false,
    isPossibleBlock: false,
    isSafariAbort: false,
    classification: {
      known: false,
      label: "Unknown Domain",
      confidence: "MEDIUM",
      category: "unknown",
    },
    ...overrides,
  };
}

// ── computeDisplayBlocks — immutability ───────────────────────────────────────

describe("computeDisplayBlocks — immutability", () => {
  test("does not mutate the input blocks array", () => {
    const blocks = [makeBlock({ domain: "ads.example.com", isDefiniteBlock: true })];
    const original = JSON.stringify(blocks);
    computeDisplayBlocks(blocks, {});
    assert.equal(JSON.stringify(blocks), original, "input blocks should be unchanged");
  });

  test("does not mutate individual block objects", () => {
    const block = makeBlock({ isDefiniteBlock: true });
    const originalClassification = { ...block.classification };
    computeDisplayBlocks([block], {});
    assert.deepEqual(block.classification, originalClassification, "block.classification should not be mutated");
  });

  test("returns a new array (not the same reference)", () => {
    const blocks = [makeBlock()];
    const result = computeDisplayBlocks(blocks, {});
    assert.notEqual(result, blocks);
  });

  test("result blocks are new objects (not same references)", () => {
    const block = makeBlock();
    const [result] = computeDisplayBlocks([block], {});
    assert.notEqual(result, block);
  });
});

// ── computeDisplayBlocks — promotion logic ────────────────────────────────────

describe("computeDisplayBlocks — promotion: blocklist cache", () => {
  test("unknown block promoted to known when in blocklist cache", () => {
    const block = makeBlock({ domain: "tracker.example.com" });
    const cache = { "tracker.example.com": [{ name: "Steven Black" }] };
    const [result] = computeDisplayBlocks([block], cache);
    assert.equal(result.classification.known, true);
    assert.equal(result.classification.label, "Confirmed by DNS logs");
    assert.equal(result.classification.confidence, "MEDIUM");
  });

  test("already-known block not re-promoted by blocklist cache", () => {
    const block = makeBlock({
      domain: "tracker.example.com",
      classification: { known: true, label: "Ad Network", confidence: "HIGH", category: "ads" },
    });
    const cache = { "tracker.example.com": [{ name: "Steven Black" }] };
    const [result] = computeDisplayBlocks([block], cache);
    assert.equal(result.classification.label, "Ad Network", "known blocks should not be re-labelled");
    assert.equal(result.classification.confidence, "HIGH");
  });
});

describe("computeDisplayBlocks — promotion: definite/possible blocks", () => {
  test("unknown definite block promoted to known MEDIUM", () => {
    const block = makeBlock({ isDefiniteBlock: true });
    const [result] = computeDisplayBlocks([block], {});
    assert.equal(result.classification.known, true);
    assert.equal(result.classification.confidence, "MEDIUM");
    assert.equal(result.classification.label, "Unknown Domain");
  });

  test("unknown possible non-Safari block promoted to known MEDIUM", () => {
    const block = makeBlock({ isPossibleBlock: true, isSafariAbort: false });
    const [result] = computeDisplayBlocks([block], {});
    assert.equal(result.classification.known, true);
    assert.equal(result.classification.confidence, "MEDIUM");
  });

  test("Safari abort (isSafariAbort=true) stays unverified/unknown", () => {
    const block = makeBlock({ isPossibleBlock: true, isSafariAbort: true });
    const [result] = computeDisplayBlocks([block], {});
    assert.equal(result.classification.known, false, "Safari aborts should not be promoted");
  });

  test("plain unknown block with no flags stays unknown", () => {
    const block = makeBlock();
    const [result] = computeDisplayBlocks([block], {});
    assert.equal(result.classification.known, false);
    assert.equal(result.classification.label, "Unknown Domain");
  });
});

describe("computeDisplayBlocks — promotion priority", () => {
  test("blocklist cache takes priority over definite-block promotion", () => {
    // Both conditions true — cache label should win
    const block = makeBlock({ domain: "x.com", isDefiniteBlock: true });
    const cache = { "x.com": [{ name: "HaGeZi Pro" }] };
    const [result] = computeDisplayBlocks([block], cache);
    assert.equal(result.classification.label, "Confirmed by DNS logs");
  });
});

// ── computeDisplayBlocks — second render safety (regression test) ─────────────

describe("computeDisplayBlocks — second render idempotency (regression)", () => {
  test("calling twice with same input produces same output", () => {
    // This is the core regression: the old code mutated blocks on the first call,
    // so the second call (after fetchBlocklistReasons resolved) produced different results.
    const blocks = [
      makeBlock({ domain: "ads.example.com", isDefiniteBlock: true }),
      makeBlock({ domain: "safe.example.com", isPossibleBlock: true, isSafariAbort: true }),
    ];
    const cache = { "ads.example.com": [{ name: "EasyList" }] };

    const first  = computeDisplayBlocks(blocks, cache);
    const second = computeDisplayBlocks(blocks, cache);

    assert.deepEqual(first, second, "two renders with same input must produce identical output");
  });

  test("cache miss then cache hit produces correct promoted result on second render", () => {
    const blocks = [makeBlock({ domain: "tracker.com", isDefiniteBlock: true })];

    // First render — cache empty
    const [first] = computeDisplayBlocks(blocks, {});
    assert.equal(first.classification.label, "Unknown Domain");

    // Second render — cache populated (simulates fetchBlocklistReasons resolving)
    const cache = { "tracker.com": [{ name: "Steven Black" }] };
    const [second] = computeDisplayBlocks(blocks, cache);
    assert.equal(second.classification.label, "Confirmed by DNS logs");

    // Original block untouched throughout
    assert.equal(blocks[0].classification.known, false, "original block must still be unknown");
  });
});

// ── computeDisplayBlocks — multi-block array ──────────────────────────────────

describe("computeDisplayBlocks — array handling", () => {
  test("empty array returns empty array", () => {
    const result = computeDisplayBlocks([], {});
    assert.deepEqual(result, []);
  });

  test("preserves all blocks in output", () => {
    const blocks = [
      makeBlock({ domain: "a.com" }),
      makeBlock({ domain: "b.com" }),
      makeBlock({ domain: "c.com" }),
    ];
    const result = computeDisplayBlocks(blocks, {});
    assert.equal(result.length, 3);
  });

  test("non-targeted blocks are passed through unchanged", () => {
    const blocks = [
      makeBlock({ domain: "a.com", classification: { known: true, label: "Ads", confidence: "HIGH", category: "ads" } }),
      makeBlock({ domain: "b.com", isDefiniteBlock: true }),
    ];
    const result = computeDisplayBlocks(blocks, {});
    assert.equal(result[0].classification.label, "Ads");
    assert.equal(result[1].classification.label, "Unknown Domain");
    assert.equal(result[1].classification.known, true);
  });
});
