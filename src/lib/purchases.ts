import { Platform } from "react-native";
import Constants from "expo-constants";
import type { PurchasesPackage } from "react-native-purchases";
import { purchaseKey } from "./purchasePolicy";

// Consumable product for unlocking the most recent answer to a question.
// Configure it in RevenueCat and add it to the current offering.
export const RECENT_ANSWER_PRODUCT = "yonder_recent_answer";
const apiKey = purchaseKey({
  platform: Platform.OS,
  development: __DEV__,
  expoGo: Constants.appOwnership === "expo",
  appleKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY,
  googleKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY,
  testKey: process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY,
});

export const purchasesAvailable = Boolean(apiKey);
export const testPurchases = Boolean(apiKey?.startsWith("test_"));
let initialization: Promise<typeof import("react-native-purchases").default> | undefined;

export function purchaseClient() {
  if (!apiKey) return Promise.reject(new Error("Purchases are unavailable in this build."));
  if (!initialization) {
    initialization = import("react-native-purchases").then(async ({ default: Purchases }) => {
      if (!(await Purchases.isConfigured())) {
        await Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
        Purchases.configure({ apiKey });
      }
      return Purchases;
    }).catch((error: unknown) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

/** The recent-answer package from the current offering, or null if it isn't set up. */
export async function loadRecentAnswerPackage() {
  const client = await purchaseClient();
  const offerings = await client.getOfferings();
  return offerings.current?.availablePackages.find((item) => item.product.identifier === RECENT_ANSWER_PRODUCT) ?? null;
}

/** Buys one recent answer. Resolves with the store transaction id once the purchase succeeds. */
export async function buyRecentAnswer(option: PurchasesPackage) {
  const client = await purchaseClient();
  const { transaction } = await client.purchasePackage(option);
  return transaction.transactionIdentifier;
}
