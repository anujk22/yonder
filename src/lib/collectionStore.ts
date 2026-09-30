import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { newCollection, PlaceCollection, toggleCollectionPlace } from "./collections";
import { usePurchaseStore } from "./purchaseStore";

export const useCollectionHydration = create<{ status: "loading" | "ready" | "error" }>(() => ({ status: "loading" }));

function requireHydration() {
  if (useCollectionHydration.getState().status !== "ready") throw new Error("Wait for your collections to load before making changes.");
}

export const useCollectionStore = create<{
  collections: PlaceCollection[];
  createCollection: (name: string) => string;
  removeCollection: (id: string) => void;
  togglePlace: (id: string, placeId: string) => void;
}>()(persist((set, get) => ({
  collections: [],
  createCollection: (name) => {
    requireHydration();
    const collection = newCollection(get().collections, name, usePurchaseStore.getState().plus, `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    set({ collections: [...get().collections, collection] });
    return collection.id;
  },
  removeCollection: (id) => { requireHydration(); set({ collections: get().collections.filter((item) => item.id !== id) }); },
  togglePlace: (id, placeId) => { requireHydration(); set({ collections: get().collections.map((item) => item.id === id ? toggleCollectionPlace(item, placeId) : item) }); },
}), {
  name: "yonder-collections-v1",
  storage: createJSONStorage(() => AsyncStorage),
  onRehydrateStorage: () => {
    useCollectionHydration.setState({ status: "loading" });
    return (_, error) => useCollectionHydration.setState({ status: error ? "error" : "ready" });
  },
}));
