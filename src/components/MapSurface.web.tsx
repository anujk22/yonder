import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type * as Leaflet from "leaflet";
import "./leaflet-base.css";
import "./map.css";
import {
  LOWER_MANHATTAN_REGION,
  MapRegion,
  MapSurfaceHandle,
  MapSurfaceProps,
} from "./MapSurface.types";
import { ask, font } from "@/lib/theme";
export { LOWER_MANHATTAN_REGION, detailRegion } from "./MapSurface.types";
export type {
  MapCoordinate,
  MapMarkerData,
  MapRegion,
  MapSurfaceHandle,
  MapSurfaceProps,
} from "./MapSurface.types";

export const MapSurface = forwardRef<MapSurfaceHandle, MapSurfaceProps>(
  function MapSurface(
    {
      initialRegion = LOWER_MANHATTAN_REGION,
      markers = [],
      style,
      onRegionChange,
      onRegionChangeComplete,
      userLocation,
      geofence,
      controlsInset,
    },
    ref,
  ) {
    const container = useRef<HTMLDivElement>(null);
    const map = useRef<Leaflet.Map | null>(null);
    const library = useRef<typeof Leaflet | null>(null);
    const callbacks = useRef({ onRegionChange, onRegionChangeComplete });
    callbacks.current = { onRegionChange, onRegionChangeComplete };
    const initial = useRef(initialRegion);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);
    const insetRef = useRef(controlsInset);
    const pendingCamera = useRef<{
      region: MapRegion;
      duration: number;
    } | null>(null);
    useEffect(() => {
      insetRef.current = controlsInset;
      const node = map.current?.getContainer();
      node?.style.setProperty(
        "--yonder-map-top",
        `${controlsInset?.top ?? 0}px`,
      );
      node?.style.setProperty(
        "--yonder-map-bottom",
        `${controlsInset?.bottom ?? 0}px`,
      );
    }, [controlsInset, ready]);
    useImperativeHandle(
      ref,
      () => ({
        animateToRegion: (region, duration = 600) => {
          pendingCamera.current = { region, duration };
          if (
            map.current &&
            library.current &&
            applyCamera(
              map.current,
              library.current,
              region,
              duration,
              insetRef.current,
            )
          )
            pendingCamera.current = null;
        },
      }),
      [],
    );
    useEffect(() => {
      let disposed = false;
      let resize: ResizeObserver | undefined;
      setReady(false);
      setError(false);
      import("leaflet")
        .then((L) => {
          if (disposed || !container.current) return;
          library.current = L;
          const instance = L.map(container.current, {
            zoomControl: false,
            scrollWheelZoom: false,
            attributionControl: true,
          }).setView(
            [initial.current.latitude, initial.current.longitude],
            zoomFor(initial.current),
          );
          map.current = instance;
          L.control.zoom({ position: "topright" }).addTo(instance);
          instance.attributionControl.setPrefix(false);
          const tiles = L.tileLayer(
            process.env.EXPO_PUBLIC_MAP_TILE_URL ||
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution:
                process.env.EXPO_PUBLIC_MAP_ATTRIBUTION ||
                '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
              maxZoom: 19,
              keepBuffer: 1,
            },
          ).addTo(instance);
          tiles.on("tileerror", () => {
            if (!disposed) setError(true);
          });
          const region = (): MapRegion => {
            const center = instance.getCenter();
            const bounds = instance.getBounds();
            return {
              latitude: center.lat,
              longitude: center.lng,
              latitudeDelta: bounds.getNorth() - bounds.getSouth(),
              longitudeDelta: bounds.getEast() - bounds.getWest(),
            };
          };
          instance.on("movestart", () =>
            callbacks.current.onRegionChange?.(region()),
          );
          instance.on("moveend", () =>
            callbacks.current.onRegionChangeComplete?.(region()),
          );
          resize = new ResizeObserver(() => {
            if (disposed) return;
            if (
              instance.getContainer().clientHeight === 0 ||
              instance.getContainer().clientWidth === 0
            ) {
              instance.stop();
              return;
            }
            instance.invalidateSize({ pan: false });
            const pending = pendingCamera.current;
            if (
              pending &&
              applyCamera(
                instance,
                L,
                pending.region,
                pending.duration,
                insetRef.current,
              )
            )
              pendingCamera.current = null;
          });
          resize.observe(container.current);
          setReady(true);
        })
        .catch(() => {
          if (!disposed) setError(true);
        });
      return () => {
        disposed = true;
        resize?.disconnect();
        map.current?.remove();
        map.current = null;
      };
    }, [retry]);
    useEffect(() => {
      const L = library.current;
      const instance = map.current;
      if (!ready || !L || !instance) return;
      const group = L.layerGroup().addTo(instance);
      markers.forEach((marker) => {
        // Use DOM textContent: place names from external search must never become HTML.
        const button = document.createElement("button");
        const compact = marker.active === false;
        button.className = `yonder-map-pin${marker.active ? " active" : ""}${compact ? " compact" : ""}`;
        button.type = "button";
        button.textContent = compact
          ? "•"
          : `${marker.label || "Explore place"} ↗`;
        button.title = marker.label || "Explore place";
        button.setAttribute("aria-label", marker.label || "Explore place");
        if (marker.active) {
          const beacon = document.createElement("span");
          beacon.className = "yonder-pulse-beacon";
          button.appendChild(beacon);
        }
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          marker.onPress?.();
        });
        const icon = L.divIcon({
          html: button,
          className: "yonder-marker",
          iconSize: compact ? [36, 36] : [180, 44],
          iconAnchor: compact ? [18, 18] : [90, 44],
        });
        L.marker([marker.coordinate.latitude, marker.coordinate.longitude], {
          icon,
          keyboard: false,
          zIndexOffset: marker.active ? 1000 : 0,
        }).addTo(group);
      });
      if (geofence)
        L.circle([geofence.center.latitude, geofence.center.longitude], {
          radius: geofence.radius,
          color: "#52745C",
          weight: 2,
          fillOpacity: 0.1,
        }).addTo(group);
      if (userLocation) {
        L.circle([userLocation.latitude, userLocation.longitude], {
          radius: userLocation.accuracy,
          color: "#416CA0",
          weight: 1,
          fillOpacity: 0.09,
        }).addTo(group);
        L.circleMarker([userLocation.latitude, userLocation.longitude], {
          radius: 7,
          fillColor: "#416CA0",
          color: "white",
          weight: 3,
          fillOpacity: 1,
        })
          .addTo(group)
          .bindTooltip("Your current location");
      }
      return () => {
        group.remove();
      };
    }, [ready, markers, userLocation, geofence]);
    return (
      <View style={[{ overflow: "hidden", backgroundColor: "#E7EBE0" }, style]}>
        <div
          ref={container}
          aria-label="Interactive world map"
          role="region"
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        />
        {!ready && !error && (
          <View style={styles.loading}>
            <ActivityIndicator color={ask.ink} />
            <Text style={styles.message}>Unfolding the map…</Text>
          </View>
        )}
        {error && (
          <View style={styles.error}>
            <Text style={styles.message}>
              Map tiles unavailable. Place search still works.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setRetry((v) => v + 1)}
            >
              <Text
                style={[styles.message, { textDecorationLine: "underline" }]}
              >
                Retry map
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  },
);
const zoomFor = (region: MapRegion) =>
  Math.max(
    2,
    Math.min(18, Math.round(Math.log2(360 / region.longitudeDelta) - 0.7)),
  );
