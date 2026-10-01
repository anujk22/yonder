import { RefObject, useEffect, useRef } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { useIsFocused } from 'expo-router';
import { create } from 'zustand';
import { DEMO_FEATURES_ENABLED } from './previewFeatures';
import { getServerPlus } from './liveApi';

/**
 * Recording autopilot for the submission film, started from Settings, "Play the demo". In every build with the demo screens
 * (development, preview and TestFlight preview), never the App Store build, which has no demo
 * screens to play. It taps the real buttons on the script's timestamps
 * (phone time: film time minus 10 s; see docs/shipaton/RECORDING_AUTOPILOT.md).
 */
export const AUTOPILOT_AVAILABLE = DEMO_FEATURES_ENABLED;

/** Kept for the capture screen's frame interval. The film take adds no extra filmstrip dwell. */
export const AUTOPILOT_FILMSTRIP_DWELL_MS = 800;

export type Frame = { x: number; y: number; width: number; height: number };

type Measurable = { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void };

type AutopilotTarget = {
  press: () => void | Promise<void>;
  measure: () => Promise<Frame | null>;
  /** Header, tab bar and onboarding: never inside a scroll view, so never scrolled to. */
  fixed?: boolean;
};

type Scroller = {
  measure: () => Promise<Frame | null>;
  offset: () => number;
  maxOffset: () => number;
  scrollTo: (y: number) => void;
};

export type AutopilotHost = {
  getPathname: () => string;
  /** Back to a fresh Explore screen with the intro on page one. */
  resetForTake: () => void;
};

type Step = {
  /** Phone time in seconds. */
  at: number;
  label: string;
  tap?: string;
  /** Scroll this target into view without tapping it. */
  reveal?: string;
  /** Skip the step if the target isn't on screen at its mark. */
  optional?: boolean;
  /** Skip an absent target only when its outcome is already verified. */
  skipIfMissing?: () => boolean;
  /** Never tap sooner than this many seconds after the previous tap. */
  minGap?: number;
  /** Taps to try, in order, when `tap` isn't on screen at its mark. */
  fallback?: string[];
  /** Hold here until this is true (the store sheet is confirmed by a person). */
  until?: () => boolean | Promise<boolean>;
  untilTimeout?: number;
  untilPollMs?: number;
};

const DURATION = {
  pollMs: 30,
  armLeadS: 1.2,
  settleS: 0.35,
  requiredTimeoutS: 3,
  optionalGraceS: 0.15,
  fallbackGraceS: 0.3,
  rippleLeadMs: 90,
  scrollSettleMs: 420,
  takeStartMs: 700,
  endReportDelayMs: 1500,
} as const;

