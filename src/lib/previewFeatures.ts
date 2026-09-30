import { liveConfigured } from "./liveClient";
import { featurePreviewEnabled } from "./previewPolicy";

export const DEMO_FEATURES_ENABLED = featurePreviewEnabled(
  __DEV__,
  process.env.EXPO_PUBLIC_YONDER_PREVIEW,
);

export const LIVE_FEATURES_ENABLED = liveConfigured;
