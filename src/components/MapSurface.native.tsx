import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { YMark } from '@/components/YMark';
import { brand } from '@/lib/theme';
import {
  LOWER_MANHATTAN_REGION,
  MapSurfaceHandle,
  MapSurfaceProps,
} from '@/components/MapSurface.types';

export const MapSurface = forwardRef<MapSurfaceHandle, MapSurfaceProps>(function MapSurface(
  { mode = 'ask', initialRegion = LOWER_MANHATTAN_REGION, markers = [], onRegionChange, onRegionChangeComplete, style },
  ref,
) {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 600) => mapRef.current?.animateToRegion(region as Region, duration),
  }), []);

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
          <Marker key={marker.id} coordinate={marker.coordinate} title={marker.label} tracksViewChanges={false}>
            <YMark size={30} bodyColor={mode === 'ask' ? brand.espresso : brand.oat} />
          </Marker>
        ))}
      </MapView>
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

export { LOWER_MANHATTAN_REGION, detailRegion } from '@/components/MapSurface.types';
export type { MapCoordinate, MapMarkerData, MapRegion, MapSurfaceHandle, MapSurfaceProps } from '@/components/MapSurface.types';

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
});
