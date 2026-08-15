# Yonder demo runbook

## Start

From the repo root:

```sh
npx expo start --clear
```

If the phone cannot reach the laptop over venue Wi-Fi:

```sh
npx expo start --tunnel --clear
```

If the tunnel is slow or blocked, connect the laptop and iPhone to the same iPhone Personal Hotspot, then run the normal LAN command again. Scan the QR code from Expo Go on the iPhone. If Expo reports that port 8081 is busy, use the alternate port it offers.

## Demo flags

Edit `src/lib/demoFlags.ts`, change one value, save, and reload Expo Go:

- `useStaticMap: true` uses the hand-drawn/static map in the native map surface.
- `skipOnboarding: true` skips the landing screen and opens Ask search directly.
- `fastTiming: true` halves every value in `TIMING`, including timing arrays.

## Demo checklist

### Ask → dispatch → status

- [ ] Open Expo Go and scan the project QR code.
- [ ] Leave the mode toggle on **Ask**.
- [ ] Tap **Are any basketball courts free at Pier 2?**.
- [ ] Tap **Continue**.
- [ ] Confirm **Pier 2 Basketball Courts** is resolved; tap **Continue**.
- [ ] Wait for **Compiling query** to finish.
- [ ] Tap **Send someone now**.
- [ ] Confirm the **Finding ground truth** status timeline renders.

### Ask → cached answer

- [ ] Return to **Ask** and tap **How long is the line at Joe's Pizza?**.
- [ ] Tap **Continue**, keep the resolved place, then tap **Continue** again.
- [ ] Wait for compile, then tap **Last known** or **Someone checked recently**.
- [ ] Confirm the cached tier opens the Answer screen.

### Observe → earned

- [ ] Tap **Observe** in the mode toggle.
- [ ] Tap the Pier 2 observation card.
- [ ] Tap **Accept**.
- [ ] Wait for **Open camera** to unlock, then tap it.
- [ ] Grant camera permission if prompted.
- [ ] Tap the capture shutter and let all 3 frames finish.
- [ ] Wait through **Verifying** until **Observation accepted** / Earned appears.

### Blocked place

- [ ] In Ask, type: `Is the iPhone 17 in stock at Apple Union Square?`
- [ ] Tap **Continue**, select/confirm the resolved place, and continue through compile.
- [ ] Confirm the location-unavailable blocked screen renders.

### Safety rejection

- [ ] In Ask, type: `Is someone wearing a red jacket?`
- [ ] Tap **Continue**.
- [ ] Confirm the query-declined safety screen renders.

## If this breaks, do this

- **Map fails to render:** set `useStaticMap: true` in `src/lib/demoFlags.ts`, save, and reload Expo Go. If using a native map surface, this bypasses `react-native-maps`.
- **Camera permission denied:** open iPhone Settings → Expo Go → Camera, enable access, return to Expo Go, and reload/reopen Capture. The app should remain on its safe permission screen until access is restored.
- **Bundle fails to load:** stop Metro with Ctrl-C, then run `npx expo start --clear`. If LAN discovery fails, use `npx expo start --tunnel --clear`; if 8081 is occupied, accept Expo's alternate port.
- **App reloads mid-demo:** reload resets the in-memory demo store. Reopen the relevant Ask or Observe checklist from the seeded start state; enable `fastTiming` if time is tight.
