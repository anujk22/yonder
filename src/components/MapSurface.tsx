import { forwardRef, useImperativeHandle, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { CityMap } from '@/components/CityMap';
import {
  LOWER_MANHATTAN_REGION,
  detailRegion,
  MapCoordinate,
  MapMarkerData,
  MapRegion,
  MapSurfaceHandle,
  MapSurfaceProps,
} from '@/components/MapSurface.types';
import { YMark } from '@/components/YMark';
import { brand } from '@/lib/theme';

export { LOWER_MANHATTAN_REGION, detailRegion };
export type { MapCoordinate, MapMarkerData, MapRegion, MapSurfaceHandle, MapSurfaceProps };

const BOX = { minLat: 40.68, maxLat: 40.77, minLng: -74.03, maxLng: -73.95 } as const;

const project = ({ latitude, longitude }: MapCoordinate) => ({
  left: `${Math.max(2, Math.min(98, ((longitude - BOX.minLng) / (BOX.maxLng - BOX.minLng)) * 100))}%` as const,
  top: `${Math.max(2, Math.min(98, (1 - (latitude - BOX.minLat) / (BOX.maxLat - BOX.minLat)) * 100))}%` as const,
});

export const MapSurface = forwardRef<MapSurfaceHandle, MapSurfaceProps>(function MapSurface(
  { mode = 'ask', markers = [], style },
  ref,
) {
  const [height, setHeight] = useState(420);

  useImperativeHandle(ref, () => ({ animateToRegion: () => undefined }), []);

  const onLayout = (event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height);

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <CityMap height={height} compact fullBleed interactive={false} showAnswers={false} showOpenBounties={false} />
      {markers.map((marker) => {
        const position = project(marker.coordinate);
        return (
          <View key={marker.id} pointerEvents="none" style={[styles.marker, position]}>
            <YMark size={28} bodyColor={mode === 'ask' ? brand.espresso : brand.oat} />
          </View>
        );
      })}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: mode === 'ask' ? brand.oat : brand.espresso, opacity: mode === 'ask' ? 0.12 : 0.35 },
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  marker: { position: 'absolute', width: 28, height: 28, marginLeft: -14, marginTop: -14 },
});
