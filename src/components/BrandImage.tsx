import { Image } from "expo-image";
import { StyleSheet } from "react-native";

export const brandArtwork = {
  grocery: require("../../assets/brand/objects/grocery-vinyl.webp"),
  compass: require("../../assets/brand/objects/compass-classic-vinyl.webp"),
  chat: require("../../assets/brand/objects/chat-vinyl.webp"),
  coffee: require("../../assets/brand/objects/coffee-vinyl.webp"),
  outside: require("../../assets/brand/objects/outside-vinyl.webp"),
  shopping: require("../../assets/brand/objects/shopping-vinyl.webp"),
  scout: require("../../assets/brand/objects/scout-vinyl.webp"),
  map: require("../../assets/brand/objects/folded-map.webp"),
  done: require("../../assets/brand/objects/answer-bubble.webp"),
  basketball: require("../../assets/brand/objects/basketball-vinyl.webp"),
  food: require("../../assets/brand/objects/food-vinyl.webp"),
  transit: require("../../assets/brand/objects/transit-vinyl.webp"),
  heart: require("../../assets/brand/objects/heart-vinyl.webp"),
};
export type ArtworkKind = keyof typeof brandArtwork;

/** Static, contained art for navigation and dense lists. Animation belongs to the control. */
export function BrandImage({
  kind,
  size,
  fill = false,
}: {
  kind: ArtworkKind;
  size?: number;
  fill?: boolean;
}) {
  return (
    <Image
      source={brandArtwork[kind]}
      contentFit="contain"
      cachePolicy="memory-disk"
      accessible={false}
      style={fill ? StyleSheet.absoluteFill : { width: size, height: size }}
    />
  );
}
