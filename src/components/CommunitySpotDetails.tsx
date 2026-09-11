import { StyleSheet, Text, View } from "react-native";
import { MapPin } from "lucide-react-native";
import type { Place } from "@/lib/places";
import { font } from "@/lib/theme";
export function CommunitySpotDetails({ place }: { place: Place }) {
  if (!place.communitySpot) return null;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <MapPin size={17} color="#665277" />
        <Text style={styles.label}>Community pin · unverified</Text>
      </View>
      <Text style={styles.body}>{place.communitySpot.description}</Text>
      <Text style={styles.note}>
        Match these landmarks as well as the pin. A location check alone cannot
        confirm the scene.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: 17,
    borderRadius: 21,
    backgroundColor: "#EEE5F7",
    marginVertical: 16,
    gap: 9,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 7 },
  label: { fontFamily: font.ui700, fontSize: 13, color: "#665277" },
  body: {
    fontFamily: font.ui500,
    fontSize: 15,
    lineHeight: 23,
    color: "#2C3E33",
  },
  note: {
    fontFamily: font.ui400,
    fontSize: 12,
    lineHeight: 18,
    color: "#665277",
  },
});