/** The film timeline. Film time = phone time + 10 s. Keep in step with VIDEO_PLAN.md. */
const takeSteps = (plusConfirmed: () => boolean): Step[] => [
  { at: 10, label: 'Next', tap: 'onboarding-next' },
  { at: 12, label: 'Next', tap: 'onboarding-next' },
  { at: 13.5, label: 'Maybe later', tap: 'onboarding-later' },
  { at: 15, label: 'Take the NYC sample tour', tap: 'explore-tour' },
  { at: 17.5, label: 'Try the local demo', tap: 'explore-local-demo' },
  { at: 19, label: 'Court question', tap: 'ask-prompt-0' },
  { at: 20, label: '+ $0.50', tap: 'ask-bounty-up' },
  { at: 21.5, label: 'See answer options', tap: 'ask-submit' },
  { at: 26, label: 'Post a bounty', tap: 'options-dispatch' },
  { at: 28.5, label: 'Pay $2.50', tap: 'options-pay' },
  { at: 32, label: 'Try the example observer journey', tap: 'status-observe' },
  { at: 41.5, label: 'Explore an example', tap: 'task-demo' },
  { at: 43, label: 'Open demo camera', tap: 'approach-capture' },
  { at: 46, label: 'Capture', tap: 'capture-shutter' },
  { at: 52.5, label: 'Explore tab', tap: 'nav-explore' },
  { at: 53.3, label: 'Take the NYC sample tour (if shown)', tap: 'explore-tour', optional: true },
  { at: 54.3, label: 'All 12 places', tap: 'explore-all-places', minGap: 0.7 },
  { at: 55.3, label: '14 St - Union Sq Station', tap: 'explore-result:unionsq' },
  { at: 61, label: 'Ask for a live check', tap: 'explore-ask-live:unionsq' },
  { at: 62.5, label: 'Step-free entrance or elevator', tap: 'live-kind-accessibility' },
  { at: 63.5, label: '15 min', tap: 'live-deadline-15' },
  { at: 63.8, label: 'Scroll to Send check', reveal: 'live-send' },
  { at: 65.5, label: 'Public place checkbox', tap: 'live-public-confirm' },
  { at: 67, label: 'Send check', tap: 'live-send' },
  { at: 78, label: 'Settings', tap: 'header-settings' },
  { at: 86.5, label: 'Explore Yonder Plus', tap: 'settings-plus' },
  { at: 92, label: 'Start 1 week free', tap: 'plus-start', skipIfMissing: plusConfirmed },
  // 1:33.5: the store sheet is system UI, which no app can press. A person confirms it.
  { at: 97.9, label: 'Plus entitlement confirmed', until: plusConfirmed, untilTimeout: 180 },
  { at: 97.95, label: 'Plus confirmed on Yonder’s server', until: () => getServerPlus().catch(() => false), untilTimeout: 90, untilPollMs: 1500 },
  // Back to the map as it was left, with the Union Sq card still up.
  { at: 98, label: 'Explore tab', tap: 'nav-explore-return', fallback: ['nav-explore'] },
  {
    at: 98.9,
    label: 'Ask for a live check (1 hr / 2 hr)',
    tap: 'explore-ask-live:unionsq',
    fallback: ['explore-tour', 'explore-all-places', 'explore-result:unionsq', 'explore-ask-live:unionsq'],
  },
  { at: 99.7, label: 'Show 1 hr and 2 hr', reveal: 'live-deadline-120' },
  { at: 103, label: 'Explore tab', tap: 'nav-explore' },
];

export const TAKE_LENGTH_S = 107;

const targets = new Map<string, AutopilotTarget>();
const scrollers = new Set<Scroller>();
const abortHandlers = new Set<() => void>();
let host: AutopilotHost | null = null;
let activeRun: AbortController | null = null;

/** Tap marks, drawn by AutopilotLayer and by any modal that covers it. */
export const useAutopilotTouches = create<{ touches: { id: number; x: number; y: number }[] }>(() => ({ touches: [] }));
/** Bumped at the start of every take so screens with local state can start fresh. */
export const useAutopilotTake = create<{ takeId: number }>(() => ({ takeId: 0 }));

let touchId = 0;
const showTouch = (frame: Frame) => {
  const touch = { id: ++touchId, x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
  useAutopilotTouches.setState((state) => ({ touches: [...state.touches.slice(-2), touch] }));
  setTimeout(() => useAutopilotTouches.setState((state) => ({ touches: state.touches.filter((item) => item.id !== touch.id) })), 900);
};

const now = () => performance.now();

const delay = (durationMs: number, signal: AbortSignal) => new Promise<boolean>((resolve) => {
  if (signal.aborted) {
    resolve(false);
    return;
  }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', cancel);
    resolve(true);
  }, Math.max(0, durationMs));
  const cancel = () => {
    clearTimeout(timer);
    resolve(false);
  };
  signal.addEventListener('abort', cancel, { once: true });
});

const waitUntil = async (predicate: () => boolean | Promise<boolean>, timeoutMs: number, signal: AbortSignal, pollMs: number = DURATION.pollMs) => {
  const startedAt = now();
  while (!signal.aborted) {
    if (await predicate()) return !signal.aborted;
    if (now() - startedAt >= timeoutMs) return false;
    if (!(await delay(pollMs, signal))) return false;
  }
  return false;
};

