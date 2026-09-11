import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BrandImage, type ArtworkKind } from "./BrandImage";
import { type PlaceArtKind } from "@/lib/discovery";
import { font } from "@/lib/theme";
const art: Record<
  PlaceArtKind,
  { object: ArtworkKind; colors: [string, string]; caption: string }
> = {
  grocery: { object: "grocery", colors: ["#F6EFCF", "#DCDDAD"], caption: "A LITTLE EVERYDAY ESSENTIAL." },
  court: {
    object: "basketball",
    colors: ["#FFF0C0", "#F2D899"],
    caption: "ROOM FOR ONE MORE?",
  },
  pizza: {
    object: "food",
    colors: ["#FFF1DC", "#EFD4B7"],
    caption: "WORTH THE TRIP?",
  },
  coffee: {
    object: "coffee",
    colors: ["#F3E9FF", "#DECCED"],
    caption: "YOUR NEXT LITTLE PICK-ME-UP.",
  },
  park: {
    object: "outside",
    colors: ["#EEF4CC", "#D0DDA9"],
    caption: "GO GET SOME OUTSIDE.",
  },
  shop: {
    object: "shopping",
    colors: ["#EEE5FA", "#D8C7ED"],
    caption: "A LITTLE LOCAL INTEL.",
  },
  transit: {
    object: "transit",
    colors: ["#E4F1F0", "#BEDAD5"],
    caption: "NEXT STOP, LESS GUESSING.",
  },
  map: {
    object: "map",
    colors: ["#EAF0F5", "#CADCE6"],
    caption: "A LITTLE LOOK AROUND.",
  },
};
export function PlaceArt({
  kind,
  compact = false,
  caption = true,
}: {
  kind: PlaceArtKind;
  compact?: boolean;
  caption?: boolean;
}) {
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const selected = art[kind];
  const showCaption =
    caption && !compact && bounds.width >= 230 && bounds.height >= 175;
  return (
    <LinearGradient
      colors={selected.colors}
      style={styles.root}
      onLayout={({ nativeEvent: { layout } }) =>
        setBounds({ width: layout.width, height: layout.height })
      }
      accessibilityRole="image"
      accessibilityLabel={`${kind} category illustration, not a photograph`}
    >
      {!compact && <View style={styles.orbit} />}
      <View style={[styles.object, { bottom: showCaption ? 39 : 4 }]}>
        <BrandImage kind={selected.object} fill />
      </View>
      {showCaption && (
        <View style={styles.sticker}>
          <Text numberOfLines={1} style={styles.label}>
            {selected.caption}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  orbit: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: "#FFFFFF88",
    right: -30,
    top: -90,
  },
  object: { position: "absolute", top: 5, left: 8, right: 8 },
  sticker: {
    position: "absolute",
    left: 16,
    bottom: 13,
    maxWidth: "90%",
    backgroundColor: "#FFFDF2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    transform: [{ rotate: "-3deg" }],
    boxShadow: "0 3px 0 #30463318",
  },
  label: {
    fontFamily: font.ui700,
    fontSize: 9,
    color: "#354939",
    letterSpacing: 0.8,
  },
});
