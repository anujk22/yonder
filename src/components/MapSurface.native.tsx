import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker, Region } from "react-native-maps";

import { CityMap } from "@/components/CityMap";
import { StaticMapMarker } from "@/components/StaticMapMarker";
import { Scout } from "@/components/Brand";
import { ask, brand, font } from "@/lib/theme";
import { DEMO_FLAGS } from "@/lib/demoFlags";
import {
  LOWER_MANHATTAN_REGION,
  MapCoordinate,
  MapSurfaceHandle,
  MapSurfaceProps,
} from "@/components/MapSurface.types";

const BOX = {
  minLat: 40.68,
  maxLat: 40.77,
  minLng: -74.03,
  maxLng: -73.95,
} as const;

const project = ({ latitude, longitude }: MapCoordinate) => ({
  left: `${Math.max(2, Math.min(98, ((longitude - BOX.minLng) / (BOX.maxLng - BOX.minLng)) * 100))}%` as const,
  top: `${Math.max(2, Math.min(98, (1 - (latitude - BOX.minLat) / (BOX.maxLat - BOX.minLat)) * 100))}%` as const,
});

export const MapSurface = forwardRef<MapSurfaceHandle, MapSurfaceProps>(
  function MapSurface(
    {
      mode = "ask",
      initialRegion = LOWER_MANHATTAN_REGION,
      markers = [],
      onRegionChange,
      onRegionChangeComplete,
      style,
      userLocation,
      geofence,
      controlsInset,
    },
    ref,
  ) {
    const mapRef = useRef<MapView>(null);
    const mapReady = useRef(false);
    const pending = useRef<{ region: Region; duration: number } | null>(null);
    const [height, setHeight] = useState(420);
    const variant = initialRegion.latitudeDelta < 0.01 ? "detail" : "city";

    useImperativeHandle(
      ref,
      () => ({
        animateToRegion: (region, duration = 600) => {
          pending.current = { region: region as Region, duration };
          if (mapReady.current)
            mapRef.current?.animateToRegion(region as Region, duration);
        },
      }),
      [],
    );

    // DEMO: deterministic path for recording. Real implementation below.
    if (DEMO_FLAGS.useStaticMap) {
      return (
        <View
          style={[styles.root, style]}
          onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        >
          <CityMap height={height} fullBleed variant={variant} />
          {markers.map((marker) => (
            <StaticMapMarker
              key={marker.id}
              mode={mode}
              onPress={marker.onPress}
              testID={marker.testID}
              style={[styles.marker, project(marker.coordinate)]}
            />
          ))}
        </View>
      );
    }

    return (
      <View style={[styles.root, style]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onMapReady={() => {
            mapReady.current = true;
            if (pending.current)
              mapRef.current?.animateToRegion(
                pending.current.region,
                pending.current.duration,
              );
          }}
          mapPadding={{
            top: controlsInset?.top ?? 0,
            bottom: controlsInset?.bottom ?? 0,
            left: 0,
            right: 0,
          }}
          customMapStyle={[{ elementType: "geometry", stylers: [{ color: "#f2f0e5" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#b9d6d6" }] }, { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#d8e4c3" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] }, { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]}
          showsPointsOfInterests
          showsTraffic={false}
          showsCompass={false}
          showsScale={false}
          toolbarEnabled={false}
          userInterfaceStyle={mode === "observe" ? "dark" : "light"}
          onRegionChange={onRegionChange}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {geofence && (
            <Circle
              center={geofence.center}
              radius={geofence.radius}
              strokeColor="#52745C"
              fillColor="#52745C22"
            />
          )}
          {userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={userLocation.accuracy}
                strokeColor="#416CA0"
                fillColor="#416CA022"
              />
              <Marker
                coordinate={userLocation}
                title="Your location"
                pinColor="#416CA0"
              />
            </>
          )}
          {markers.map((marker) => (
            <Marker
              key={`${marker.id}-${Boolean(marker.active)}`}
              coordinate={marker.coordinate}
              title={marker.label}
              testID={marker.testID}
              onPress={marker.onPress}
              tracksViewChanges={false}
              zIndex={marker.active ? 1000 : 1}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 7,
                  alignItems: "center",
                  padding: 8,
                  borderRadius: 22,
                  backgroundColor: marker.active ? ask.ink : ask.bg,
                  borderWidth: 2,
                  borderColor: ask.bg,
                }}
              >
                <Scout size={24} />
                {marker.active && (
                  <Text
                    numberOfLines={1}
                    style={{
                      maxWidth: 140,
                      fontFamily: font.ui700,
                      fontSize: 12,
                      color: ask.bg,
                    }}
                  >
                    {marker.label}
                  </Text>
                )}
              </View>
            </Marker>
          ))}
        </MapView>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: mode === "ask" ? brand.oat : brand.espresso,
              opacity: mode === "ask" ? 0.035 : 0.32,
            },
          ]}
        />
      </View>
    );
  },
);

export {
  LOWER_MANHATTAN_REGION,
  detailRegion,
} from "@/components/MapSurface.types";
export type {
  MapCoordinate,
  MapMarkerData,
  MapRegion,
  MapSurfaceHandle,
  MapSurfaceProps,
} from "@/components/MapSurface.types";

const styles = StyleSheet.create({
  root: { overflow: "hidden" },
  marker: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -14,
    marginTop: -14,
  },
});
