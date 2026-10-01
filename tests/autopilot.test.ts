import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { createStore } from "zustand/vanilla";
import type { TakeReport } from "../src/lib/autopilot";

type Result = { report: TakeReport; stopped?: string };
type Autopilot = {
  startFilmTake: (confirmed: () => boolean) => Promise<Result>;
  abortAutopilot: (reason: string) => void;
  attachAutopilotHost: (host: { getPathname: () => string; resetForTake: () => void }) => void;
  registerAutopilotTarget: (id: string, target: { press: () => void; measure: () => Promise<null> }) => void;
};

function loadTake({ existingPlus = false, purchaseAfterMs = 65_000, serverAfterMs = 20_000, showPurchase = true, showBenefits = true, benefitDelayMs = 0, available = true } = {}) {
  let time = 0;
  let timerId = 0;
  let purchaseAt: number | null = null;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const taps: { id: string; at: number }[] = [];
  const serverChecks: number[] = [];
  const clientPlus = () => existingPlus || (purchaseAt !== null && time >= purchaseAt + purchaseAfterMs);
  const serverPlus = () => clientPlus() && (existingPlus ? time >= serverAfterMs : time >= purchaseAt! + purchaseAfterMs + serverAfterMs);
  const exports = {} as Autopilot;
  const schedule = (callback: () => void, duration: number) => {
    const id = ++timerId;
    timers.set(id, { at: time + Math.max(0, duration), callback });
    return id;
  };
  const source = readFileSync(new URL("../src/lib/autopilot.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, AbortController, performance: { now: () => time }, console: { log() {}, warn() {} },
    setTimeout: schedule,
    clearTimeout: (id: number) => timers.delete(id),
    require: (name: string) => {
      if (name === "react" || name === "expo-router") return {};
      if (name === "zustand") return { create: createStore };
      if (name === "./previewFeatures") return { DEMO_FEATURES_ENABLED: available };
      if (name === "./liveApi") return { getServerPlus: async () => { serverChecks.push(time); return serverPlus(); } };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  exports.attachAutopilotHost({ getPathname: () => "/", resetForTake: () => {} });
  const ids = [
    "onboarding-next", "onboarding-later", "explore-tour", "explore-local-demo", "ask-prompt-0", "ask-bounty-up",
    "ask-submit", "options-dispatch", "options-pay", "status-observe", "task-demo", "approach-capture", "capture-shutter",
    "nav-explore", "explore-all-places", "explore-result:unionsq", "explore-ask-live:unionsq", "live-kind-accessibility",
    "live-deadline-15", "live-send", "live-public-confirm", "header-settings", "settings-plus", "nav-explore-return",
  ];
  if (showPurchase) ids.push("plus-start");
  if (showBenefits && !benefitDelayMs) ids.push("live-deadline-120");
  const register = (id: string) => exports.registerAutopilotTarget(id, {
    measure: async () => null,
    press: () => {
      taps.push({ id, at: time });
      if (id === "plus-start") purchaseAt = time;
      if (id === "explore-ask-live:unionsq" && showBenefits && benefitDelayMs && taps.some((tap) => tap.id === "nav-explore-return")) {
        schedule(() => register("live-deadline-120"), benefitDelayMs);
      }
    },
  });
  ids.forEach(register);
  const finish = async (promise: Promise<Result>, cancelAt?: number) => {
    let result: Result | undefined;
    void promise.then((value) => { result = value; });
    while (!result) {
      // Drain the take's async work before moving its simulated clock to the next timer.
      await new Promise<void>((resolve) => setImmediate(resolve));
      if (result) break;
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      assert.ok(next, "The take must finish or schedule its next action.");
      assert.ok(next[1].at < 500_000, "The take must have a bounded wait.");
      time = next[1].at;
      timers.delete(next[0]);
      if (cancelAt !== undefined && time >= cancelAt) exports.abortAutopilot("Cancelled while confirming Plus.");
      next[1].callback();
    }
    return result!;
  };
  return { run: (cancelAt?: number) => finish(exports.startFilmTake(clientPlus), cancelAt), taps, serverChecks };
}

test("a first purchase waits for Apple authentication beyond 30 seconds and then for server Plus", async () => {
  const take = loadTake({ benefitDelayMs: 1200 });
  const result = await take.run();
  assert.equal(result.stopped, undefined);
  const purchased = take.taps.find((tap) => tap.id === "plus-start")!;
  assert.ok(purchased);
  const confirmed = result.report.find((row) => row.label === "Plus entitlement confirmed")!;
  assert.ok(confirmed.actualS! >= 157, "Apple authentication lasts 65 seconds after the purchase tap.");
  const returned = take.taps.find((tap) => tap.id === "nav-explore-return")!;
  assert.ok(returned.at >= purchased.at + 85_000, "Benefits must wait for the server, not a truthy Promise.");
  assert.ok(take.serverChecks.length > 1);
  assert.ok(take.serverChecks.every((at, index) => index === 0 || at - take.serverChecks[index - 1] >= 1500));
  assert.ok(take.taps.some((tap) => tap.id === "live-send"));
  assert.ok(result.report.some((row) => row.label === "Show 1 hr and 2 hr" && row.actualS !== null));
});

test("an existing Plus entitlement skips only the absent purchase tap and completes the whole replay", async () => {
  const take = loadTake({ existingPlus: true, showPurchase: false, serverAfterMs: 110_000 });
  const result = await take.run();
  assert.equal(result.stopped, undefined);
  const skipped = result.report.filter((row) => row.actualS === null);
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].label, "Start 1 week free");
  assert.equal(skipped[0].note, "existing Plus entitlement, purchase skipped");
  assert.equal(take.taps.some((tap) => tap.id === "plus-start"), false);
  for (const id of ["onboarding-next", "explore-local-demo", "capture-shutter", "live-send", "settings-plus", "nav-explore-return"]) {
    assert.ok(take.taps.some((tap) => tap.id === id), `${id} must still run.`);
  }
  assert.ok(take.taps.find((tap) => tap.id === "nav-explore-return")!.at >= 110_000);
  assert.ok(result.report.some((row) => row.label === "Show 1 hr and 2 hr" && row.actualS !== null));
});

test("a missing purchase button cannot be skipped without a Plus entitlement", async () => {
  const take = loadTake({ showPurchase: false });
  const result = await take.run();
  assert.match(result.stopped!, /Couldn't find "Start 1 week free"/);
  assert.equal(take.serverChecks.length, 0);
  assert.equal(take.taps.some((tap) => tap.id === "nav-explore-return"), false);
});

test("unconfirmed purchases and server entitlements stop before Plus benefits", async () => {
  for (const [options, failure] of [
    [{ purchaseAfterMs: Infinity }, /Plus entitlement confirmed didn't happen within 180 s/],
    [{ existingPlus: true, showPurchase: false, serverAfterMs: Infinity }, /Plus confirmed on Yonder’s server didn't happen within 90 s/],
  ] as const) {
    const take = loadTake(options);
    const result = await take.run();
    assert.match(result.stopped!, failure);
    assert.equal(take.taps.some((tap) => tap.id === "nav-explore-return"), false);
  }
});

test("the longer Apple confirmation wait remains cancelable", async () => {
  const take = loadTake({ purchaseAfterMs: Infinity });
  const result = await take.run(140_000);
  assert.equal(result.stopped, "Cancelled while confirming Plus.");
  assert.equal(take.serverChecks.length, 0);
  assert.equal(take.taps.some((tap) => tap.id === "nav-explore-return"), false);
});

test("a replay still requires the actual two-hour benefit target", async () => {
  const take = loadTake({ existingPlus: true, showPurchase: false, showBenefits: false });
  const result = await take.run();
  assert.match(result.stopped!, /Couldn't find "Show 1 hr and 2 hr"/);
});

test("demo takes remain unavailable outside preview builds", async () => {
  const take = loadTake({ available: false });
  const result = await take.run();
  assert.match(result.stopped!, /only runs in a build with the demo screens/);
  assert.equal(take.taps.length, 0);
  assert.equal(take.serverChecks.length, 0);
});