// Native stacks keep previous screens mounted at zero size. Defer camera moves
// until the visible map has room for its sheet; otherwise Leaflet computes NaN.
function applyCamera(
  instance: Leaflet.Map,
  L: typeof Leaflet,
  region: MapRegion,
  duration: number,
  inset?: { top: number; bottom: number },
) {
  const node = instance.getContainer();
  if (
    node.clientWidth < 50 ||
    node.clientHeight < (inset?.top ?? 0) + (inset?.bottom ?? 0) + 50
  )
    return false;
  if (
    ![
      region.latitude,
      region.longitude,
      region.latitudeDelta,
      region.longitudeDelta,
    ].every(Number.isFinite) ||
    region.latitudeDelta <= 0 ||
    region.longitudeDelta <= 0
  )
    return false;
  if (inset) {
    const bounds = L.latLngBounds(
      [
        region.latitude - region.latitudeDelta / 2,
        region.longitude - region.longitudeDelta / 2,
      ],
      [
        region.latitude + region.latitudeDelta / 2,
        region.longitude + region.longitudeDelta / 2,
      ],
    );
    instance.flyToBounds(bounds, {
      duration: duration / 1000,
      animate: duration > 0,
      paddingTopLeft: [16, inset.top],
      paddingBottomRight: [16, inset.bottom],
    });
  } else
    instance.flyTo([region.latitude, region.longitude], zoomFor(region), {
      duration: duration / 1000,
      animate: duration > 0,
    });
  return true;
}
const styles = StyleSheet.create({
  loading: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  message: {
    fontFamily: font.ui500,
    color: ask.ink,
    fontSize: 11,
    lineHeight: 16,
  },
  error: {
    position: "absolute",
    top: 65,
    left: 12,
    right: 50,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FFFFFFEE",
    gap: 8,
  },
});
