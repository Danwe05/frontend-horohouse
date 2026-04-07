"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import {
  MapPin, Layers, Navigation, Pencil, Trash2, Settings, X,
  Ruler, School, Hospital, Utensils,
  ShoppingBag, Trees, Building2, Fuel, Bus, RefreshCw,
  Wifi, WifiOff
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import PropertyCard from "@/components/property/PropertyCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  latitude?: number;
  longitude?: number;
  price: number;
  title: string;
  type?: string;
  listingType?: string;
  address?: string;
  beds?: number;
  baths?: number;
  sqft?: string;
  image?: string;
  images?: string[];
}

interface POIData {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
  distance?: number;
  type?: string;
}

interface POICategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  maptilerType: string[];
}

interface MapViewProps {
  properties?: Property[];
  onPropertyClick?: (propertyId: string) => void;
  onAreaSelect?: (coordinates: [number, number][]) => void;
  onMapClick?: (lng: number, lat: number) => void;
  selectedLocation?: { lng: number; lat: number } | null;
  onLocationSelect?: (
    lng: number,
    lat: number,
    address?: { label?: string; city?: string; country?: string; raw?: any }
  ) => void;
  hoveredPropertyId?: string | null;
  compareIds?: Set<string>;
  onRefresh?: () => void;
  onClusterClick?: (propertyIds: string[]) => void;
  searchCity?: string;
  searchVersion?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FALLBACK_CENTER: [number, number] = [11.5167, 3.8667];
const DEFAULT_ZOOM = 12;
const CLUSTER_MAX_ZOOM = 16;
const ZOOM_DEBOUNCE_MS = 300;
const POI_SEARCH_RADIUS = 5000;
const POI_CACHE_TTL_MS = 300_000; // 5 min
const AUTO_REFRESH_INTERVAL = 60_000;
const PLACEHOLDER_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const GEO_TIMEOUT_MS = 8_000;

const MAP_STYLES = [
  { id: "streets-v4", name: "Streets" },
  { id: "basic-v4", name: "Basic" },
  { id: "bright-v4", name: "Bright" },
  { id: "outdoor-v4", name: "Outdoor" },
  { id: "019a3e44-212e-7306-92fa-85dd8bac3ed1", name: "Satellite" },
];

const POI_CATEGORIES: POICategory[] = [
  { id: "schools",     name: "Schools",       icon: School,      color: "bg-purple-600", maptilerType: ["school", "university", "college"] },
  { id: "hospitals",   name: "Hospitals",     icon: Hospital,    color: "bg-red-600",    maptilerType: ["hospital", "clinic", "pharmacy"] },
  { id: "restaurants", name: "Restaurants",   icon: Utensils,    color: "bg-orange-600", maptilerType: ["restaurant", "cafe", "fast_food"] },
  { id: "shopping",    name: "Shopping",      icon: ShoppingBag, color: "bg-pink-600",   maptilerType: ["shop", "supermarket", "mall"] },
  { id: "parks",       name: "Parks",         icon: Trees,       color: "bg-green-600",  maptilerType: ["park", "garden", "playground"] },
  { id: "transit",     name: "Transit",       icon: Bus,         color: "bg-blue-600",   maptilerType: ["bus_stop", "subway_entrance", "train_station"] },
  { id: "banks",       name: "Banks",         icon: Building2,   color: "bg-indigo-600", maptilerType: ["bank", "atm"] },
  { id: "fuel",        name: "Gas Stations",  icon: Fuel,        color: "bg-yellow-600", maptilerType: ["fuel", "charging_station"] },
];

const POI_SVG_PATHS: Record<string, string> = {
  schools:     '<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>',
  hospitals:   '<path d="M12 2v20M2 12h20M17 7h-5V2h-4v5H3v4h5v5h4v-5h5z"></path>',
  restaurants: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>',
  shopping:    '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>',
  parks:       '<path d="M17 8c0-3.87-3.13-7-7-7s-7 3.13-7 7c0 5.25 7 13 7 13s7-7.75 7-13z"></path><circle cx="10" cy="8" r="2"></circle>',
  transit:     '<path d="M8 6v6M16 6v6M2 12h20M6 16h.01M18 16h.01M8 20h8M3 8h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"></path>',
  banks:       '<path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"></path>',
  fuel:        '<path d="M3 22h12M4 9h10M5 2h8v18H5z"></path><path d="M18 6h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v-6M13 6h5"></path>',
};

// ─── Pure Helpers (defined once, never recreated) ─────────────────────────────

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatPriceCompact(price: number): string {
  if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (price >= 1_000_000)     return `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (price >= 1_000)         return `${(price / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${price}`;
}

function formatDistanceFn(meters: number, unit: "metric" | "imperial"): string {
  if (unit === "imperial") {
    const feet = meters * 3.28084;
    return feet < 5280 ? `${Math.round(feet)} ft` : `${(feet / 5280).toFixed(1)} mi`;
  }
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

function formatMeasurementFn(value: number, type: "distance" | "area", unit: "metric" | "imperial"): string {
  if (type === "distance") return formatDistanceFn(value, unit);
  if (unit === "imperial") {
    const sqFeet = value * 10.7639;
    return sqFeet < 43560 ? `${Math.round(sqFeet).toLocaleString()} ft²` : `${(sqFeet / 43560).toFixed(2)} acres`;
  }
  return value < 10000 ? `${Math.round(value).toLocaleString()} m²` : `${(value / 1_000_000).toFixed(2)} km²`;
}

// Pre-build reusable marker HTML strings to avoid repeated template literal work
function buildPriceMarkerHTML(price: number): string {
  return `<div class="map-marker bg-white text-[#222222] px-3 py-1.5 rounded-full text-[14px] font-bold shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-all cursor-pointer whitespace-nowrap border border-[#DDDDDD]"><span>${formatPriceCompact(price)}</span></div>`;
}

function buildClusterMarkerHTML(count: number): string {
  const sizeClass = count > 20 ? "w-14 h-14 text-[16px]" : count > 10 ? "w-12 h-12 text-[15px]" : "w-10 h-10 text-[14px]";
  return `<div class="bg-blue-600 text-white ${sizeClass} rounded-full flex items-center justify-center font-bold shadow-[0_2px_4px_rgba(0,0,0,0.18)] hover:scale-105 transition-transform cursor-pointer border border-[#DDDDDD]">${count > 99 ? "99+" : count}</div>`;
}

// ─── Toggle UI (pure, no re-render cost) ─────────────────────────────────────

const Toggle = ({ active }: { active: boolean }) => (
  <div className={`w-10 h-6 rounded-full transition-colors ${active ? "bg-blue-600" : "bg-[#DDDDDD]"} relative flex-shrink-0`}>
    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${active ? "translate-x-4" : ""}`} />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const MapView = ({
  properties = [],
  onPropertyClick,
  onAreaSelect,
  onMapClick,
  selectedLocation = null,
  onLocationSelect,
  hoveredPropertyId = null,
  compareIds,
  onRefresh,
  onClusterClick,
  searchCity,
  searchVersion,
}: MapViewProps) => {

  // ── Refs (never trigger re-renders) ───────────────────────────────────────
  const mapContainer              = useRef<HTMLDivElement>(null);
  const map                       = useRef<maplibregl.Map | null>(null);
  const markers                   = useRef<Map<string, { marker: maplibregl.Marker; isCluster?: boolean }>>(new Map());
  const userLocationMarker        = useRef<maplibregl.Marker | null>(null);
  const selectedMarker            = useRef<maplibregl.Marker | null>(null);
  const drawingCoords             = useRef<[number, number][]>([]);
  const zoomTimeoutRef            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRefreshIntervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const superclusterRef           = useRef(new Supercluster({ radius: 60, maxZoom: 16 }));
  const poiMarkersRef             = useRef<Map<string, maplibregl.Marker>>(new Map());
  const poiCacheRef               = useRef<Map<string, { data: POIData[]; timestamp: number }>>(new Map());
  const measurementMarkersRef     = useRef<maplibregl.Marker[]>([]);
  const measurementLineIdsRef     = useRef<string[]>([]);
  const userLocationRef           = useRef<[number, number] | null>(null);
  const onRefreshRef              = useRef(onRefresh);
  const onClusterClickRef         = useRef(onClusterClick);
  const onMapClickRef             = useRef(onMapClick);
  const onLocationSelectRef       = useRef(onLocationSelect);
  // Live refs for event-handler closures — avoid stale closures without re-binding listeners
  const isDrawingRef              = useRef(false);
  const measurementModeRef        = useRef<"distance" | "area" | null>(null);
  const measurementPointsRef      = useRef<[number, number][]>([]);
  const measurementUnitRef        = useRef<"metric" | "imperial">("metric");
  const mapLoadedRef              = useRef(false);
  const showHeatmapRef            = useRef(false);
  const drawnPolygonRef           = useRef<[number, number][] | null>(null);

  // Keep callback refs in sync
  useEffect(() => { onRefreshRef.current       = onRefresh;       }, [onRefresh]);
  useEffect(() => { onClusterClickRef.current  = onClusterClick;  }, [onClusterClick]);
  useEffect(() => { onMapClickRef.current      = onMapClick;      }, [onMapClick]);
  useEffect(() => { onLocationSelectRef.current = onLocationSelect; }, [onLocationSelect]);

  // ── State (only what drives UI re-renders) ────────────────────────────────
  const [mapLoaded,           setMapLoaded]           = useState(false);
  const [mapError,            setMapError]            = useState<string | null>(null);
  const [showClusters,        setShowClusters]        = useState(false);
  const [showHeatmap,         setShowHeatmap]         = useState(false);
  const [currentStyle,        setCurrentStyle]        = useState("streets-v4");
  const [isDrawing,           setIsDrawing]           = useState(false);
  const [drawnPolygon,        setDrawnPolygon]        = useState<[number, number][] | null>(null);
  const [isModalOpen,         setIsModalOpen]         = useState(false);
  const [zoomLevel,           setZoomLevel]           = useState(DEFAULT_ZOOM);
  const [selectedProperty,    setSelectedProperty]    = useState<Property | null>(null);
  const [isLocating,          setIsLocating]          = useState(true);
  const [activePOICategories, setActivePOICategories] = useState<Set<string>>(new Set());
  const [poiLoading,          setPOILoading]          = useState(false);
  const [measurementMode,     setMeasurementMode]     = useState<"distance" | "area" | null>(null);
  const [measurementPoints,   setMeasurementPoints]   = useState<[number, number][]>([]);
  const [measurementResult,   setMeasurementResult]   = useState<{ distance?: number; area?: number; perimeter?: number } | null>(null);
  const [measurementUnit,     setMeasurementUnit]     = useState<"metric" | "imperial">("metric");
  const [autoRefreshEnabled,  setAutoRefreshEnabled]  = useState(false);
  const [showTransit,         setShowTransit]         = useState(false);
  const [showTraffic,         setShowTraffic]         = useState(false);
  const [offlineModeEnabled,  setOfflineModeEnabled]  = useState(false);
  const [cacheSize,           setCacheSize]           = useState(0);

  // Keep live refs in sync with state
  useEffect(() => { isDrawingRef.current       = isDrawing;       }, [isDrawing]);
  useEffect(() => { measurementModeRef.current = measurementMode; }, [measurementMode]);
  useEffect(() => { measurementPointsRef.current = measurementPoints; }, [measurementPoints]);
  useEffect(() => { measurementUnitRef.current = measurementUnit; }, [measurementUnit]);
  useEffect(() => { mapLoadedRef.current       = mapLoaded;       }, [mapLoaded]);
  useEffect(() => { showHeatmapRef.current     = showHeatmap;     }, [showHeatmap]);
  useEffect(() => { drawnPolygonRef.current    = drawnPolygon;    }, [drawnPolygon]);

  // ── API key ───────────────────────────────────────────────────────────────
  const apiKey = useMemo(() => process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "", []);

  // ── Valid properties (memo, stable reference) ─────────────────────────────
  const validProperties = useMemo(
    () => properties.filter((p) => p.latitude != null && p.longitude != null),
    [properties]
  );

  // ── Load supercluster off the critical path (defer via setTimeout) ─────────
  useEffect(() => {
    if (validProperties.length === 0) return;
    const id = setTimeout(() => {
      superclusterRef.current.load(
        validProperties.map((p) => ({
          type: "Feature" as const,
          properties: { cluster: false, propertyId: p.id, ...p },
          geometry: { type: "Point" as const, coordinates: [p.longitude!, p.latitude!] },
        }))
      );
    }, 0); // yield to browser paint first
    return () => clearTimeout(id);
  }, [validProperties]);

  // ── Formatting (stable, reads from ref so no dep-churn) ───────────────────
  const formatDistance = useCallback((meters: number) =>
    formatDistanceFn(meters, measurementUnitRef.current), []);

  const formatMeasurement = useCallback((value: number, type: "distance" | "area") =>
    formatMeasurementFn(value, type, measurementUnitRef.current), []);

  // ── Map helpers ───────────────────────────────────────────────────────────

  const placeUserLocationMarker = useCallback((lng: number, lat: number) => {
    if (!map.current) return;
    userLocationMarker.current?.remove();
    const el = document.createElement("div");
    el.innerHTML = `
      <div style="position:relative;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:24px;height:24px;background:#4285F4;border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite;opacity:.6"></div>
        <div style="position:relative;width:18px;height:18px;background:#4285F4;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>
      </div>`;
    userLocationMarker.current = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([lng, lat])
      .addTo(map.current);
  }, []);

  const placeSelectedMarker = useCallback((lng: number, lat: number) => {
    if (!map.current) return;
    selectedMarker.current?.remove();
    const el = document.createElement("div");
    el.className = "rounded-full bg-blue-600 w-4 h-4 border-2 border-white shadow-md";
    selectedMarker.current = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map.current);
    map.current.flyTo({ center: [lng, lat], zoom: Math.max(map.current.getZoom(), 14), duration: 600 });
  }, []);

  // Debounced reverse geocode — cancels if another click comes in quickly
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    if (!apiKey) return null;
    geocodeAbortRef.current?.abort();
    geocodeAbortRef.current = new AbortController();
    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}`,
        { signal: geocodeAbortRef.current.signal }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const feat = data?.features?.[0];
      if (!feat) return null;
      const label = feat.place_name || feat.properties?.label || "";
      let city = "", country = "";
      (feat.context ?? []).forEach((c: any) => {
        if (!city && /^(place|locality|county|region)/.test(c.id)) city = c.text;
        if (!country && /^country/.test(c.id)) country = c.text;
      });
      return { label, city, country, raw: feat };
    } catch (err: any) {
      if (err?.name === "AbortError") return null;
      return null;
    }
  }, [apiKey]);

  // ── Heatmap ───────────────────────────────────────────────────────────────

  const addHeatmapLayer = useCallback(() => {
    if (!map.current || validProperties.length === 0) return;
    const data: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features: validProperties.map((p) => ({
        type: "Feature",
        properties: { price: p.price },
        geometry: { type: "Point", coordinates: [p.longitude!, p.latitude!] },
      })),
    };
    try {
      if (map.current.getLayer("properties-heatmap")) map.current.removeLayer("properties-heatmap");
      if (map.current.getSource("properties-heat"))   map.current.removeSource("properties-heat");
      map.current.addSource("properties-heat", { type: "geojson", data });
      map.current.addLayer({
        id: "properties-heatmap", type: "heatmap", source: "properties-heat",
        paint: {
          "heatmap-weight":     ["interpolate", ["linear"], ["get", "price"], 0, 0, 100000, 0.5, 1000000, 1],
          "heatmap-intensity":  ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
          "heatmap-color":      ["interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(33,102,172,0)", 0.2, "rgb(103,169,207)", 0.4, "rgb(209,229,240)",
            0.6, "rgb(253,219,199)", 0.8, "rgb(239,138,98)", 1, "rgb(178,24,43)"],
          "heatmap-radius":     ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
          "heatmap-opacity":    0.8,
        },
      });
    } catch { /* style not ready */ }
  }, [validProperties]);

  const removeHeatmapLayer = useCallback(() => {
    if (!map.current) return;
    try {
      if (map.current.getLayer("properties-heatmap")) map.current.removeLayer("properties-heatmap");
      if (map.current.getSource("properties-heat"))   map.current.removeSource("properties-heat");
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!mapLoaded) return;
    showHeatmap ? addHeatmapLayer() : removeHeatmapLayer();
  }, [showHeatmap, mapLoaded, addHeatmapLayer, removeHeatmapLayer]);

  // ── Markers ───────────────────────────────────────────────────────────────

  const clearMarkers = useCallback(() => {
    markers.current.forEach(({ marker }) => marker.remove());
    markers.current.clear();
  }, []);

  /** Create a single property price marker. Element is built once and reused. */
  const createMarker = useCallback((property: Property): { marker: maplibregl.Marker } | null => {
    if (!map.current || !property.latitude || !property.longitude) return null;
    const el = document.createElement("div");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${property.title}, ${formatPriceCompact(property.price)} XAF`);
    el.dataset.propertyId = property.id;
    el.innerHTML = buildPriceMarkerHTML(property.price);
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      setSelectedProperty(property);
    });
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([property.longitude!, property.latitude!])
      .addTo(map.current);
    return { marker };
  }, []);

  /** Create a cluster bubble marker. */
  const createClusterMarker = useCallback((cluster: any): { marker: maplibregl.Marker; isCluster: true } | null => {
    if (!map.current) return null;
    const count = cluster.properties.point_count;
    const el = document.createElement("div");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Cluster of ${count} properties`);
    el.innerHTML = buildClusterMarkerHTML(count);
    const [lng, lat] = cluster.geometry.coordinates;
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const zoom = superclusterRef.current.getClusterExpansionZoom(cluster.id);
      map.current?.flyTo({ center: [lng, lat], zoom, duration: 800 });
      try {
        const leaves = superclusterRef.current.getLeaves(cluster.id, Infinity);
        const ids = leaves.map((l: any) => l.properties?.propertyId).filter(Boolean) as string[];
        if (ids.length) onClusterClickRef.current?.(ids);
      } catch { /* ignore */ }
    });
    const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current);
    return { marker, isCluster: true };
  }, []);

  const updateMarkers = useCallback(() => {
    if (!map.current || !mapLoadedRef.current) return;
    if (validProperties.length === 0) { clearMarkers(); return; }

    const zoom = map.current.getZoom();
    const useClusters = showClusters && validProperties.length > 5 && zoom < CLUSTER_MAX_ZOOM;

    // Build the desired key set
    const desiredKeys = new Set<string>();
    if (useClusters) {
      const bounds = map.current.getBounds();
      const clusters = superclusterRef.current.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        Math.floor(zoom)
      );
      clusters.forEach((c: any) => {
        desiredKeys.add(c.properties.cluster ? `cluster-${c.id}` : c.properties.propertyId);
      });
    } else {
      validProperties.forEach((p) => desiredKeys.add(p.id));
    }

    // Remove stale markers
    markers.current.forEach(({ marker }, key) => {
      if (!desiredKeys.has(key)) { marker.remove(); markers.current.delete(key); }
    });

    // Add missing markers
    if (useClusters) {
      const bounds = map.current.getBounds();
      const clusters = superclusterRef.current.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        Math.floor(zoom)
      );
      clusters.forEach((cluster: any) => {
        if (cluster.properties.cluster) {
          const key = `cluster-${cluster.id}`;
          if (!markers.current.has(key)) {
            const r = createClusterMarker(cluster);
            if (r) markers.current.set(key, r);
          }
        } else {
          const key = cluster.properties.propertyId;
          if (!markers.current.has(key)) {
            const prop = validProperties.find((p) => p.id === key);
            if (prop) {
              const r = createMarker(prop);
              if (r) markers.current.set(key, r);
            }
          }
        }
      });
    } else {
      validProperties.forEach((prop) => {
        if (!markers.current.has(prop.id)) {
          const r = createMarker(prop);
          if (r) markers.current.set(prop.id, r);
        }
      });
    }
  }, [validProperties, showClusters, clearMarkers, createMarker, createClusterMarker]);

  // ── Hover / compare styling ───────────────────────────────────────────────

  useEffect(() => {
    markers.current.forEach(({ marker, isCluster }, key) => {
      if (isCluster) return;
      const el = marker.getElement()?.querySelector(".map-marker") as HTMLElement | null;
      if (!el) return;
      const active = hoveredPropertyId === key || selectedProperty?.id === key;
      el.classList.toggle("bg-white",      !active);
      el.classList.toggle("text-[#222222]",!active);
      el.classList.toggle("bg-blue-600",   active);
      el.classList.toggle("text-white",    active);
      el.classList.toggle("scale-105",     active);
    });
  }, [hoveredPropertyId, selectedProperty]);

  useEffect(() => {
    if (!mapLoaded) return;
    validProperties.forEach((prop) => {
      const entry = markers.current.get(prop.id);
      if (!entry) return;
      const el = entry.marker.getElement()?.querySelector(".map-marker") as HTMLElement | null;
      if (!el) return;
      const isCompared = compareIds?.has(prop.id) ?? false;
      el.style.outline      = isCompared ? "2px solid #222222" : "";
      el.style.outlineOffset = isCompared ? "2px" : "";
    });
  }, [compareIds, mapLoaded, validProperties]);

  // ── Drawing ───────────────────────────────────────────────────────────────

  const updateDrawnPolygon = useCallback((coords: [number, number][]) => {
    if (!map.current || !mapLoadedRef.current) return;
    const sourceId = "drawn-polygon";
    const data: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature", properties: {},
      geometry: { type: "Polygon", coordinates: [coords.length > 2 ? [...coords, coords[0]] : coords] },
    };
    try {
      const src = map.current.getSource(sourceId);
      if (src && src.type === "geojson") {
        (src as maplibregl.GeoJSONSource).setData(data);
      } else {
        map.current.addSource(sourceId, { type: "geojson", data });
        if (!map.current.getLayer("drawn-polygon-layer"))
          map.current.addLayer({ id: "drawn-polygon-layer", type: "fill",   source: sourceId, paint: { "fill-color": "#222222", "fill-opacity": 0.15 } });
        if (!map.current.getLayer("drawn-polygon-outline"))
          map.current.addLayer({ id: "drawn-polygon-outline", type: "line", source: sourceId, paint: { "line-color": "#222222", "line-width": 2 } });
      }
    } catch { /* ignore */ }
  }, []);

  const clearDrawing = useCallback(() => {
    setDrawnPolygon(null);
    drawingCoords.current = [];
    if (!map.current) return;
    ["drawn-polygon-layer", "drawn-polygon-outline"].forEach((id) => {
      if (map.current!.getLayer(id)) map.current!.removeLayer(id);
    });
    if (map.current.getSource("drawn-polygon")) map.current.removeSource("drawn-polygon");
  }, []);

  const startDrawing = useCallback(() => {
    setIsDrawing(true);
    drawingCoords.current = [];
    setIsModalOpen(false);
    if (map.current) map.current.getCanvas().style.cursor = "crosshair";
  }, []);

  const finishDrawing = useCallback(() => {
    setIsDrawing(false);
    if (map.current) map.current.getCanvas().style.cursor = "";
    if (drawingCoords.current.length > 2) {
      const coords = drawingCoords.current.slice();
      setDrawnPolygon(coords);
      onAreaSelect?.(coords);
    }
  }, [onAreaSelect]);

  // ── Measurement ───────────────────────────────────────────────────────────

  const updateMeasurementLines = useCallback((points: [number, number][], mode: "distance" | "area" | null) => {
    if (!map.current || points.length < 2) return;
    measurementLineIdsRef.current.forEach((id) => {
      if (map.current!.getLayer(id))  map.current!.removeLayer(id);
      if (map.current!.getSource(id)) map.current!.removeSource(id);
    });
    measurementLineIdsRef.current = [];
    const lineCoords = mode === "area" && points.length >= 3 ? [...points, points[0]] : points;
    const lineId = `m-line-${Date.now()}`;
    measurementLineIdsRef.current.push(lineId);
    try {
      map.current.addSource(lineId, { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: lineCoords } } });
      map.current.addLayer({ id: lineId, type: "line", source: lineId, paint: { "line-color": "#222222", "line-width": 2, "line-dasharray": [2, 2] } });
      if (mode === "area" && points.length >= 3) {
        const fillId = `m-fill-${Date.now()}`;
        measurementLineIdsRef.current.push(fillId);
        map.current.addSource(fillId, { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...points, points[0]]] } } });
        map.current.addLayer({ id: fillId, type: "fill", source: fillId, paint: { "fill-color": "#222222", "fill-opacity": 0.15 } });
      }
    } catch { /* ignore */ }
  }, []);

  const calculateDistance = useCallback((points: [number, number][]) => {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const [lng1, lat1] = points[i], [lng2, lat2] = points[i + 1];
      total += haversineDistance(lat1, lng1, lat2, lng2);
    }
    setMeasurementResult({ distance: total });
  }, []);

  const calculateArea = useCallback((points: [number, number][]) => {
    if (points.length < 3) return;
    const closed = [...points, points[0]];
    let area = 0;
    for (let i = 0; i < closed.length - 1; i++) {
      area += closed[i][0] * closed[i + 1][1] - closed[i + 1][0] * closed[i][1];
    }
    const mpd = 111320;
    const areaSqm = Math.abs(area) / 2 * mpd ** 2 * Math.cos((points[0][1] * Math.PI) / 180);
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const [lng1, lat1] = points[i], [lng2, lat2] = points[(i + 1) % points.length];
      perimeter += haversineDistance(lat1, lng1, lat2, lng2);
    }
    setMeasurementResult({ area: areaSqm, perimeter });
  }, []);

  const addMeasurementPoint = useCallback((lng: number, lat: number) => {
    const mode   = measurementModeRef.current;
    const prev   = measurementPointsRef.current;
    const newPts: [number, number][] = [...prev, [lng, lat]];
    setMeasurementPoints(newPts);
    const el = document.createElement("div");
    el.innerHTML = `<div class="w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-sm"></div>`;
    measurementMarkersRef.current.push(
      new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current!)
    );
    if (mode === "distance" && newPts.length >= 2) calculateDistance(newPts);
    else if (mode === "area" && newPts.length >= 3) calculateArea(newPts);
    updateMeasurementLines(newPts, mode);
  }, [calculateDistance, calculateArea, updateMeasurementLines]);

  const clearMeasurement = useCallback(() => {
    measurementMarkersRef.current.forEach((m) => m.remove());
    measurementMarkersRef.current = [];
    measurementLineIdsRef.current.forEach((id) => {
      if (map.current?.getLayer(id))  map.current.removeLayer(id);
      if (map.current?.getSource(id)) map.current.removeSource(id);
    });
    measurementLineIdsRef.current = [];
    setMeasurementPoints([]);
    setMeasurementResult(null);
    setMeasurementMode(null);
    if (map.current) map.current.getCanvas().style.cursor = "";
  }, []);

  const startMeasurement = useCallback((mode: "distance" | "area") => {
    setMeasurementMode(mode);
    setMeasurementPoints([]);
    setMeasurementResult(null);
    setIsModalOpen(false);
    if (map.current) map.current.getCanvas().style.cursor = "crosshair";
  }, []);

  // ── POI ───────────────────────────────────────────────────────────────────

  const fetchNearbyPOI = useCallback(async (
    category: POICategory,
    center: [number, number],
    radius = POI_SEARCH_RADIUS
  ): Promise<POIData[]> => {
    if (!apiKey) return [];
    const cacheKey = `${category.id}-${center[0].toFixed(3)}-${center[1].toFixed(3)}`;
    const cached = poiCacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < POI_CACHE_TTL_MS) return cached.data;

    // *** Parallel fetch — all types at once ***
    const results = await Promise.allSettled(
      category.maptilerType.map((type) =>
        fetch(
          `https://api.maptiler.com/geocoding/${type}.json?key=${apiKey}&proximity=${center[0]},${center[1]}&limit=20`
        ).then((r) => (r.ok ? r.json() : { features: [] }))
      )
    );

    const poiData: POIData[] = [];
    results.forEach((result) => {
      if (result.status !== "fulfilled") return;
      (result.value.features ?? []).forEach((feature: any) => {
        const [lng, lat] = feature.geometry.coordinates;
        const distance = haversineDistance(center[1], center[0], lat, lng);
        if (distance <= radius) {
          poiData.push({
            id:       feature.id || `${lng}-${lat}`,
            name:     feature.text || feature.place_name || category.id,
            category: category.id,
            latitude: lat,
            longitude: lng,
            address:  feature.place_name,
            distance,
          });
        }
      });
    });

    poiCacheRef.current.set(cacheKey, { data: poiData, timestamp: Date.now() });
    return poiData;
  }, [apiKey]);

  const createPOIMarker = useCallback((poi: POIData): maplibregl.Marker | null => {
    if (!map.current) return null;
    const category = POI_CATEGORIES.find((c) => c.id === poi.category);
    if (!category) return null;

    const el = document.createElement("div");
    el.innerHTML = `
      <div class="${category.color} text-white p-2 rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer border-2 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${POI_SVG_PATHS[category.id] ?? POI_SVG_PATHS.schools}
        </svg>
      </div>`;

    // Lazy popup — only created on first hover
    let popup: maplibregl.Popup | null = null;
    el.addEventListener("mouseenter", () => {
      if (!map.current) return;
      if (!popup) {
        popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 15 })
          .setHTML(`
            <div class="text-[13px] font-sans p-1">
              <div class="font-semibold text-[#222222] mb-1">${poi.name}</div>
              ${poi.address ? `<div class="text-[12px] text-[#717171] mb-1">${poi.address}</div>` : ""}
              ${poi.distance != null ? `<div class="text-[12px] font-medium text-[#222222]">${formatDistance(poi.distance)}</div>` : ""}
            </div>`);
      }
      popup.setLngLat([poi.longitude, poi.latitude]).addTo(map.current);
    });
    el.addEventListener("mouseleave", () => popup?.remove());

    return new maplibregl.Marker({ element: el })
      .setLngLat([poi.longitude, poi.latitude])
      .addTo(map.current);
  }, [formatDistance]);

  const loadPOIForCategory = useCallback(async (category: POICategory) => {
    if (!map.current || !mapLoadedRef.current) return;
    const center = map.current.getCenter();
    setPOILoading(true);
    const poiData = await fetchNearbyPOI(category, [center.lng, center.lat]);
    setPOILoading(false);

    // Remove old markers for this category
    poiMarkersRef.current.forEach((marker, key) => {
      if (key.startsWith(`${category.id}-`)) { marker.remove(); poiMarkersRef.current.delete(key); }
    });
    poiData.forEach((poi) => {
      const marker = createPOIMarker(poi);
      if (marker) poiMarkersRef.current.set(`${category.id}-${poi.id}`, marker);
    });
  }, [fetchNearbyPOI, createPOIMarker]);

  const togglePOICategory = useCallback((categoryId: string) => {
    setActivePOICategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
        poiMarkersRef.current.forEach((marker, key) => {
          if (key.startsWith(`${categoryId}-`)) { marker.remove(); poiMarkersRef.current.delete(key); }
        });
      } else {
        next.add(categoryId);
        const category = POI_CATEGORIES.find((c) => c.id === categoryId);
        if (category) loadPOIForCategory(category);
      }
      return next;
    });
  }, [loadPOIForCategory]);

  const clearAllPOI = useCallback(() => {
    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current.clear();
    setActivePOICategories(new Set());
  }, []);

  // ── Overlay layers (transit / traffic) ───────────────────────────────────

  const toggleTransitLayer = useCallback(() => {
    if (!map.current) return;
    const next = !showTransit;
    setShowTransit(next);
    const src = "transit-source", layer = "transit-layer";
    if (next) {
      if (!map.current.getSource(src)) map.current.addSource(src, { type: "raster", tiles: [`https://api.maptiler.com/maps/transit/256/{z}/{x}/{y}.png?key=${apiKey}`], tileSize: 256 });
      if (!map.current.getLayer(layer)) map.current.addLayer({ id: layer, type: "raster", source: src, paint: { "raster-opacity": 0.7 } });
    } else {
      if (map.current.getLayer(layer)) map.current.removeLayer(layer);
    }
  }, [showTransit, apiKey]);

  const toggleTrafficLayer = useCallback(() => {
    if (!map.current) return;
    const next = !showTraffic;
    setShowTraffic(next);
    const src = "traffic-source", layer = "traffic-layer";
    if (next) {
      if (!map.current.getSource(src)) map.current.addSource(src, { type: "raster", tiles: [`https://api.maptiler.com/maps/traffic/256/{z}/{x}/{y}.png?key=${apiKey}`], tileSize: 256 });
      if (!map.current.getLayer(layer)) map.current.addLayer({ id: layer, type: "raster", source: src, paint: { "raster-opacity": 0.7 } });
    } else {
      if (map.current.getLayer(layer)) map.current.removeLayer(layer);
    }
  }, [showTraffic, apiKey]);

  // ── Auto-refresh ──────────────────────────────────────────────────────────

  const refreshProperties = useCallback(() => {
    onRefreshRef.current?.();
  }, []);

  const toggleAutoRefresh = useCallback((enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
    if (enabled) {
      refreshProperties();
      autoRefreshIntervalRef.current = setInterval(refreshProperties, AUTO_REFRESH_INTERVAL);
    }
  }, [refreshProperties]);

  useEffect(() => () => {
    if (autoRefreshIntervalRef.current) clearInterval(autoRefreshIntervalRef.current);
  }, []);

  // ── Offline mode ──────────────────────────────────────────────────────────

  const toggleOfflineMode = useCallback(async (enabled: boolean) => {
    setOfflineModeEnabled(enabled);
    if (enabled) {
      if (!("serviceWorker" in navigator)) {
        toast.error("Offline mode is not supported in this browser.");
        setOfflineModeEnabled(false);
        return;
      }
      try {
        await navigator.serviceWorker.register("/map-cache-worker.js");
        setCacheSize(15);
      } catch {
        toast.error("Failed to enable offline mode. HTTPS is required.");
        setOfflineModeEnabled(false);
      }
    } else {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    }
  }, []);

  const clearOfflineCache = useCallback(async () => {
    if (!("caches" in window)) return;
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("map-tiles-") || k.startsWith("poi-data-")).map((k) => caches.delete(k))
      );
      setCacheSize(0);
      toast.success("Offline cache cleared.");
    } catch {
      toast.error("Failed to clear cache.");
    }
  }, []);

  // ── Map style change ──────────────────────────────────────────────────────

  const changeMapStyle = useCallback((styleId: string) => {
    if (!map.current || styleId === currentStyle) return;
    setCurrentStyle(styleId);
    setMapLoaded(false);
    map.current.setStyle(`https://api.maptiler.com/maps/${styleId}/style.json?key=${apiKey}`);
    map.current.once("style.load", () => {
      setMapLoaded(true);
      // Restore overlays after style reload
      requestAnimationFrame(() => {
        if (showHeatmapRef.current)   addHeatmapLayer();
        if (drawnPolygonRef.current)  updateDrawnPolygon(drawnPolygonRef.current);
        if (userLocationRef.current)  placeUserLocationMarker(userLocationRef.current[0], userLocationRef.current[1]);
      });
    });
  }, [currentStyle, apiKey, addHeatmapLayer, updateDrawnPolygon, placeUserLocationMarker]);

  // ── Locate me ─────────────────────────────────────────────────────────────

  const goToUserLocation = useCallback(() => {
    if (!map.current) return;
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        userLocationRef.current = coords;
        map.current?.flyTo({ center: coords, zoom: 14, duration: 2000 });
        placeUserLocationMarker(coords[0], coords[1]);
        setIsModalOpen(false);
        setIsLocating(false);
      },
      () => {
        toast.error("Unable to get your location. Please check your permissions.");
        setIsLocating(false);
      }
    );
  }, [placeUserLocationMarker]);

  // ── Map initialization ────────────────────────────────────────────────────
  // PERFORMANCE FIX: Map initializes IMMEDIATELY with fallback center.
  // Geolocation runs concurrently and flies to user when ready — never blocks paint.

  useEffect(() => {
    if (mapContainer.current && map.current) return; // already initialized
    if (!mapContainer.current) return;

    if (!apiKey) {
      setMapError("Map API key is missing. Please add NEXT_PUBLIC_MAPTILER_API_KEY to your .env file.");
      setIsLocating(false);
      return;
    }

    // Initialize immediately with fallback
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets-v4/style.json?key=${apiKey}`,
        center: FALLBACK_CENTER,
        zoom: DEFAULT_ZOOM,
      });
      map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.current.on("load", () => {
        setMapLoaded(true);
        setIsLocating(false);
        // Show user location if already obtained
        if (userLocationRef.current) {
          placeUserLocationMarker(userLocationRef.current[0], userLocationRef.current[1]);
        }
      });
      map.current.on("error", () => setMapError("Map failed to load. Please check your connection."));
    } catch {
      setMapError("Failed to initialize map. Please check your API key.");
      setIsLocating(false);
      return;
    }

    // Geolocation runs in parallel — never blocks the map
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          userLocationRef.current = coords;
          if (map.current) {
            // If map already loaded, fly immediately; otherwise wait for load
            if (mapLoadedRef.current) {
              map.current.flyTo({ center: coords, zoom: DEFAULT_ZOOM, duration: 1200 });
              placeUserLocationMarker(coords[0], coords[1]);
            } else {
              map.current.once("load", () => {
                map.current?.flyTo({ center: coords, zoom: DEFAULT_ZOOM, duration: 1200 });
                placeUserLocationMarker(coords[0], coords[1]);
              });
            }
          }
        },
        () => { /* silently fall back — map is already showing */ },
        { timeout: GEO_TIMEOUT_MS, maximumAge: 30_000, enableHighAccuracy: false }
      );
    }

    return () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      clearMarkers();
      userLocationMarker.current?.remove();
      selectedMarker.current?.remove();
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount

  // ── Selected location pin ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !selectedLocation) return;
    placeSelectedMarker(selectedLocation.lng, selectedLocation.lat);
  }, [selectedLocation, mapLoaded, placeSelectedMarker]);

  // ── Zoom tracking (debounced) ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    const handleZoomEnd = () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = setTimeout(() => {
        if (map.current) setZoomLevel(Math.round(map.current.getZoom() * 10) / 10);
      }, ZOOM_DEBOUNCE_MS);
    };
    map.current.on("zoomend", handleZoomEnd);
    return () => { map.current?.off("zoomend", handleZoomEnd); };
  }, [mapLoaded]);

  // ── Click handler (single listener, reads live refs) ─────────────────────
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    const handleClick = async (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      if (isDrawingRef.current) {
        drawingCoords.current.push([lng, lat]);
        updateDrawnPolygon(drawingCoords.current);
        return;
      }
      if (measurementModeRef.current) {
        addMeasurementPoint(lng, lat);
        return;
      }
      setSelectedProperty(null);
      placeSelectedMarker(lng, lat);
      onMapClickRef.current?.(lng, lat);
      // Fire geocode asynchronously — don't await
      reverseGeocode(lng, lat).then((addr) => {
        onLocationSelectRef.current?.(lng, lat, addr ?? undefined);
      });
    };
    map.current.on("click", handleClick);
    return () => { map.current?.off("click", handleClick); };
    // Only re-bind when map loads or drawing/measurement helpers change
  }, [mapLoaded, updateDrawnPolygon, addMeasurementPoint, placeSelectedMarker, reverseGeocode]);

  // ── Update markers when properties, zoom, or cluster mode changes ─────────
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers, zoomLevel]);

  // ── Search city / version ─────────────────────────────────────────────────
  useEffect(() => {
    if (!searchVersion || !map.current || !mapLoaded) return;
    const controller = new AbortController();

    const fitToPropertyBounds = () => {
      const props = validProperties;
      if (props.length === 0) return;
      const lngs = props.map((p) => p.longitude!);
      const lats = props.map((p) => p.latitude!);
      try {
        if (props.length === 1) {
          map.current?.flyTo({ center: [lngs[0], lats[0]], zoom: 14, duration: 1200 });
        } else {
          const [west, east, south, north] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
          west === east && south === north
            ? map.current?.flyTo({ center: [west, south], zoom: 14, duration: 1200 })
            : map.current?.fitBounds([[west, south], [east, north]], { padding: 80, maxZoom: 14, duration: 1200 });
        }
      } catch { /* ignore */ }
    };

    if (!searchCity || !apiKey) { fitToPropertyBounds(); return; }

    (async () => {
      try {
        const res = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(searchCity)}.json?key=${apiKey}&limit=1&autocomplete=false`,
          { signal: controller.signal }
        );
        if (!res.ok) { fitToPropertyBounds(); return; }
        const data = await res.json();
        const feature = data?.features?.[0];
        if (!feature) { fitToPropertyBounds(); return; }
        try {
          if (feature.bbox) {
            const [west, south, east, north] = feature.bbox;
            map.current?.fitBounds([[west, south], [east, north]], { padding: 60, maxZoom: 14, duration: 1200 });
          } else {
            const [lng, lat] = feature.geometry.coordinates;
            const t = (feature.place_type?.[0] ?? "").toLowerCase();
            const zoom = t.includes("country") ? 5 : t.includes("region") || t.includes("district") ? 9 : t.includes("neighborhood") ? 14 : 12;
            map.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 });
          }
        } catch { fitToPropertyBounds(); }
      } catch (err: any) {
        if (err?.name !== "AbortError") fitToPropertyBounds();
      }
    })();

    return () => controller.abort();
  }, [searchVersion, mapLoaded, searchCity, apiKey, validProperties]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#EBEBEB]">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Property preview card */}
      {selectedProperty && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[340px] px-4 z-20 animate-in fade-in slide-in-from-bottom-4">
          <div className="relative bg-white rounded-xl shadow-2xl p-2 border border-[#DDDDDD]">
            <button
              onClick={() => setSelectedProperty(null)}
              aria-label="Close preview"
              className="absolute top-4 right-4 z-30 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-105 shadow-sm transition-all"
            >
              <X className="w-4 h-4 text-[#222222]" />
            </button>
            <PropertyCard
              id={selectedProperty.id}
              image={selectedProperty.image || PLACEHOLDER_IMAGE}
              images={selectedProperty.images}
              price={selectedProperty.price}
              timeAgo=""
              address={selectedProperty.address || selectedProperty.title}
              beds={selectedProperty.beds}
              baths={selectedProperty.baths}
              sqft={selectedProperty.sqft}
              listingType={selectedProperty.listingType as "rent" | "sale" | "short_term" | undefined}
            />
          </div>
        </div>
      )}

      {/* Floating Toolbar (Top Center) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {!isDrawing && !drawnPolygon && (
          <button
            onClick={startDrawing}
            className="flex items-center gap-2 bg-white text-[#222222] text-[14px] font-semibold px-5 py-2.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:scale-105 transition-transform"
          >
            <Pencil className="w-4 h-4 stroke-[2]" />
            Search area
          </button>
        )}
        {isDrawing && (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            <span className="px-4 text-[14px] font-semibold text-[#717171]">Click map to draw</span>
            <button onClick={finishDrawing} className="flex items-center gap-2 bg-[#222222] text-white text-[14px] font-semibold px-4 py-2 rounded-full hover:bg-[#333] transition-colors">
              Apply
            </button>
            <button onClick={clearDrawing} className="flex items-center justify-center w-9 h-9 bg-[#F7F7F7] text-[#222222] rounded-full hover:bg-[#DDDDDD] transition-colors">
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        )}
        {drawnPolygon && !isDrawing && (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            <span className="px-4 text-[14px] font-semibold text-[#222222]">Area applied</span>
            <button onClick={clearDrawing} className="flex items-center gap-2 bg-[#F7F7F7] text-[#222222] text-[14px] font-semibold px-4 py-2 rounded-full hover:bg-[#DDDDDD] transition-colors">
              <Trash2 className="w-4 h-4 stroke-[2]" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Settings Button */}
      <div className="absolute top-6 left-6 z-10">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button aria-label="Map settings" className="bg-white rounded-full p-3 shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:scale-105 transition-transform">
              <Settings className="w-5 h-5 text-[#222222] stroke-[2]" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 rounded-2xl bg-white border-[#DDDDDD]">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-[22px] font-semibold text-[#222222]">Map settings</DialogTitle>
              <DialogDescription className="text-[15px] text-[#717171]">Customize your map view and overlay tools</DialogDescription>
            </DialogHeader>

            <div className="space-y-8 py-2">

              {/* Navigation */}
              <div>
                <button
                  onClick={goToUserLocation}
                  disabled={isLocating}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-[15px] font-semibold text-[#222222] border border-[#DDDDDD] hover:border-[#222222] rounded-xl transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <Navigation className={`w-5 h-5 stroke-[2] ${isLocating ? "animate-pulse" : ""}`} />
                    {isLocating ? "Locating..." : "Go to my location"}
                  </div>
                </button>
              </div>

              {/* Display Options */}
              <div>
                <h3 className="text-[16px] font-semibold text-[#222222] mb-4">Display options</h3>
                <div className="space-y-3">
                  {([
                    { label: "Group nearby homes", icon: <MapPin className="w-5 h-5 stroke-[1.5]" />,    active: showClusters,  toggle: () => setShowClusters((v) => !v) },
                    { label: "Price heatmap",       icon: <Layers className="w-5 h-5 stroke-[1.5]" />,   active: showHeatmap,   toggle: () => setShowHeatmap((v) => !v) },
                    { label: "Transit lines",       icon: <Bus className="w-5 h-5 stroke-[1.5]" />,      active: showTransit,   toggle: toggleTransitLayer },
                    { label: "Live traffic",        icon: <RefreshCw className="w-5 h-5 stroke-[1.5]" />, active: showTraffic,  toggle: toggleTrafficLayer },
                  ] as const).map(({ label, icon, active, toggle }) => (
                    <button key={label} onClick={toggle} className="w-full flex items-center justify-between py-2 group">
                      <div className="flex items-center gap-3 text-[15px] text-[#222222]">{icon}<span className="group-hover:underline">{label}</span></div>
                      <Toggle active={active} />
                    </button>
                  ))}
                </div>
              </div>

              {/* POIs */}
              <div>
                <h3 className="text-[16px] font-semibold text-[#222222] mb-4">Points of interest</h3>
                {poiLoading && <p className="text-[13px] text-[#717171] mb-3 animate-pulse">Loading nearby places…</p>}
                <div className="space-y-3">
                  {POI_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activePOICategories.has(cat.id);
                    return (
                      <button key={cat.id} onClick={() => togglePOICategory(cat.id)} className="w-full flex items-center justify-between py-2 group">
                        <div className="flex items-center gap-3 text-[15px] text-[#222222]">
                          <Icon className="w-5 h-5 stroke-[1.5]" /><span className="group-hover:underline">{cat.name}</span>
                        </div>
                        <Toggle active={isActive} />
                      </button>
                    );
                  })}
                </div>
                {activePOICategories.size > 0 && (
                  <button onClick={clearAllPOI} className="mt-4 text-[14px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors">
                    Clear all POIs
                  </button>
                )}
              </div>

              {/* Advanced Tools */}
              <div>
                <h3 className="text-[16px] font-semibold text-[#222222] mb-4">Advanced tools</h3>
                <div className="space-y-3">
                  {!measurementMode ? (
                    <>
                      <button onClick={() => startMeasurement("distance")} className="w-full flex items-center px-4 py-3 border border-[#DDDDDD] hover:border-[#222222] rounded-xl transition-colors gap-3">
                        <Ruler className="w-5 h-5 stroke-[2]" /><span className="text-[15px] font-semibold text-[#222222]">Measure distance</span>
                      </button>
                      <button onClick={() => startMeasurement("area")} className="w-full flex items-center px-4 py-3 border border-[#DDDDDD] hover:border-[#222222] rounded-xl transition-colors gap-3">
                        <MapPin className="w-5 h-5 stroke-[2]" /><span className="text-[15px] font-semibold text-[#222222]">Measure area</span>
                      </button>
                    </>
                  ) : (
                    <button onClick={clearMeasurement} className="w-full flex items-center px-4 py-3 border border-[#222222] bg-[#F7F7F7] rounded-xl gap-3">
                      <Trash2 className="w-5 h-5 stroke-[2]" /><span className="text-[15px] font-semibold text-[#222222]">Clear measurement</span>
                    </button>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[15px] text-[#222222]">Measurement units</span>
                    <div className="flex bg-[#F7F7F7] rounded-lg p-1 border border-[#DDDDDD]">
                      {(["metric", "imperial"] as const).map((u) => (
                        <button key={u} onClick={() => setMeasurementUnit(u)}
                          className={`px-4 py-1.5 text-[13px] font-semibold rounded-md capitalize transition-colors ${measurementUnit === u ? "bg-white shadow-sm text-[#222222]" : "text-[#717171] hover:text-[#222222]"}`}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div>
                <h3 className="text-[16px] font-semibold text-[#222222] mb-4">Performance</h3>
                <div className="space-y-3">
                  <button onClick={() => toggleAutoRefresh(!autoRefreshEnabled)} className="w-full flex items-center justify-between py-2 group">
                    <div className="flex items-center gap-3 text-[15px] text-[#222222]">
                      <RefreshCw className={`w-5 h-5 stroke-[1.5] ${autoRefreshEnabled ? "animate-spin" : ""}`} />
                      <span className="group-hover:underline">Auto-refresh listings</span>
                    </div>
                    <Toggle active={autoRefreshEnabled} />
                  </button>
                  <button onClick={() => toggleOfflineMode(!offlineModeEnabled)} className="w-full flex items-center justify-between py-2 group">
                    <div className="flex items-center gap-3 text-[15px] text-[#222222]">
                      {offlineModeEnabled ? <WifiOff className="w-5 h-5 stroke-[1.5]" /> : <Wifi className="w-5 h-5 stroke-[1.5]" />}
                      <span className="group-hover:underline">Offline mode</span>
                    </div>
                    <Toggle active={offlineModeEnabled} />
                  </button>
                  {offlineModeEnabled && cacheSize > 0 && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[14px] text-[#717171]">Cache: {cacheSize} MB</span>
                      <button onClick={clearOfflineCache} className="text-[14px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors">Clear cache</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Map Style */}
              <div className="pt-4 border-t border-[#DDDDDD]">
                <h3 className="text-[16px] font-semibold text-[#222222] mb-4">Map style</h3>
                <div className="grid grid-cols-2 gap-3">
                  {MAP_STYLES.map((style) => (
                    <button key={style.id} onClick={() => changeMapStyle(style.id)}
                      className={`px-4 py-3 text-[14px] font-semibold rounded-xl border transition-colors ${currentStyle === style.id ? "border-[#222222] ring-1 ring-[#222222] bg-[#F7F7F7] text-[#222222]" : "border-[#DDDDDD] bg-white text-[#222222] hover:border-[#222222]"}`}>
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Measurement result panel */}
      {measurementMode && (
        <div className="absolute bottom-6 left-6 bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.12)] p-6 z-20 min-w-[240px] border border-[#DDDDDD] animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[16px] font-semibold text-[#222222]">{measurementMode === "distance" ? "Distance" : "Area"}</h3>
            <button onClick={clearMeasurement} aria-label="Close" className="p-1 rounded-full hover:bg-[#F7F7F7]">
              <X className="w-4 h-4 text-[#222222]" />
            </button>
          </div>
          <div className="text-[28px] font-semibold text-[#222222] tracking-tight mb-2">
            {measurementResult
              ? formatMeasurement(measurementMode === "distance" ? measurementResult.distance! : measurementResult.area!, measurementMode)
              : `0 ${measurementMode === "distance" ? (measurementUnit === "metric" ? "m" : "ft") : (measurementUnit === "metric" ? "m²" : "ft²")}`
            }
          </div>
          {measurementMode === "area" && measurementResult?.perimeter != null && (
            <div className="text-[14px] text-[#717171]">Perimeter: {formatMeasurement(measurementResult.perimeter, "distance")}</div>
          )}
          <p className="text-[13px] text-[#717171] mt-4 pt-4 border-t border-[#DDDDDD]">
            Click map to add points.{measurementPoints.length > 0 ? " Double click to finish." : ""}
          </p>
        </div>
      )}

      {/* Loading overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-30">
          <div className="w-10 h-10 border-4 border-[#DDDDDD] border-t-[#222222] rounded-full animate-spin mb-4" />
          <p className="text-[15px] font-semibold text-[#222222] animate-pulse">Loading map…</p>
        </div>
      )}

      {/* Error overlay */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 z-30 text-center">
          <div className="w-12 h-12 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-4">
            <X className="w-6 h-6 text-[#222222]" />
          </div>
          <p className="text-[18px] text-[#222222] font-semibold mb-2">Map Error</p>
          <p className="text-[15px] text-[#717171] max-w-md">{mapError}</p>
        </div>
      )}

      <style jsx global>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .custom-scrollbar::-webkit-scrollbar       { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track  { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb  { background: #DDDDDD; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #717171; }
      `}</style>
    </div>
  );
};

export default MapView;