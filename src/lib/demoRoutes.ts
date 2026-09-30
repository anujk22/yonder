export const DEMO_SCREEN_NAMES = [
  "ask/index",
  "ask/place",
  "ask/options",
  "ask/compile",
  "ask/status",
  "ask/rejected",
  "ask/vendor",
  "ask/answer/[id]",
  "observe/task/[id]",
  "observe/approach",
  "observe/capture",
  "observe/evidence",
  "observe/verifying",
  "observe/earned",
] as const;

export const CORE_SCREEN_NAMES = ["activity", "observe/index"] as const;
export const LIVE_SCREEN_NAMES = ["live/index", "live/new", "live/[id]"] as const;