export const measureAutopilotRef = (ref: RefObject<Measurable | null>) => new Promise<Frame | null>((resolve) => {
  const node = ref.current;
  if (!node?.measureInWindow) {
    resolve(null);
    return;
  }
  node.measureInWindow((x, y, width, height) => resolve(width || height ? { x, y, width, height } : null));
});

export const registerAutopilotTarget = (id: string, target: AutopilotTarget) => {
  if (!AUTOPILOT_AVAILABLE) return () => undefined;
  targets.set(id, target);
  return () => {
    if (targets.get(id) === target) targets.delete(id);
  };
};

export const registerAutopilotAbortHandler = (handler: () => void) => {
  if (!AUTOPILOT_AVAILABLE) return () => undefined;
  abortHandlers.add(handler);
  return () => abortHandlers.delete(handler);
};

export const waitForAutopilotDelay = (durationMs: number) => {
  const signal = activeRun?.signal;
  if (!signal) return new Promise<boolean>((resolve) => setTimeout(() => resolve(true), durationMs));
  return delay(durationMs, signal);
};

/** A tap target inside a screen. It only counts while its screen is focused. */
export const useAutopilotPressTarget = (id: string | undefined, ref: RefObject<Measurable | null>, press: () => void | Promise<void>) => {
  const isFocused = useIsFocused();
  const latest = useRef(press);
  useEffect(() => {
    latest.current = press;
  });
  useEffect(() => {
    if (!isFocused || !id || !AUTOPILOT_AVAILABLE) return undefined;
    return registerAutopilotTarget(id, { press: () => latest.current(), measure: () => measureAutopilotRef(ref) });
  }, [id, isFocused, ref]);
};

/** Several tap targets from one list, such as option chips. `refs` (a stable Map) holds each id's pressable. */
export const useAutopilotPressTargets = (
  entries: readonly (readonly [string, () => void])[] | undefined,
  refs: Map<string, Measurable | null>,
) => {
  const isFocused = useIsFocused();
  const latest = useRef(entries);
  useEffect(() => {
    latest.current = entries;
  });
  const key = entries?.map(([id]) => id).join('|') ?? '';
  useEffect(() => {
    if (!AUTOPILOT_AVAILABLE || !isFocused || !key) return undefined;
    const unregister = key.split('|').map((id) => registerAutopilotTarget(id, {
      press: () => latest.current?.find(([entryId]) => entryId === id)?.[1](),
      measure: () => measureAutopilotRef({ current: refs.get(id) ?? null }),
    }));
    return () => unregister.forEach((off) => off());
  }, [isFocused, key, refs]);
};

/** A tap target outside the navigator: the header, the tab bar and the intro. */
export const useAutopilotGlobalTarget = (id: string | undefined, ref: RefObject<Measurable | null>, press: () => void | Promise<void>) => {
  const latest = useRef(press);
  useEffect(() => {
    latest.current = press;
  });
  useEffect(() => {
    if (!id || !AUTOPILOT_AVAILABLE) return undefined;
    return registerAutopilotTarget(id, { press: () => latest.current(), measure: () => measureAutopilotRef(ref), fixed: true });
  }, [id, ref]);
};

/** Props for a ScrollView the autopilot may scroll to bring a target into view. Empty outside dev builds. */
export const useAutopilotScroller = (ref: RefObject<ScrollView | null>) => {
  const isFocused = useIsFocused();
  const state = useRef({ offset: 0, content: 0, viewport: 0 });
  useEffect(() => {
    if (!isFocused || !AUTOPILOT_AVAILABLE) return undefined;
    const scroller: Scroller = {
      measure: () => measureAutopilotRef(ref as unknown as RefObject<Measurable | null>),
      offset: () => state.current.offset,
      maxOffset: () => Math.max(0, state.current.content - state.current.viewport),
      scrollTo: (y) => ref.current?.scrollTo({ y, animated: true }),
    };
    scrollers.add(scroller);
    return () => {
      scrollers.delete(scroller);
    };
  }, [isFocused, ref]);
  if (!AUTOPILOT_AVAILABLE) return {};
  return {
    scrollEventThrottle: 16,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      state.current.offset = event.nativeEvent.contentOffset.y;
    },
    onContentSizeChange: (_width: number, height: number) => {
      state.current.content = height;
    },
    onLayout: (event: LayoutChangeEvent) => {
      state.current.viewport = event.nativeEvent.layout.height;
    },
  };
};

