import type { ConfigContext, ExpoConfig } from "expo/config";

// app.json holds the config; this only adds OneSignal with the APNs environment matching the build.
// Without a OneSignal App ID push can't work, so the plugin (and its push entitlement) is left out.
const pushEnabled = Boolean(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    ...(pushEnabled ? [["onesignal-expo-plugin", {
      mode: process.env.EAS_BUILD_PROFILE?.startsWith("production") || process.env.EAS_BUILD_PROFILE === "testflight-preview" ? "production" : "development",
      disableNSE: true,
      disableLocation: true,
    }] as [string, object]] : []),
  ],
});
