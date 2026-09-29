/// <reference types="node" />
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { createStore } from "zustand/vanilla";
import { getRoutes } from "expo-router/build/getRoutes";
import { createYonderState } from "../src/lib/state";
import { DEMO_SCREEN_NAMES } from "../src/lib/demoRoutes";
import { placeMapRoute } from "../src/lib/placeNavigation";
import { createCommunitySpot } from "../src/lib/communitySpots";

test("every demo and pilot screen is excluded by the fixed development guard", () => {
  const files = readdirSync(new URL("../src/app/", import.meta.url), { recursive: true })
    .filter((name): name is string => typeof name === "string")
    .filter((name) => /\.tsx?$/.test(name)).map((name) => `./${name}`);
  const context = Object.assign(() => ({ default: () => null }), {
    keys: () => files, resolve: (name: string) => name, id: "app",
  });
  const routes = getRoutes(context, { platform: "ios", importMode: "lazy", skipGenerated: true });
  assert.ok(routes);
  const screens = routes.children.filter((node) => /^(activity$|ask\/|observe\/|live\/)/.test(node.route))
    .map((node) => node.route);
  assert.deepEqual([...DEMO_SCREEN_NAMES].sort(), screens.sort());
  const productionScreens = routes.children.map((node) => node.route)
    .filter((route) => !DEMO_SCREEN_NAMES.some((name) => name === route));
  assert.deepEqual(productionScreens.sort(), ["index", "map", "saved", "collections", "about", "spots/new"].sort());
  const layout = readFileSync(new URL("../src/app/_layout.tsx", import.meta.url), "utf8");
  const source = ts.createSourceFile("_layout.tsx", layout, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const guards: ts.JsxElement[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "Stack.Protected") guards.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.equal(guards.length, 1);
  assert.match(guards[0].openingElement.getText(source), /guard=\{__DEV__\}/);
  assert.match(guards[0].getText(source), /DEMO_SCREEN_NAMES\.map/);
});

test("opening a saved personal pin in production preserves its location and creates no demo request", () => {
  const store = createStore(createYonderState);
  const pin = createCommunitySpot({
    name: "Creek picnic tables", description: "Beside the footbridge", kind: "park",
    coordinate: { latitude: 37.3, longitude: -122.1 }, publicAccess: true,
  }, "local-pin");
  store.getState().addPlace(pin);
  store.getState().toggleSavedPlace(pin.id);
  store.getState().setDraftQuestion("An existing development draft");
  const before = store.getState();
  const text = readFileSync(new URL("../src/components/PlaceTile.tsx", import.meta.url), "utf8");
  const source = ts.createSourceFile("PlaceTile.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const action = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "openPlaceDraft");
  assert.ok(action);
  const exports: { openPlaceDraft?: (place: typeof pin, router: { push: (route: ReturnType<typeof placeMapRoute>) => void }) => void } = {};
  runInNewContext(ts.transpileModule(action.getText(source), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, __DEV__: false, useYonderStore: { getState: store.getState }, placeMapRoute });
  let opened: ReturnType<typeof placeMapRoute> | undefined;
  exports.openPlaceDraft!(pin, { push: (route) => { opened = route; } });
  assert.equal(opened?.pathname, "/map");
  const mapped = store.getState().places.find((place) => place.id === opened?.params.placeId);
  assert.equal(mapped?.lat, 37.3);
  assert.equal(mapped?.lng, -122.1);
  assert.equal(mapped?.communitySpot?.description, "Beside the footbridge");
  assert.ok(store.getState().savedPlaceIds.includes(pin.id));
  assert.equal(store.getState().draftQuestion, before.draftQuestion);
  assert.equal(store.getState().resolvedPlaceId, before.resolvedPlaceId);
  assert.equal(store.getState().queries, before.queries);
});
