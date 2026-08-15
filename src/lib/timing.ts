import { DEMO_FLAGS } from '@/lib/demoFlags';

// DEMO: deterministic path for recording. Real implementation below.
const timingScale = DEMO_FLAGS.fastTiming ? 0.5 : 1;

export const TIMING = {
  splashMarkInMs: 380 * timingScale,
  splashPulseMs: 520 * timingScale,
  compileMs: 900 * timingScale,
  statusSteps: [0, 1400, 2600, 4000, 5400].map((value) => value * timingScale),
  approachMs: 2500 * timingScale,
  reticleLockMs: 1200 * timingScale,
  frameIntervalMs: 700 * timingScale,
  verifySteps: [0, 800, 1600, 2600, 3400].map((value) => value * timingScale),
  verifyTotalMs: 4000 * timingScale,
  modeRevealMs: 520 * timingScale,
  modeSwapAtMs: 300 * timingScale,
  modeFadeOutMs: 240 * timingScale,
  rawDeleteSeconds: 60 * timingScale,
} as const;
