# Yonder

Ask someone already there. Yonder helps people check a place before making the trip: an open court, a queue, an accessible entrance, or an item on a shelf.

This is an Expo 57 / React Native product preview for iOS, Android, and web. Mobile opens into a real map with four tabs: Explore, Requests, Saved, and Help out. See [ART_DIRECTION.md](ART_DIRECTION.md) for the artwork, motion system, and generation prompts.

## Run locally

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

Requests, balances, sample availability, rewards, and answers are local demo state. There is no production authentication, cross-device dispatch, payment settlement, or evidence review service yet. More users will not make this preview networked automatically. Those services, abuse controls, notifications, and physical-device acceptance tests are required before a public pilot.

Start the pilot with one neighborhood and a narrow set of answerable questions. Measure fulfilled requests, time to a useful answer, repeat use, and cost per successful check before expanding coverage.


## Location discovery and dimensional artwork

Explore now starts without selecting NYC. Use the foreground location button to discover nearby places, submit a US place/city search, or move the map and choose Search this area. The NYC sample tour is optional. Discovery sends coordinates rounded to three decimals to the nearby proxy and Overpass; the GPS marker remains on the device and the location watcher stops when the screen loses focus. These are real places, not live reports or available observers.

The nearby route queries a 2.5 km area, caches responses for an hour, bounds response size, filters private/invalid/duplicate entries, and sorts returned places by distance. It is a selection of mapped places, not an exhaustive directory. Public Overpass is a prototype dependency; configure OVERPASS_URL for a managed or self-hosted provider and use shared rate limiting before a public rollout. Search failures keep an explicit retry/search path.

Six optimized transparent 3D objects now live in assets/brand/objects. Category images are illustrations, not venue photos. Larger compositions animate; result-list artwork stays static for readability and performance. The complete built-in image prompts are in ART_DIRECTION.md.
