import { RefObject, useEffect } from 'react';
import { useIsFocused } from 'expo-router';

import { DEMO_FLAGS } from '@/lib/demoFlags';
import { Mode } from '@/lib/places';

const DURATION = {
  resetSettleMs: 250,
  characterMs: 45,
  targetTimeoutMs: 2000,
  navigationTimeoutMs: 2400,
  pollMs: 40,
  transitionSettleMs: 550,
  modeRevealSettleMs: 850,
  landingDwellMs: 2000,
  askIntroMs: 350,
  searchTypedMs: 350,
  resultsMs: 900,
  pinMs: 2000,
  questionPauseMs: 1100,
  bountyMs: 1500,
  compileMs: 3200,
  optionsMs: 1900,
  statusMs: 6200,
  taskListMs: 1900,
  taskDetailMs: 2200,
  approachMs: 3700,
  reticleMs: 2200,
  filmstripMs: 800,
  verifyingAndEarnedMs: 6200,
  earnedMs: 2400,
  answerMs: 7200,
  tierOptionsMs: 3000,
  cachedAnswerMs: 3500,
} as const;

export const AUTOPILOT_FILMSTRIP_DWELL_MS = DURATION.filmstripMs;

type Step =
  | { type: 'navigate'; route: string }
  | { type: 'tap'; target: string }
  | { type: 'type'; target: string; value: string }
  | { type: 'wait'; durationMs: number }
  | { type: 'setMode'; mode: Mode };

export const STEPS: readonly Step[] = [
  { type: 'wait', durationMs: DURATION.landingDwellMs },
  { type: 'tap', target: 'landing-ask' },
  { type: 'wait', durationMs: DURATION.askIntroMs },
  { type: 'type', target: 'ask-search', value: 'Park' },
  { type: 'wait', durationMs: DURATION.searchTypedMs },
  { type: 'wait', durationMs: DURATION.resultsMs },
  { type: 'tap', target: 'ask-result-pier2' },
  { type: 'wait', durationMs: DURATION.pinMs },
  { type: 'type', target: 'ask-question', value: 'Are any basketball courts free?' },
  { type: 'wait', durationMs: DURATION.questionPauseMs },
  { type: 'wait', durationMs: DURATION.bountyMs },
  { type: 'tap', target: 'ask-submit' },
  { type: 'wait', durationMs: DURATION.compileMs },
  { type: 'tap', target: 'compile-continue' },
  { type: 'wait', durationMs: DURATION.optionsMs },
  { type: 'tap', target: 'options-dispatch' },
  { type: 'wait', durationMs: DURATION.statusMs },
  { type: 'setMode', mode: 'observe' },
  { type: 'wait', durationMs: DURATION.taskListMs },
  { type: 'tap', target: 'observe-task-top' },
  { type: 'wait', durationMs: DURATION.taskDetailMs },
  { type: 'tap', target: 'task-accept' },
  { type: 'wait', durationMs: DURATION.approachMs },
  { type: 'tap', target: 'approach-capture' },
  { type: 'wait', durationMs: DURATION.reticleMs },
  { type: 'tap', target: 'capture-shutter' },
  { type: 'wait', durationMs: DURATION.verifyingAndEarnedMs },
  { type: 'wait', durationMs: DURATION.earnedMs },
  { type: 'setMode', mode: 'ask' },
  { type: 'wait', durationMs: DURATION.answerMs },
  { type: 'navigate', route: '/ask?autopilotDuplicate=1' },
  { type: 'wait', durationMs: DURATION.tierOptionsMs },
  { type: 'tap', target: 'options-recent' },
  { type: 'wait', durationMs: DURATION.cachedAnswerMs },
] as const;

type Frame = { x: number; y: number; width: number; height: number };

type AutopilotTarget = {
  press?: () => void | Promise<void>;
  input?: (value: string) => void;
  focus?: () => void;
  complete?: (value: string) => void | Promise<void>;
  measure?: () => Promise<Frame | null>;
};

type AutopilotHost = {
  getPathname: () => string;
  navigate: (route: string) => void;
  reset: () => void;
  showRipple: (frame: Frame) => void;
};

type Measurable = { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void };

const targets = new Map<string, AutopilotTarget>();
const abortHandlers = new Set<() => void>();
let host: AutopilotHost | null = null;
let activeRun: AbortController | null = null;

const delay = (durationMs: number, signal: AbortSignal) => new Promise<boolean>((resolve) => {
  if (signal.aborted) {
    resolve(false);
    return;
  }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', cancel);
    resolve(true);
  }, durationMs);
  const cancel = () => {
    clearTimeout(timer);
    resolve(false);
  };
  signal.addEventListener('abort', cancel, { once: true });
});

const waitUntil = async (predicate: () => boolean, timeoutMs: number, signal: AbortSignal) => {
  const startedAt = Date.now();
  while (!signal.aborted && Date.now() - startedAt < timeoutMs) {
    if (predicate()) return true;
    if (!(await delay(DURATION.pollMs, signal))) return false;
  }
  return false;
};

const waitForTarget = async (id: string, signal: AbortSignal) => {
  const mounted = await waitUntil(() => targets.has(id), DURATION.targetTimeoutMs, signal);
  if (!mounted) console.warn(`[autopilot] skipped missing target: ${id}`);
  return mounted ? targets.get(id) ?? null : null;
};

export const registerAutopilotAbortHandler = (handler: () => void) => {
  if (!DEMO_FLAGS.autopilotEnabled) return () => undefined;
  abortHandlers.add(handler);
  return () => abortHandlers.delete(handler);
};

