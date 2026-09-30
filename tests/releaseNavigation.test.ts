/// <reference types="node" />
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { createStore } from "zustand/vanilla";
import { getRoutes } from "expo-router/build/getRoutes";
import { createYonderState } from "../src/lib/state";
import { CORE_SCREEN_NAMES, DEMO_SCREEN_NAMES, LIVE_SCREEN_NAMES } from "../src/lib/demoRoutes";
import { placeMapRoute } from "../src/lib/placeNavigation";
import { createCommunitySpot } from "../src/lib/communitySpots";
import { featurePreviewEnabled } from "../src/lib/previewPolicy";

test("full features require development or the explicit preview flag", () => {
  assert.equal(featurePreviewEnabled(false, undefined), false);
  assert.equal(featurePreviewEnabled(false, "0"), false);
  assert.equal(featurePreviewEnabled(false, "true"), false);
  assert.equal(featurePreviewEnabled(false, "1"), true);
  assert.equal(featurePreviewEnabled(true, undefined), true);
  const helper = readFileSync(new URL("../src/lib/previewFeatures.ts", import.meta.url), "utf8");
  assert.match(helper, /featurePreviewEnabled\(\s*__DEV__,\s*process\.env\.EXPO_PUBLIC_YONDER_PREVIEW/);
});

test("live and preview screens have independent route guards", () => {
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
  assert.deepEqual([...DEMO_SCREEN_NAMES, ...CORE_SCREEN_NAMES, ...LIVE_SCREEN_NAMES].sort(), screens.sort());
  const productionScreens = routes.children.map((node) => node.route)
    .filter((route) => ![...DEMO_SCREEN_NAMES, ...CORE_SCREEN_NAMES, ...LIVE_SCREEN_NAMES].some((name) => name === route));
  assert.deepEqual(productionScreens.sort(), ["index", "map", "saved", "collections", "about", "spots/new", "plus", "settings"].sort());
  const layout = readFileSync(new URL("../src/app/_layout.tsx", import.meta.url), "utf8");
  const source = ts.createSourceFile("_layout.tsx", layout, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const guards: ts.JsxElement[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "Stack.Protected") guards.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.equal(guards.length, 3);
  for (const [preview, live] of [[false, false], [true, false], [false, true], [true, true]]) {
    const available = guards.flatMap((guard) => {
      const attribute = guard.openingElement.attributes.properties.find((node) => ts.isJsxAttribute(node) && node.name.getText(source) === "guard");
      assert.ok(attribute && ts.isJsxAttribute(attribute) && attribute.initializer && ts.isJsxExpression(attribute.initializer));
      const enabled = runInNewContext(attribute.initializer.expression!.getText(source), { DEMO_FEATURES_ENABLED: preview, LIVE_FEATURES_ENABLED: live });
      const names = guard.getText(source).includes("CORE_SCREEN_NAMES.map") ? CORE_SCREEN_NAMES : guard.getText(source).includes("LIVE_SCREEN_NAMES.map") ? LIVE_SCREEN_NAMES : DEMO_SCREEN_NAMES;
      return enabled ? [...names] : [];
    });
    assert.equal(available.includes("activity"), preview || live);
    assert.equal(available.includes("observe/index"), preview || live);
    assert.equal(available.includes("live/new"), live);
    assert.equal(available.includes("ask/options"), preview);
    assert.equal(available.includes("observe/earned"), preview);
  }
});

test("configured live production and the preview have four tabs, unconfigured production has two", () => {
  const text = readFileSync(new URL("../src/components/BottomNavigation.tsx", import.meta.url), "utf8");
  const source = ts.createSourceFile("BottomNavigation.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const tabs = source.statements.find((node) => ts.isVariableStatement(node) && node.declarationList.declarations.some((declaration) => declaration.name.getText(source) === "tabs"));
  assert.ok(tabs);
  let filter: ts.CallExpression | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.getText(source) === "tabs.filter") filter = node;
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.ok(filter);
  for (const [preview, live] of [[false, false], [true, false], [false, true], [true, true]]) {
    const result = runInNewContext(ts.transpileModule(`${tabs.getText(source)}\n${filter.getText(source)}.map((tab) => tab.route);`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText, { DEMO_FEATURES_ENABLED: preview, LIVE_FEATURES_ENABLED: live });
    assert.deepEqual(Array.from(result), preview || live ? ["/", "/activity", "/saved", "/observe"] : ["/", "/saved"]);
  }
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
  }).outputText, { exports, DEMO_FEATURES_ENABLED: false, LIVE_FEATURES_ENABLED: false, useYonderStore: { getState: store.getState }, placeMapRoute });
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


test("a live production place action selects the actual place without creating a demo request", () => {
  const store = createStore(createYonderState);
  const pin = createCommunitySpot({ name: "Creek picnic tables", description: "Beside the footbridge", kind: "park", coordinate: { latitude: 37.3, longitude: -122.1 }, publicAccess: true }, "live-pin");
  const before = store.getState();
  const text = readFileSync(new URL("../src/components/PlaceTile.tsx", import.meta.url), "utf8");
  const source = ts.createSourceFile("PlaceTile.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const action = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "openPlaceDraft");
  assert.ok(action);
  const exports: { openPlaceDraft?: (place: typeof pin, router: { push: (route: string) => void }) => void } = {};
  runInNewContext(ts.transpileModule(action.getText(source), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, DEMO_FEATURES_ENABLED: false, LIVE_FEATURES_ENABLED: true, useYonderStore: { getState: store.getState }, placeMapRoute });
  let opened: string | undefined;
  exports.openPlaceDraft!(pin, { push: (route) => { opened = route; } });
  assert.equal(opened, "/live/new");
  assert.equal(store.getState().resolvedPlaceId, pin.id);
  assert.equal(store.getState().places.find((place) => place.id === pin.id)?.lat, 37.3);
  assert.equal(store.getState().queries, before.queries);
  assert.equal(store.getState().payouts, before.payouts);
});


test("Requests and Scout show the live board, and query parameters cannot enable public demos", () => {
  for (const [file, name, view] of [["activity.tsx", "ActivityScreen", "requests"], ["observe/index.tsx", "ObserveHome", "scout"]]) {
    const text = readFileSync(new URL(`../src/app/${file}`, import.meta.url), "utf8");
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const screen = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name);
    assert.ok(screen);
    for (const preview of [false, true]) {
      const liveBoard = () => null;
      const demoBoard = () => null;
      const exports: Record<string, () => { component: unknown; props?: { view?: string } }> = {};
      runInNewContext(ts.transpileModule(screen.getText(source), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText, {
        exports, LIVE_FEATURES_ENABLED: true, DEMO_FEATURES_ENABLED: preview, LiveHome: liveBoard,
        [`Demo${name}`]: demoBoard, useLocalSearchParams: () => ({ demo: "1" }),
        React: { createElement: (component: unknown, props?: { view?: string }) => ({ component, props }) },
      });
      const rendered = exports.default();
      assert.equal(rendered.component, preview ? demoBoard : liveBoard);
      if (!preview) assert.equal(rendered.props?.view, view);
    }
  }
});
