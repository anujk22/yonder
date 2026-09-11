import { useWindowDimensions } from "react-native";
import { usePathname, useRouter, type Href } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";
import { useYonderStore } from "./store";

/** One shared entrance for mobile tabs and desktop navigation. */
export function useScoutNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  return (route: Href, origin?: { x: number; y: number }) => {
    const state = useYonderStore.getState();
    if (state.isModeSwitching || pathname === route) return;
    if (
      typeof route === "string" &&
      ((route === "/observe" && !pathname.startsWith("/observe")) ||
        (pathname.startsWith("/observe") && !route.startsWith("/observe")))
    ) {
      state.startModeReveal({
        id: Date.now(),
        to: route === "/observe" ? "observe" : "ask",
        destination: route,
        x: origin?.x ?? width * 0.86,
        y: origin?.y ?? height - 45,
        reduceMotion: reduced,
      });
    } else router.navigate(route);
  };
}