const scrollIntoView = async (target: AutopilotTarget, signal: AbortSignal) => {
  if (target.fixed) return;
  const frame = await target.measure();
  if (!frame) return;
  const centre = frame.x + frame.width / 2;
  const views = await Promise.all([...scrollers].map(async (scroller) => ({ scroller, view: await scroller.measure() })));
  // The innermost scroll view that holds the target's column.
  const holder = views
    .filter(({ view }) => view && centre >= view.x && centre <= view.x + view.width && frame.y >= view.y - 1)
    .sort((a, b) => b.view!.y - a.view!.y)[0];
  if (!holder?.view) return;
  const top = holder.view.y + 12;
  const bottom = holder.view.y + holder.view.height - 16;
  const delta = frame.y + frame.height > bottom ? frame.y + frame.height - bottom : frame.y < top ? frame.y - top : 0;
  if (Math.abs(delta) < 2) return;
  const next = Math.min(holder.scroller.maxOffset(), Math.max(0, holder.scroller.offset() + delta));
  holder.scroller.scrollTo(next);
  await delay(DURATION.scrollSettleMs, signal);
};

const press = async (target: AutopilotTarget, markMs: number, signal: AbortSignal) => {
  if (!(await delay(markMs - DURATION.rippleLeadMs - now(), signal))) return false;
  const frame = await target.measure();
  if (frame) showTouch(frame);
  if (!(await delay(markMs - now(), signal))) return false;
  await target.press();
  return true;
};

export type TakeReport = { label: string; plannedS: number; actualS: number | null; note?: string }[];

export const attachAutopilotHost = (nextHost: AutopilotHost) => {
  host = nextHost;
  return () => {
    if (host === nextHost) host = null;
  };
};

export const isAutopilotRunning = () => activeRun !== null && !activeRun.signal.aborted;

let stopReason = '';
export const abortAutopilot = (reason = 'Stopped with a two-finger touch.') => {
  if (!activeRun) return;
  stopReason = reason;
  activeRun.abort();
  activeRun = null;
  [...abortHandlers].forEach((handler) => handler());
};

class TakeStopped extends Error {}

