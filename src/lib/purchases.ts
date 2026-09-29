import { Platform } from "react-native";
import Constants from "expo-constants";
import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import { purchaseKey } from "./purchasePolicy";

export const PLUS_ENTITLEMENT = "yonder_plus";
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

export const hasPlus = (info: CustomerInfo) => Boolean(info.entitlements.active[PLUS_ENTITLEMENT]);

export async function loadPurchaseOptions() {
  const client = await purchaseClient();
  const [info, offerings] = await Promise.all([client.getCustomerInfo(), client.getOfferings()]);
  return { info, packages: offerings.current?.availablePackages ?? [] };
}

export async function buyPackage(option: PurchasesPackage) {
  const client = await purchaseClient();
  return (await client.purchasePackage(option)).customerInfo;
}

export async function restorePurchase() {
  return (await purchaseClient()).restorePurchases();
}
