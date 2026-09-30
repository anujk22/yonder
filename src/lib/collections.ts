export type PlaceCollection = { id: string; name: string; placeIds: string[] };

export function newCollection(collections: PlaceCollection[], name: string, plus: boolean, id: string): PlaceCollection {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 48) throw new Error("Use a name between 1 and 48 characters.");
  if (collections.some((item) => item.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase()))
    throw new Error("You already have a collection with that name.");
  if (collections.length >= 1 && !plus) throw new Error("Plus unlocks additional collections. Your first collection stays free.");
  return { id, name: trimmed, placeIds: [] };
}

export function toggleCollectionPlace(collection: PlaceCollection, placeId: string): PlaceCollection {
  return { ...collection, placeIds: collection.placeIds.includes(placeId)
    ? collection.placeIds.filter((id) => id !== placeId)
    : [...collection.placeIds, placeId] };
}
