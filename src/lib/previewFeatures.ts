import { featurePreviewEnabled } from "./previewPolicy";

export const DEMO_FEATURES_ENABLED = featurePreviewEnabled(
  __DEV__,
  process.env.EXPO_PUBLIC_YONDER_PREVIEW,
);
