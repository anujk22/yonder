import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { CityMap } from '@/components/CityMap';
import { StaticMapMarker } from '@/components/StaticMapMarker';
import { YMark } from '@/components/YMark';
import { brand } from '@/lib/theme';
import { DEMO_FLAGS } from '@/lib/demoFlags';
import {
  LOWER_MANHATTAN_REGION,
  MapCoordinate,
  MapSurfaceHandle,
  MapSurfaceProps,
} from '@/components/MapSurface.types';

const BOX = { minLat: 40.68, maxLat: 40.77, minLng: -74.03, maxLng: -73.95 } as const;

const project = ({ latitude, longitude }: MapCoordinate) => ({
  left: `${Math.max(2, Math.min(98, ((longitude - BOX.minLng) / (BOX.maxLng - BOX.minLng)) * 100))}%` as const,
  top: `${Math.max(2, Math.min(98, (1 - (latitude - BOX.minLat) / (BOX.maxLat - BOX.minLat)) * 100))}%` as const,
});

export const MapSurface = forwardRef<MapSurfaceHandle, MapSurfaceProps>(function MapSurface(
  { mode = 'ask', initialRegion = LOWER_MANHATTAN_REGION, markers = [], onRegionChange, onRegionChangeComplete, style },
  ref,
) {
  const mapRef = useRef<MapView>(null);
  const [height, setHeight] = useState(420);
  const variant = initialRegion.latitudeDelta < 0.01 ? 'detail' : 'city';

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 600) => mapRef.current?.animateToRegion(region as Region, duration),
  }), []);

  // DEMO: deterministic path for recording. Real implementation below.
  if (DEMO_FLAGS.useStaticMap) {
    return (
      <View style={[styles.root, style]} onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
        <CityMap height={height} fullBleed variant={variant} />
        {markers.map((marker) => (
          <StaticMapMarker key={marker.id} mode={mode} onPress={marker.onPress} testID={marker.testID} style={[styles.marker, project(marker.coordinate)]} />
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
        showsPointsOfInterests
        showsTraffic={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        userInterfaceStyle={mode === 'observe' ? 'dark' : 'light'}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {markers.map((marker) => (
          <Marker key={marker.id} coordinate={marker.coordinate} title={marker.label} testID={marker.testID} onPress={marker.onPress} tracksViewChanges={false}>
            <YMark size={30} bodyColor={mode === 'ask' ? brand.espresso : brand.oat} />
          </Marker>
        ))}
      </MapView>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: mode === 'ask' ? brand.oat : brand.espresso, opacity: mode === 'ask' ? 0.035 : 0.32 },
        ]}
      />
    </View>
  );
});

export { LOWER_MANHATTAN_REGION, detailRegion } from '@/components/MapSurface.types';
export type { MapCoordinate, MapMarkerData, MapRegion, MapSurfaceHandle, MapSurfaceProps } from '@/components/MapSurface.types';

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  marker: { position: 'absolute', left: '50%', top: '50%', marginLeft: -14, marginTop: -14 },
});
