# Yonder

Ask someone already there. Yonder helps people check a place before making the trip: an open court, a queue, an accessible entrance, or an item on a shelf.

This is an Expo 57 / React Native product preview for iOS, Android, and web. Mobile opens into a real map with four tabs: Explore, Requests, Saved, and Help out. See [ART_DIRECTION.md](ART_DIRECTION.md) for the artwork, motion system, and generation prompts.

## Run locally

Use Node.js 22.13 or newer, as required by Expo SDK 57.

```sh
npm ci
npm run web
```

For a phone, run `npm start` and connect a compatible Expo client or development build to the same network. A Windows browser helps check layout; it does not validate native gestures, safe areas, camera behavior, or maps on a physical device. Native iOS builds require macOS or a cloud build service.

```sh
npm run typecheck
npx eslint src
npm test
npx expo export --platform all
```

## Try the complete preview

1. Explore a place on the map, or submit a place search. Select **Ask here**.
2. Pick a supported question and an answer option. A new check creates a local request and a demo credit hold.
3. Open the observer side, select the request, and choose **Try a demo check**. Finish the sample capture to see the answer and demo reward.
4. Requests keeps local history; Saved keeps favorite places on this device.

The separate GPS and camera path uses actual device readings and captures. Location validation checks freshness, reported accuracy, distance, and mocked readings where available. These checks are a prototype safeguard, not a server-backed anti-fraud guarantee. Real evidence stays on the device; it does not become a verified answer or trigger a payout.

## Maps and search

Web uses Leaflet with OpenStreetMap tiles and visible attribution. Native uses react-native-maps with the platform provider. Standalone Android builds need Google Maps credentials and native configuration before release.

The places API route provides submitted place search. Development native builds resolve the Expo development host; deployed native builds require `EXPO_PUBLIC_API_URL` pointing to the deployed API origin. This variable is public: never put secrets in it. Web uses its own origin by default. Deploy the server output, not only static client files, to retain the API route.

The default public Nominatim service is for modest prototype use. Requests are submitted explicitly, cached, and rate limited within one server process. A public or multi-instance launch needs a shared limiter and a provider suitable for its traffic; set `GEOCODER_URL` to a compatible endpoint. Review the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) and [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) before launch. Do not add autocomplete or offline tile prefetching to these public endpoints.

## Preview boundaries

The main Ask/Observe walkthrough, demo balances, rewards, and sample answers are local state. They do not pay observers or dispatch a check to another person. A separate, optional Supabase-backed **invited live pilot** is present in source: two allowlisted accounts can share a free place check and a self-reported text answer. It requires owner configuration and has not been verified against a hosted project or two devices. Follow the [invited-pilot setup and acceptance steps](docs/setup/INVITED_PILOT.md); the app keeps the local demo available when the pilot is unconfigured.

The invited pilot has structured questions, short expiry, cancellation, reports, blocks and account deletion. It does not review photo evidence, guarantee someone is nearby or available, pay a reward, or send push notifications. Before expanding beyond a small invited group, verify cross-device behavior and physical-device paths, define server-data retention, and add operational abuse review. Start with one neighborhood and measure fulfilled requests, time to a useful answer and repeat use before expanding coverage.


## Location discovery and dimensional artwork

Explore now starts without selecting NYC. Use the foreground location button to center the map, submit a US place/city search, or drop a custom pin. The NYC sample tour is optional. The GPS marker remains on the device and the location watcher stops when the screen loses focus. Search results are real mapped places, not live reports or available observers.

The unused nearby API route is a prototype: it queries a 2.5 km area through public Overpass, which fails from production hosting. Reintroduce nearby discovery only after a suitable provider and shared rate limiter are configured and verified. Place-search failures retain an explicit retry path.

Six optimized transparent 3D objects now live in assets/brand/objects. Category images are illustrations, not venue photos. Larger compositions animate; result-list artwork stays static for readability and performance. The complete built-in image prompts are in ART_DIRECTION.md.

## Community pins
Explore → Drop a pin lets people search an area, tap an exact coordinate, choose a category, and save a name plus identifying landmarks. Pins are stored locally and appear in Saved, with a 50 m capture boundary. They are public-access assertions, not independently verified listings.

Community requests preserve the landmark instructions. Scouts must confirm a landmark match and pass fresh GPS/accuracy checks before in-app capture. The sample answer/settlement path explicitly refuses community pins. Photos remain local and unverified; there is no shared publication, identity verification, moderation queue or independent scene matching yet. A production launch needs authenticated ownership, immutable request/location versions, server-side capture attestations, abuse reporting/review and payment integration.

## Yonder Plus and Shipaton handoff

Saved → Organize into collections provides one free local collection. A one-time Yonder Plus entitlement unlocks additional collections through RevenueCat. The purchase UI includes restore, cancellation/error handling and a price loaded from the current Lifetime package. Purchases stay unavailable until a native build has a correctly configured public SDK key; web and Expo Go are not purchase demonstrations.

Follow [RevenueCat setup and native acceptance tests](docs/shipaton/REVENUECAT_SETUP.md). Copy `.env.example` to `.env.local`, configure the dashboard and rebuild natively with `npx expo run:ios` or `npx expo run:android`. Do not put secret API keys in client variables. RevenueCat stores purchase entitlement information; it does not synchronize local collections or make the Ask/Observe demo networked.

[Delivery checklist](SHIPATON_CHECKLIST.md), [submission draft](docs/shipaton/SUBMISSION_DRAFT.md), and [market positioning](docs/shipaton/POSITIONING.md) track the remaining evidence. The PC film pack is distributed separately from the app source. The public repository and submitted App Store binary must be updated separately; local changes do not update either automatically.
