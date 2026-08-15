import { StyleProp, ViewStyle } from 'react-native';

import { Mode } from '@/lib/places';

export type MapCoordinate = { latitude: number; longitude: number };
export type MapRegion = MapCoordinate & { latitudeDelta: number; longitudeDelta: number };
export type MapMarkerData = { id: string; coordinate: MapCoordinate; label?: string };

export type MapSurfaceHandle = {
  animateToRegion: (region: MapRegion, duration?: number) => void;
};

export type MapSurfaceProps = {
  mode?: Mode;
  initialRegion?: MapRegion;
  markers?: MapMarkerData[];
  onRegionChange?: (region: MapRegion) => void;
  onRegionChangeComplete?: (region: MapRegion) => void;
  style?: StyleProp<ViewStyle>;
};

export const LOWER_MANHATTAN_REGION: MapRegion = {
  latitude: 40.7124,
  longitude: -74.001,
  latitudeDelta: 0.055,
  longitudeDelta: 0.045,
};

export const detailRegion = (coordinate: MapCoordinate): MapRegion => ({
  ...coordinate,
  latitudeDelta: 0.006,
  longitudeDelta: 0.0045,
});
