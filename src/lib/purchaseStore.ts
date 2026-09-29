import { create } from "zustand";
import type { CustomerInfo } from "react-native-purchases";
import { hasPlus, purchaseClient, purchasesAvailable } from "./purchases";

export const usePurchaseStore = create<{
  plus: boolean;
  ready: boolean;
  error: string;
  accept: (info: CustomerInfo) => void;
}>((set) => ({
  plus: false,
  ready: !purchasesAvailable,
  error: "",
  accept: (info) => set({ plus: hasPlus(info), ready: true, error: "" }),
}));

export async function observePurchases(onDispose: (dispose: () => void) => void) {
  if (!purchasesAvailable) return;
  try {
    const client = await purchaseClient();
    const accept = usePurchaseStore.getState().accept;
    client.addCustomerInfoUpdateListener(accept);
    onDispose(() => { client.removeCustomerInfoUpdateListener(accept); });
    accept(await client.getCustomerInfo());
  } catch {
    usePurchaseStore.setState({ ready: true, error: "We couldn’t check your purchase. Try Restore purchases in Yonder Plus." });
  }
}
