import { forwardRef, useImperativeHandle, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { CityMap } from '@/components/CityMap';
import { StaticMapMarker } from '@/components/StaticMapMarker';
import {
  LOWER_MANHATTAN_REGION,
  detailRegion,
  MapCoordinate,
  MapMarkerData,
  MapRegion,
  MapSurfaceHandle,
  MapSurfaceProps,
} from '@/components/MapSurface.types';
import { brand } from '@/lib/theme';

export { LOWER_MANHATTAN_REGION, detailRegion };
export type { MapCoordinate, MapMarkerData, MapRegion, MapSurfaceHandle, MapSurfaceProps };

const BOX = { minLat: 40.68, maxLat: 40.77, minLng: -74.03, maxLng: -73.95 } as const;

const project = ({ latitude, longitude }: MapCoordinate) => ({
  left: `${Math.max(2, Math.min(98, ((longitude - BOX.minLng) / (BOX.maxLng - BOX.minLng)) * 100))}%` as const,
  top: `${Math.max(2, Math.min(98, (1 - (latitude - BOX.minLat) / (BOX.maxLat - BOX.minLat)) * 100))}%` as const,
});

export const MapSurface = forwardRef<MapSurfaceHandle, MapSurfaceProps>(function MapSurface(
  { mode = 'ask', initialRegion = LOWER_MANHATTAN_REGION, markers = [], style },
  ref,
) {
  const [height, setHeight] = useState(420);
  const variant = initialRegion.latitudeDelta < 0.01 ? 'detail' : 'city';

  useImperativeHandle(ref, () => ({ animateToRegion: () => undefined }), []);

  const onLayout = (event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height);

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <CityMap height={height} fullBleed variant={variant} />
      {markers.map((marker) => {
        const position = project(marker.coordinate);
        return (
          <StaticMapMarker key={marker.id} mode={mode} onPress={marker.onPress} testID={marker.testID} style={[styles.marker, position]} />
        );
      })}
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

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  marker: { position: 'absolute', width: 28, height: 28, marginLeft: -14, marginTop: -14 },
});
