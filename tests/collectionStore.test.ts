import test from "node:test";
import assert from "node:assert/strict";

test("collection writes wait for storage and a failed read never replaces saved lists", async () => {
  const asyncPath = require.resolve("@react-native-async-storage/async-storage");
  let resolveFirstRead!: (value: string) => void;
  let reads = 0;
  let writes = 0;
  let stored = JSON.stringify({ state: { collections: [{ id: "old", name: "Old", placeIds: [] }] }, version: 0 });
  const storage = {
    getItem: () => {
      reads++;
      if (reads === 1) return new Promise<string>((resolve) => { resolveFirstRead = resolve; });
      if (reads === 2) return Promise.reject(new Error("Storage unavailable"));
      return Promise.resolve(stored);
    },
    setItem: (_key: string, value: string) => { writes++; stored = value; return Promise.resolve(); },
    removeItem: () => Promise.resolve(),
  };
  require.cache[asyncPath] = { exports: storage } as NodeModule;
  const { useCollectionHydration, useCollectionStore } = require("../src/lib/collectionStore") as typeof import("../src/lib/collectionStore");

  assert.equal(useCollectionHydration.getState().status, "loading");
  assert.throws(() => useCollectionStore.getState().createCollection("New"), /load/);
  assert.throws(() => useCollectionStore.getState().removeCollection("old"), /load/);
  assert.throws(() => useCollectionStore.getState().togglePlace("old", "pier2"), /load/);
  assert.equal(writes, 0);

  const hydrated = new Promise<void>((resolve) => useCollectionStore.persist.onFinishHydration(() => resolve()));
  resolveFirstRead(stored);
  await hydrated;
  assert.equal(useCollectionHydration.getState().status, "ready");
  assert.deepEqual(useCollectionStore.getState().collections.map((item) => item.name), ["Old"]);
  useCollectionStore.getState().createCollection("New");
  assert.deepEqual(useCollectionStore.getState().collections.map((item) => item.name), ["Old", "New"]);

  await useCollectionStore.persist.rehydrate();
  assert.equal(useCollectionHydration.getState().status, "error");
  assert.throws(() => useCollectionStore.getState().createCollection("Lost"), /load/);
  assert.equal(writes, 1);
  assert.deepEqual(useCollectionStore.getState().collections.map((item) => item.name), ["Old", "New"]);

  await useCollectionStore.persist.rehydrate();
  assert.equal(useCollectionHydration.getState().status, "ready");
  assert.deepEqual(useCollectionStore.getState().collections.map((item) => item.name), ["Old", "New"]);
});
