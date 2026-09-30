import { Platform } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useLiveAuth } from "./liveAuth";

// OneSignal push: "your check was answered" and other check updates.
// Needs a native build and EXPO_PUBLIC_ONESIGNAL_APP_ID (a public identifier, not a secret).
const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
export const pushAvailable = Boolean(appId) && Platform.OS !== "web" && Constants.appOwnership !== "expo";

const sdk = () => import("react-native-onesignal").then((module) => module.OneSignal);

/** Starts OneSignal, links the device to the signed-in account and opens checks from notifications. */
export function observePush() {
  if (!pushAvailable) return () => {};
  let disposed = false;
  let unsubscribe = () => {};
  void sdk().then((OneSignal) => {
    if (disposed) return;
    OneSignal.initialize(appId!);
    const identify = (userId: string | null | undefined) => (userId ? OneSignal.login(userId) : OneSignal.logout());
    identify(useLiveAuth.getState().user?.id);
    const stopAuth = useLiveAuth.subscribe((state, previous) => {
      if (state.ready && state.user?.id !== previous.user?.id) identify(state.user?.id);
    });
    const open = (event: { notification: { additionalData?: object } }) => {
      const checkId = (event.notification.additionalData as { check_id?: unknown } | undefined)?.check_id;
      if (typeof checkId === "string") router.push(`/live/${checkId}`);
    };
    OneSignal.Notifications.addEventListener("click", open);
    unsubscribe = () => { stopAuth(); OneSignal.Notifications.removeEventListener("click", open); };
  }).catch(() => undefined);
  return () => { disposed = true; unsubscribe(); };
}

/** Asks once, right after someone posts a check, when the reason is obvious. */
export async function askForPushAfterFirstCheck() {
  if (!pushAvailable) return;
  try {
    const OneSignal = await sdk();
    if (await OneSignal.Notifications.canRequestPermission()) await OneSignal.Notifications.requestPermission(false);
  } catch {}
}