export const waitForAutopilotDelay = (durationMs: number) => {
  const signal = activeRun?.signal;
  if (!signal) return new Promise<boolean>((resolve) => setTimeout(() => resolve(true), durationMs));
  return delay(durationMs, signal);
};

const tapTarget = async (id: string, signal: AbortSignal, waitForUnmount = true) => {
  const target = await waitForTarget(id, signal);
  if (!target?.press || signal.aborted) return;
  const startingPath = host?.getPathname();
  const frame = await target.measure?.();
  if (frame) host?.showRipple(frame);
  try {
    await target.press();
  } catch (error) {
    if (!signal.aborted) console.warn(`[autopilot] misfired tap: ${id}`, error);
    return;
  }
  if (waitForUnmount) {
    const transitioned = await waitUntil(
      () => startingPath !== undefined
        ? host?.getPathname() !== startingPath
        : targets.get(id) !== target,
      DURATION.navigationTimeoutMs,
      signal,
    );
    if (!transitioned && !signal.aborted) console.warn(`[autopilot] target did not transition: ${id}`);
  }
  await delay(DURATION.transitionSettleMs, signal);
};

const typeTarget = async (id: string, value: string, signal: AbortSignal) => {
  const target = await waitForTarget(id, signal);
  if (!target?.input || signal.aborted) return;
  target.focus?.();
  let typed = '';
  for (const character of value) {
    typed += character;
    target.input(typed);
    if (!(await delay(DURATION.characterMs, signal))) return;
  }
  await target.complete?.(value);
};

export const registerAutopilotTarget = (id: string, target: AutopilotTarget) => {
  if (!DEMO_FLAGS.autopilotEnabled) return () => undefined;
  targets.set(id, target);
  return () => {
    if (targets.get(id) === target) targets.delete(id);
  };
};

export const measureAutopilotRef = (ref: RefObject<Measurable | null>) => new Promise<Frame | null>((resolve) => {
  if (!ref.current) {
    resolve(null);
    return;
  }
  ref.current.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
});

export const useAutopilotPressTarget = (id: string | undefined, ref: RefObject<Measurable | null>, press: () => void | Promise<void>) => {
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused || !id || !DEMO_FLAGS.autopilotEnabled) return undefined;
    return registerAutopilotTarget(id, { press, measure: () => measureAutopilotRef(ref) });
  }, [id, isFocused, press, ref]);
};

export const useAutopilotTextTarget = (
  id: string,
  ref: RefObject<Measurable | null>,
  input: (value: string) => void,
  complete?: (value: string) => void | Promise<void>,
) => {
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused || !DEMO_FLAGS.autopilotEnabled) return undefined;
    return registerAutopilotTarget(id, {
      input,
      complete,
      focus: () => (ref.current as Measurable & { focus?: () => void } | null)?.focus?.(),
      measure: () => measureAutopilotRef(ref),
    });
  }, [complete, id, input, isFocused, ref]);
};

export const attachAutopilotHost = (nextHost: AutopilotHost) => {
  host = nextHost;
  return () => {
    if (host === nextHost) host = null;
  };
};

export const isAutopilotRunning = () => activeRun !== null && !activeRun.signal.aborted;

export const abortAutopilot = () => {
  if (!activeRun) return;
  activeRun.abort();
  activeRun = null;
  [...abortHandlers].forEach((handler) => handler());
};

export async function runAutopilot(signal: AbortSignal) {
  for (const [index, step] of STEPS.entries()) {
    if (signal.aborted) return;
    try {
      if (step.type === 'wait') {
        await delay(step.durationMs, signal);
      } else if (step.type === 'type') {
        await typeTarget(step.target, step.value, signal);
      } else if (step.type === 'tap') {
        await tapTarget(step.target, signal);
      } else if (step.type === 'setMode') {
        await tapTarget(`mode-${step.mode}`, signal, false);
        const expectedPrefix = step.mode === 'ask' ? '/ask' : '/observe';
        const navigated = await waitUntil(
          () => host?.getPathname().startsWith(expectedPrefix) ?? false,
          DURATION.navigationTimeoutMs,
          signal,
        );
        if (!navigated && !signal.aborted) console.warn(`[autopilot] navigation did not settle: ${expectedPrefix}`);
        await delay(DURATION.modeRevealSettleMs, signal);
      } else {
        const expectedPath = step.route.includes('autopilotDuplicate=1')
          ? '/ask/options'
          : step.route.split('?')[0];
        host?.navigate(step.route);
        const navigated = await waitUntil(() => host?.getPathname() === expectedPath, DURATION.navigationTimeoutMs, signal);
        if (!navigated && !signal.aborted) console.warn(`[autopilot] navigation did not settle: ${step.route}`);
        await delay(DURATION.transitionSettleMs, signal);
      }
    } catch (error) {
      if (!signal.aborted) console.warn(`[autopilot] misfired step ${index + 1}`, error);
    }
  }
}

export const startAutopilot = async () => {
  if (!DEMO_FLAGS.autopilotEnabled || !host || isAutopilotRunning()) return;
  const run = new AbortController();
  activeRun = run;
  try {
    host.reset();
    if (await delay(DURATION.resetSettleMs, run.signal)) await runAutopilot(run.signal);
  } catch (error) {
    if (!run.signal.aborted) console.warn('[autopilot] run failed', error);
  } finally {
    if (activeRun === run) activeRun = null;
  }
};
