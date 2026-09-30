import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Stays false until storage answers, so the intro never flashes for returning people. */
export const useOnboardingHydration = create<{ hydrated: boolean }>(() => ({ hydrated: false }));

/** First-launch intro. */
export const useOnboarding = create<{
  done: boolean;
  finish: () => void;
  reset: () => void;
}>()(persist((set) => ({
  done: false,
  finish: () => set({ done: true }),
  reset: () => set({ done: false }),
}), {
  name: "yonder-onboarding-v1",
  storage: createJSONStorage(() => AsyncStorage),
  onRehydrateStorage: () => () => useOnboardingHydration.setState({ hydrated: true }),
}));
