export type PurchaseEnvironment = {
  platform: string;
  development: boolean;
  expoGo: boolean;
  appleKey?: string;
  googleKey?: string;
  testKey?: string;
};

export function purchaseKey(env: PurchaseEnvironment): string | null {
  if (env.expoGo || !["ios", "android"].includes(env.platform)) return null;
  if (env.development && env.testKey?.startsWith("test_")) return env.testKey;
  const key = env.platform === "ios" ? env.appleKey : env.googleKey;
  const prefix = env.platform === "ios" ? "appl_" : "goog_";
  return key?.startsWith(prefix) ? key : null;
}

export function purchaseWasCancelled(error: unknown): boolean {
  return typeof error === "object" && error !== null &&
    "userCancelled" in error && error.userCancelled === true;
}

type IntroPrice = { price: number; periodNumberOfUnits: number; periodUnit: string } | null;

/** "1 week free", "3 days free", or null when the product has no free trial. */
export function freeTrialLabel(intro: IntroPrice) {
  if (!intro || intro.price !== 0 || intro.periodNumberOfUnits < 1) return null;
  const unit = intro.periodUnit.toLowerCase();
  const n = intro.periodNumberOfUnits;
  return `${n} ${unit}${n === 1 ? "" : "s"} free`;
}