async function runTake(signal: AbortSignal, startMs: number, steps: Step[], report: TakeReport) {
  const seconds = (ms: number) => Math.round((ms - startMs) / 10) / 100;
  let lastTapMs = startMs;
  let confirmationDelayMs = 0;
  for (const step of steps) {
    if (signal.aborted) return;
    const markMs = startMs + step.at * 1000 + confirmationDelayMs;
    if (step.until) {
      if (!(await delay(markMs - now(), signal))) return;
      const ok = await waitUntil(step.until, (step.untilTimeout ?? 10) * 1000, signal, step.untilPollMs);
      if (signal.aborted) return;
      if (!ok) throw new TakeStopped(`${step.label} didn't happen within ${step.untilTimeout} s.`);
      confirmationDelayMs += Math.max(0, now() - markMs);
      report.push({ label: step.label, plannedS: step.at, actualS: seconds(now()) });
      continue;
    }
    const id = step.tap ?? step.reveal!;
    const armMs = Math.max(lastTapMs + DURATION.settleS * 1000, markMs - DURATION.armLeadS * 1000);
    if (!(await delay(armMs - now(), signal))) return;
    const graceS = step.optional ? DURATION.optionalGraceS : step.fallback ? DURATION.fallbackGraceS : DURATION.requiredTimeoutS;
    const deadline = markMs + graceS * 1000;
    const found = await waitUntil(() => targets.has(id), Math.max(0, deadline - now()), signal);
    if (signal.aborted) return;
    if (!found) {
      if (step.optional || step.skipIfMissing?.()) {
        report.push({ label: step.label, plannedS: step.at, actualS: null, note: step.optional ? 'not shown, skipped' : 'existing Plus entitlement, purchase skipped' });
        continue;
      }
      if (step.fallback) {
        for (const fallbackId of step.fallback) {
          // The tour link only shows on a fresh map, so don't wait long for it.
          const waitMs = fallbackId === 'explore-tour' ? 800 : DURATION.requiredTimeoutS * 1000;
          if (!(await waitUntil(() => targets.has(fallbackId), waitMs, signal))) {
            if (fallbackId === 'explore-tour') continue;
            throw new TakeStopped(`Couldn't find "${step.label}".`);
          }
          const target = targets.get(fallbackId)!;
          await scrollIntoView(target, signal);
          const tapMs = Math.max(now() + DURATION.rippleLeadMs, lastTapMs + 600);
          if (!(await press(target, tapMs, signal))) return;
          lastTapMs = tapMs;
        }
        report.push({ label: step.label, plannedS: step.at, actualS: seconds(lastTapMs), note: 'took the fallback path' });
        continue;
      }
      throw new TakeStopped(`Couldn't find "${step.label}" on screen.`);
    }
    const target = targets.get(id)!;
    await scrollIntoView(target, signal);
    if (step.reveal) {
      report.push({ label: step.label, plannedS: step.at, actualS: seconds(now()) });
      continue;
    }
    const earliest = lastTapMs + (step.minGap ?? 0) * 1000;
    const tapMs = Math.max(markMs, earliest, now() + DURATION.rippleLeadMs);
    // The target may have re-registered while we waited (a re-render); use the latest one.
    if (!(await press(targets.get(id) ?? target, tapMs, signal))) return;
    lastTapMs = tapMs;
    report.push({ label: step.label, plannedS: step.at, actualS: seconds(tapMs) });
  }
  await delay(startMs + TAKE_LENGTH_S * 1000 + confirmationDelayMs - now(), signal);
}

/**
 * Runs the whole film take. Resolves with the report; `stopped` is set if it didn't finish.
 * T+0:00 is the moment the intro's first page is back on screen.
 */
export async function startFilmTake(plusConfirmed: () => boolean): Promise<{ report: TakeReport; stopped?: string }> {
  const report: TakeReport = [];
  if (!AUTOPILOT_AVAILABLE || !host) return { report, stopped: 'The autopilot only runs in a build with the demo screens.' };
  if (isAutopilotRunning()) return { report, stopped: 'A take is already running.' };
  const run = new AbortController();
  activeRun = run;
  stopReason = '';
  try {
    useAutopilotTake.setState((state) => ({ takeId: state.takeId + 1 }));
    host.resetForTake();
    if (!(await delay(DURATION.takeStartMs, run.signal))) return { report, stopped: stopReason };
    const startMs = now();
    console.log('[autopilot] take started: T+0:00');
    await runTake(run.signal, startMs, takeSteps(plusConfirmed), report);
    if (run.signal.aborted) return { report, stopped: stopReason || 'Stopped.' };
    console.log('[autopilot] take complete', report);
    await delay(DURATION.endReportDelayMs, run.signal);
    return { report };
  } catch (error) {
    const reason = error instanceof TakeStopped ? error.message : `Something went wrong: ${error instanceof Error ? error.message : String(error)}`;
    console.warn('[autopilot] take stopped:', reason, report);
    return { report, stopped: reason };
  } finally {
    if (activeRun === run) activeRun = null;
  }
}

export const formatTakeReport = (report: TakeReport) => report.map((row) => {
  const time = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
  if (row.actualS === null) return `${time(row.plannedS)} ${row.label}: ${row.note}`;
  const drift = row.actualS - row.plannedS;
  return `${time(row.plannedS)} ${row.label}: ${drift >= 0 ? '+' : ''}${drift.toFixed(2)} s${row.note ? ` (${row.note})` : ''}`;
}).join('\n');
