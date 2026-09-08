import { Place, QueryType } from "./places";
export const CATEGORIES = [
  "All places",
  "Food & drink",
  "Parks & play",
  "Shopping",
  "Getting around",
] as const;
export type Category = (typeof CATEGORIES)[number];
export const categoryFor = (place: Place): Category => {
  if (place.categories.includes("accessibility")) return "Getting around";
  if (place.categories.includes("stock_check")) return "Shopping";
  if (
    place.categories.includes("availability") ||
    place.categories.includes("crowd")
  )
    return "Parks & play";
  return "Food & drink";
};
export const suggestions: Record<QueryType, string> = {
  availability: "Is there space available right now?",
  queue: "How long is the line right now?",
  crowd: "How crowded is it right now?",
  condition: "What are the conditions like right now?",
  stock_check: "Is this item in stock?",
  accessibility: "Is the elevator working right now?",
  open_closed: "Is it open right now?",
};
export const questionFor = (place: Place) =>
  ({
    pier2: "Are any basketball courts free?",
    bryant: "Are there open tables at Bryant Park?",
    joes: "How long is the line at Joe’s Pizza?",
    nikesoho: "Is the black Pegasus 41 in size 10 in stock?",
  })[place.id] ?? suggestions[place.categories[0]];
export type PlaceArtKind =
  "court" | "pizza" | "coffee" | "park" | "shop" | "transit" | "map";
export const artFor = (place: Place): PlaceArtKind => {
  const name = place.name.toLowerCase();
  if (/basketball|hoops/.test(name) || place.id === "pier2") return "court";
  if (
    /subway|station|railway|train|transit|terminal/.test(name) ||
    categoryFor(place) === "Getting around"
  )
    return "transit";
  if (/café|cafe|coffee|espresso/.test(name)) return "coffee";
  if (categoryFor(place) === "Food & drink") return "pizza";
  if (categoryFor(place) === "Shopping") return "shop";
  if (categoryFor(place) === "Parks & play") return "park";
  return "map";
};
