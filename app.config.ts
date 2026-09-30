import type { ConfigContext, ExpoConfig } from "expo/config";

// app.json holds the config; this only adds OneSignal with the APNs environment matching the build.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    ["onesignal-expo-plugin", {
      mode: process.env.EAS_BUILD_PROFILE === "production" ? "production" : "development",
      disableNSE: true,
      disableLocation: true,
    }],
  ],
});
