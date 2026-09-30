import { create } from "zustand";
import type { CustomerInfo } from "react-native-purchases";
import { hasPlus, identifyPurchaser, purchaseClient, purchasesAvailable } from "./purchases";
import { useLiveAuth } from "./liveAuth";

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

/** Follows the store's customer info and keeps the purchaser in step with the signed-in account. */
export function observePurchases() {
  if (!purchasesAvailable) return () => {};
  let disposed = false;
  let removeListener = () => {};
  const accept = (info: CustomerInfo) => { if (!disposed) usePurchaseStore.getState().accept(info); };
  const fail = () => { if (!disposed) usePurchaseStore.setState({ ready: true, error: "We couldn’t check Yonder Plus. Try Restore purchases in Settings." }); };
  const identify = (userId: string | null) => identifyPurchaser(userId).then(accept, fail);
  void purchaseClient().then((client) => {
    if (disposed) return;
    client.addCustomerInfoUpdateListener(accept);
    removeListener = () => client.removeCustomerInfoUpdateListener(accept);
    return identify(useLiveAuth.getState().user?.id ?? null);
  }, fail);
  const unsubscribe = useLiveAuth.subscribe((state, previous) => {
    if (state.ready && state.user?.id !== previous.user?.id) void identify(state.user?.id ?? null);
  });
  return () => { disposed = true; removeListener(); unsubscribe(); };
}
