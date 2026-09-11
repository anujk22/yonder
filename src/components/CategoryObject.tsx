import { type Place } from "@/lib/places";
import { artFor, Category } from "@/lib/discovery";
import { BrandObject, BrandObjectKind } from "./BrandObject";
import { BrandImage } from "./BrandImage";
export const categoryObjectKind = (category: Category): BrandObjectKind =>
  category === "Food & drink"
    ? "food"
    : category === "Shopping"
      ? "shopping"
      : category === "Parks & play"
        ? "outside"
        : category === "Getting around"
          ? "transit"
          : "map";
export function CategoryObject({
  category,
  place,
  size = 56,
  animated = false,
}: {
  category: Category;
  place?: Place;
  size?: number;
  animated?: boolean;
}) {
  const kinds = {
    grocery: "grocery",
    court: "basketball",
    pizza: "food",
    coffee: "coffee",
    park: "outside",
    shop: "shopping",
    transit: "transit",
    map: "map",
  } as const;
  const kind = place ? kinds[artFor(place)] : categoryObjectKind(category);
  return animated ? (
    <BrandObject kind={kind} size={size} />
  ) : (
    <BrandImage kind={kind} size={size} />
  );
}
