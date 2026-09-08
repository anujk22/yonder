import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Coffee,
  Trees,
  ShoppingBag,
  MapPin,
  type LucideIcon,
} from "lucide-react-native";
import { Category } from "@/lib/discovery";
export const categoryPalette = (category: Category) =>
  category === "Food & drink"
    ? { light: "#FFE9D4", base: "#F3B899", ink: "#78412D", Icon: Coffee }
    : category === "Shopping"
      ? { light: "#F0E7FF", base: "#B7A0E4", ink: "#5E4380", Icon: ShoppingBag }
      : category === "Parks & play"
        ? { light: "#EDF5CE", base: "#BCD28E", ink: "#405A32", Icon: Trees }
        : { light: "#E4F1FF", base: "#9FC9DA", ink: "#355B68", Icon: MapPin };
export function TactileIcon({
  category = "All places",
  size = 48,
  icon,
}: {
  category?: Category;
  size?: number;
  icon?: LucideIcon;
}) {
  const palette = categoryPalette(category);
  const Icon = icon || palette.Icon;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        boxShadow: `0 4px 0 ${palette.base}, 0 7px 12px #273C3218`,
        transform: [{ rotate: "-5deg" }],
      }}
    >
      <LinearGradient
        colors={[palette.light, palette.base]}
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size * 0.32,
            borderWidth: 1.5,
            borderColor: "#FFFFFFCC",
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Icon size={size * 0.48} color={palette.ink} strokeWidth={2.1} />
      </LinearGradient>
    </View>
  );
}
