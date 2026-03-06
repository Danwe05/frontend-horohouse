"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import {
  MapPin, Layers, Navigation, Pencil, Trash2, Settings, X,
  Bed, Bath, Ruler, ExternalLink, School, Hospital, Utensils,
  ShoppingBag, Trees, Building2, Fuel, Bus, RefreshCw,
  Wifi, WifiOff, Download,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel, CarouselContent, CarouselItem,
  CarouselPrevious, CarouselNext,
} from "@/components/ui/carousel";
import { toast } from "sonner";

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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FALLBACK_CENTER: [number, number] = [11.5167, 3.8667];
const DEFAULT_ZOOM = 12;
const CLUSTER_MAX_ZOOM = 16;
const ZOOM_DEBOUNCE_MS = 300;
const STYLE_LOAD_TIMEOUT_MS = 500;
const POI_SEARCH_RADIUS = 5000;
const AUTO_REFRESH_INTERVAL = 60_000;
// Transparent 1×1 GIF — safe to embed inside HTML attribute strings in tooltip innerHTML
const PLACEHOLDER_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const MAP_STYLES = [
  { id: "streets-v4", name: "Streets" },
  { id: "basic-v4", name: "Basic" },
  { id: "bright-v4", name: "Bright" },
  { id: "outdoor-v4", name: "Outdoor" },
  { id: "019a3e44-212e-7306-92fa-85dd8bac3ed1", name: "Satellite" },
];

const POI_CATEGORIES: POICategory[] = [
  { id: "schools", name: "Schools", icon: School, color: "bg-purple-600", maptilerType: ["school", "university", "college"] },
  { id: "hospitals", name: "Hospitals", icon: Hospital, color: "bg-red-600", maptilerType: ["hospital", "clinic", "pharmacy"] },
  { id: "restaurants", name: "Restaurants", icon: Utensils, color: "bg-orange-600", maptilerType: ["restaurant", "cafe", "fast_food"] },
  { id: "shopping", name: "Shopping", icon: ShoppingBag, color: "bg-pink-600", maptilerType: ["shop", "supermarket", "mall"] },
  { id: "parks", name: "Parks", icon: Trees, color: "bg-green-600", maptilerType: ["park", "garden", "playground"] },
  { id: "transit", name: "Transit", icon: Bus, color: "bg-blue-600", maptilerType: ["bus_stop", "subway_entrance", "train_station"] },
  { id: "banks", name: "Banks", icon: Building2, color: "bg-indigo-600", maptilerType: ["bank", "atm"] },
  { id: "fuel", name: "Gas Stations", icon: Fuel, color: "bg-yellow-600", maptilerType: ["fuel", "charging_station"] },
];

const POI_SVG_PATHS: Record<string, string> = {
  schools: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>',
  hospitals: '<path d="M12 2v20M2 12h20M17 7h-5V2h-4v5H3v4h5v5h4v-5h5z"></path>',
  restaurants: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>',
  shopping: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>',
  parks: '<path d="M17 8c0-3.87-3.13-7-7-7s-7 3.13-7 7c0 5.25 7 13 7 13s7-7.75 7-13z"></path><circle cx="10" cy="8" r="2"></circle>',
  transit: '<path d="M8 6v6M16 6v6M2 12h20M6 16h.01M18 16h.01M8 20h8M3 8h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"></path>',
  banks: '<path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"></path>',
  fuel: '<path d="M3 22h12M4 9h10M5 2h8v18H5z"></path><path d="M18 6h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v-6M13 6h5"></path>',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${price}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const MapView = ({
  properties = [],
  onPropertyClick,
  onAreaSelect,
  onMapClick,
  selectedLocation = null,
  onLocationSelect,
}: MapViewProps) => {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, { marker: maplibregl.Marker; popup: maplibregl.Popup }>>(new Map());
  const userLocationMarker = useRef<maplibregl.Marker | null>(null);
  const selectedMarker = useRef<maplibregl.Marker | null>(null);
  const drawingCoords = useRef<[number, number][]>([]);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const styleLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const superclusterRef = useRef(new Supercluster({ radius: 60, maxZoom: 16 }));
  const poiMarkers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const poiCache = useRef<Map<string, { data: POIData[]; timestamp: number }>>(new Map());
  const measurementMarkers = useRef<maplibregl.Marker[]>([]);
  const measurementLines = useRef<string[]>([]);
  // Keep a stable ref to userLocation so map init closure doesn't go stale
  const userLocationRef = useRef<[number, number] | null>(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showClusters, setShowClusters] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [currentStyle, setCurrentStyle] = useState("streets-v4");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<[number, number][] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [showPOI, setShowPOI] = useState(false);
  const [activePOICategories, setActivePOICategories] = useState<Set<string>>(new Set());
  const [poiLoading, setPOILoading] = useState(false);
  const [measurementMode, setMeasurementMode] = useState<"distance" | "area" | null>(null);
  const [measurementPoints, setMeasurementPoints] = useState<[number, number][]>([]);
  const [measurementResult, setMeasurementResult] = useState<{ distance?: number; area?: number; perimeter?: number } | null>(null);
  const [measurementUnit, setMeasurementUnit] = useState<"metric" | "imperial">("metric");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [showTransit, setShowTransit] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [offlineModeEnabled, setOfflineModeEnabled] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  // ── Stable ref for measurementUnit so formatDistance doesn't go stale ─────
  const measurementUnitRef = useRef(measurementUnit);
  useEffect(() => { measurementUnitRef.current = measurementUnit; }, [measurementUnit]);

  // ── API key ───────────────────────────────────────────────────────────────
  const getApiKey = useCallback((): string =>
    process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "", []);

  // ── Formatting ────────────────────────────────────────────────────────────
  const formatDistance = useCallback((meters: number): string => {
    const unit = measurementUnitRef.current;
    if (unit === "imperial") {
      const feet = meters * 3.28084;
      return feet < 5280 ? `${Math.round(feet)} ft` : `${(feet / 5280).toFixed(1)} mi`;
    }
    return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
  }, []);

  const formatMeasurement = useCallback((value: number, type: "distance" | "area"): string => {
    if (type === "distance") return formatDistance(value);
    const unit = measurementUnitRef.current;
    if (unit === "imperial") {
      const sqFeet = value * 10.7639;
      return sqFeet < 43560
        ? `${Math.round(sqFeet).toLocaleString()} ft²`
        : `${(sqFeet / 43560).toFixed(2)} acres`;
    }
    return value < 10000
      ? `${Math.round(value).toLocaleString()} m²`
      : `${(value / 1_000_000).toFixed(2)} km²`;
  }, [formatDistance]);

  // ── Valid properties ──────────────────────────────────────────────────────
  const validProperties = useMemo(() =>
    properties.filter((p) => p.latitude != null && p.longitude != null),
    [properties]
  );

  // Sync supercluster when properties change
  useEffect(() => {
    if (validProperties.length === 0) return;
    superclusterRef.current.load(
      validProperties.map((p) => ({
        type: "Feature" as const,
        properties: { cluster: false, propertyId: p.id, ...p },
        geometry: { type: "Point" as const, coordinates: [p.longitude!, p.latitude!] },
      }))
    );
  }, [validProperties]);

  // ── User location ─────────────────────────────────────────────────────────
  const placeUserLocationMarker = useCallback((lng: number, lat: number) => {
    if (!map.current) return;
    userLocationMarker.current?.remove();
    const el = document.createElement("div");
    el.innerHTML = `
      <div class="relative">
        <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" style="width:20px;height:20px"></div>
        <div class="relative bg-blue-600 rounded-full border-4 border-white shadow-lg" style="width:20px;height:20px"></div>
      </div>`;
    userLocationMarker.current = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([lng, lat])
      .addTo(map.current);
  }, []);

  const placeSelectedMarker = useCallback((lng: number, lat: number) => {
    if (!map.current) return;
    selectedMarker.current?.remove();
    const el = document.createElement("div");
    el.className = "rounded-full bg-red-600 w-4 h-4 border-2 border-white shadow-lg";
    selectedMarker.current = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map.current);
    map.current.flyTo({ center: [lng, lat], zoom: Math.max(map.current.getZoom(), 14), duration: 600 });
  }, []);

  // ── Reverse geocode ───────────────────────────────────────────────────────
  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    const key = getApiKey();
    if (!key) return null;
    try {
      const res = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${key}`);
      if (!res.ok) return null;
      const data = await res.json();
      const feat = data?.features?.[0];
      if (!feat) return null;
      const label = feat.place_name || feat.properties?.label || "";
      let city = "";
      let country = "";
      (feat.context ?? []).forEach((c: any) => {
        if (!city && /^(place|locality|county|region)/.test(c.id)) city = c.text;
        if (!country && /^country/.test(c.id)) country = c.text;
      });
      return { label, city, country, raw: feat };
    } catch {
      return null;
    }
  }, [getApiKey]);

  // ── POI ───────────────────────────────────────────────────────────────────
  const fetchNearbyPOI = useCallback(async (
    category: POICategory,
    center: [number, number],
    radius = POI_SEARCH_RADIUS
  ): Promise<POIData[]> => {
    const key = getApiKey();
    if (!key) return [];

    const cacheKey = `${category.id}-${center[0].toFixed(3)}-${center[1].toFixed(3)}`;
    const cached = poiCache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300_000) return cached.data;

    const poiData: POIData[] = [];
    for (const type of category.maptilerType) {
      try {
        const res = await fetch(
          `https://api.maptiler.com/geocoding/${type}.json?key=${key}&proximity=${center[0]},${center[1]}&limit=20`
        );
        if (!res.ok) continue;
        const data = await res.json();
        (data.features ?? []).forEach((feature: any) => {
          const [lng, lat] = feature.geometry.coordinates;
          const distance = haversineDistance(center[1], center[0], lat, lng);
          if (distance <= radius) {
            poiData.push({
              id: feature.id || `${type}-${lng}-${lat}`,
              name: feature.text || feature.place_name || type,
              category: category.id,
              latitude: lat,
              longitude: lng,
              address: feature.place_name,
              distance,
              type,
            });
          }
        });
      } catch {
        // network error for this type — continue
      }
    }

    poiCache.current.set(cacheKey, { data: poiData, timestamp: Date.now() });
    return poiData;
  }, [getApiKey]);

  const createPOIMarker = useCallback((poi: POIData) => {
    if (!map.current) return null;
    const category = POI_CATEGORIES.find((c) => c.id === poi.category);
    if (!category) return null;

    const el = document.createElement("div");
    el.innerHTML = `
      <div class="${category.color} text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${POI_SVG_PATHS[category.id] ?? POI_SVG_PATHS.schools}
        </svg>
      </div>`;

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 15 })
      .setHTML(`
        <div class="text-sm">
          <div class="font-semibold mb-1">${poi.name}</div>
          ${poi.address ? `<div class="text-xs text-gray-600 mb-1">${poi.address}</div>` : ""}
          ${poi.distance != null ? `<div class="text-xs text-gray-500">${formatDistance(poi.distance)}</div>` : ""}
        </div>`);

    el.addEventListener("mouseenter", () => {
      popup.setLngLat([poi.longitude, poi.latitude]).addTo(map.current!);
    });
    el.addEventListener("mouseleave", () => popup.remove());

    return new maplibregl.Marker({ element: el })
      .setLngLat([poi.longitude, poi.latitude])
      .addTo(map.current);
  }, [formatDistance]);

  const loadPOIForCategory = useCallback(async (category: POICategory) => {
    if (!map.current || !mapLoaded) return;
    const center = map.current.getCenter();
    setPOILoading(true);
    const poiData = await fetchNearbyPOI(category, [center.lng, center.lat]);
    setPOILoading(false);

    // Clear stale markers for this category
    poiMarkers.current.forEach((marker, key) => {
      if (key.startsWith(`${category.id}-`)) { marker.remove(); poiMarkers.current.delete(key); }
    });

    poiData.forEach((poi) => {
      const marker = createPOIMarker(poi);
      if (marker) poiMarkers.current.set(`${category.id}-${poi.id}`, marker);
    });
  }, [mapLoaded, fetchNearbyPOI, createPOIMarker]);

  const togglePOICategory = useCallback((categoryId: string) => {
    setActivePOICategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
        poiMarkers.current.forEach((marker, key) => {
          if (key.startsWith(`${categoryId}-`)) { marker.remove(); poiMarkers.current.delete(key); }
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
    poiMarkers.current.forEach((m) => m.remove());
    poiMarkers.current.clear();
    setActivePOICategories(new Set());
  }, []);

  // ── Drawing ───────────────────────────────────────────────────────────────
  const updateDrawnPolygon = useCallback((coords: [number, number][]) => {
    if (!map.current || !mapLoaded) return;
    const sourceId = "drawn-polygon";
    const data: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [coords.length > 2 ? [...coords, coords[0]] : coords] },
    };
    try {
      const src = map.current.getSource(sourceId);
      if (src && src.type === "geojson") {
        (src as maplibregl.GeoJSONSource).setData(data);
      } else {
        map.current.addSource(sourceId, { type: "geojson", data });
        if (!map.current.getLayer("drawn-polygon-layer")) {
          map.current.addLayer({ id: "drawn-polygon-layer", type: "fill", source: sourceId, paint: { "fill-color": "#3b82f6", "fill-opacity": 0.2 } });
        }
        if (!map.current.getLayer("drawn-polygon-outline")) {
          map.current.addLayer({ id: "drawn-polygon-outline", type: "line", source: sourceId, paint: { "line-color": "#3b82f6", "line-width": 2 } });
        }
      }
    } catch { /* ignore */ }
  }, [mapLoaded]);

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
      setDrawnPolygon(drawingCoords.current);
      onAreaSelect?.(drawingCoords.current);
    }
  }, [onAreaSelect]);

  // ── Measurement ───────────────────────────────────────────────────────────
  const updateMeasurementLines = useCallback((points: [number, number][], mode: "distance" | "area" | null) => {
    if (!map.current || points.length < 2) return;

    measurementLines.current.forEach((id) => {
      if (map.current!.getLayer(id)) map.current!.removeLayer(id);
      if (map.current!.getSource(id)) map.current!.removeSource(id);
    });
    measurementLines.current = [];

    const lineCoords = mode === "area" && points.length >= 3 ? [...points, points[0]] : points;
    const lineId = `measurement-line-${Date.now()}`;
    measurementLines.current.push(lineId);

    try {
      map.current.addSource(lineId, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: lineCoords } },
      });
      map.current.addLayer({
        id: lineId, type: "line", source: lineId,
        paint: { "line-color": "#3b82f6", "line-width": 3, "line-dasharray": [2, 2] },
      });

      if (mode === "area" && points.length >= 3) {
        const fillId = `measurement-fill-${Date.now()}`;
        measurementLines.current.push(fillId);
        map.current.addSource(fillId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...points, points[0]]] } },
        });
        map.current.addLayer({ id: fillId, type: "fill", source: fillId, paint: { "fill-color": "#3b82f6", "fill-opacity": 0.2 } });
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
      const [lng1, lat1] = closed[i], [lng2, lat2] = closed[i + 1];
      area += lng1 * lat2 - lng2 * lat1;
    }
    const metersPerDegree = 111320;
    const areaSqm = Math.abs(area) / 2 * metersPerDegree ** 2 * Math.cos((points[0][1] * Math.PI) / 180);
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const [lng1, lat1] = points[i], [lng2, lat2] = points[(i + 1) % points.length];
      perimeter += haversineDistance(lat1, lng1, lat2, lng2);
    }
    setMeasurementResult({ area: areaSqm, perimeter });
  }, []);

  const addMeasurementPoint = useCallback((lng: number, lat: number, currentMode: "distance" | "area" | null, currentPoints: [number, number][]) => {
    const newPoints: [number, number][] = [...currentPoints, [lng, lat]];
    setMeasurementPoints(newPoints);

    const el = document.createElement("div");
    el.innerHTML = `<div class="w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>`;
    measurementMarkers.current.push(
      new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current!)
    );

    if (currentMode === "distance" && newPoints.length >= 2) calculateDistance(newPoints);
    else if (currentMode === "area" && newPoints.length >= 3) calculateArea(newPoints);

    updateMeasurementLines(newPoints, currentMode);
  }, [calculateDistance, calculateArea, updateMeasurementLines]);

  const clearMeasurement = useCallback(() => {
    measurementMarkers.current.forEach((m) => m.remove());
    measurementMarkers.current = [];
    measurementLines.current.forEach((id) => {
      if (map.current?.getLayer(id)) map.current.removeLayer(id);
      if (map.current?.getSource(id)) map.current.removeSource(id);
    });
    measurementLines.current = [];
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

  const finishMeasurement = useCallback(() => {
    setMeasurementMode(null);
    if (map.current) map.current.getCanvas().style.cursor = "";
  }, []);

  // ── Heatmap ───────────────────────────────────────────────────────────────
  const addHeatmapLayer = useCallback(() => {
    if (!map.current || !mapLoaded || validProperties.length === 0) return;
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
      if (map.current.getSource("properties-heat")) map.current.removeSource("properties-heat");
      map.current.addSource("properties-heat", { type: "geojson", data });
      map.current.addLayer({
        id: "properties-heatmap", type: "heatmap", source: "properties-heat",
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "price"], 0, 0, 100000, 0.5, 1000000, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
          "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(33,102,172,0)", 0.2, "rgb(103,169,207)", 0.4, "rgb(209,229,240)",
            0.6, "rgb(253,219,199)", 0.8, "rgb(239,138,98)", 1, "rgb(178,24,43)"],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
          "heatmap-opacity": 0.8,
        },
      });
    } catch { /* ignore */ }
  }, [validProperties, mapLoaded]);

  const removeHeatmapLayer = useCallback(() => {
    if (!map.current) return;
    try {
      if (map.current.getLayer("properties-heatmap")) map.current.removeLayer("properties-heatmap");
      if (map.current.getSource("properties-heat")) map.current.removeSource("properties-heat");
    } catch { /* ignore */ }
  }, []);

  // ── Markers ───────────────────────────────────────────────────────────────
  const clearMarkers = useCallback(() => {
    markers.current.forEach(({ marker, popup }) => { popup.remove(); marker.remove(); });
    markers.current.clear();
  }, []);

  const createTooltipContent = useCallback((property: Property): string => {
    const images = property.images?.length ? property.images : property.image ? [property.image] : [];
    const img = images[0] ?? "";
    const isRent = property.listingType?.toLowerCase() === "rent";
    return `
      <div class="min-w-[200px] max-w-[250px]">
        ${img ? `<img src="${img}" alt="${property.title}" class="w-full h-32 object-cover rounded-t-lg mb-2 bg-slate-100" />` : '<div class="w-full h-32 bg-slate-100 rounded-t-lg mb-2 flex items-center justify-center text-xs text-slate-400">No image</div>'}
        <div class="px-1">
          <div class="font-bold text-base mb-1">${formatPriceCompact(property.price)} XAF${isRent ? "/mo" : ""}</div>
          ${property.type ? `<div class="text-xs text-gray-600 mb-1">${property.type}</div>` : ""}
          ${property.address ? `<div class="text-xs text-gray-500 mb-2">${property.address}</div>` : ""}
          <div class="flex items-center gap-2 text-xs text-gray-600">
            ${property.sqft ? `<span>${property.sqft}</span>` : ""}
            ${property.beds ? `<span>${property.beds} bd</span>` : ""}
            ${property.baths ? `<span>${property.baths} ba</span>` : ""}
          </div>
        </div>
      </div>`;
  }, []);

  const createMarker = useCallback((property: Property) => {
    if (!map.current || !property.latitude || !property.longitude) return null;
    const isRent = property.listingType?.toLowerCase() === "rent";
    const el = document.createElement("div");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${property.title}, ${formatPriceCompact(property.price)} XAF`);
    el.innerHTML = `
      <div class="${isRent ? "bg-blue-600" : "bg-green-600"} text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg hover:scale-110 transition-transform cursor-pointer">
        ${formatPriceCompact(property.price)}
      </div>`;

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 25, className: "property-tooltip" })
      .setHTML(createTooltipContent(property));

    el.addEventListener("mouseenter", () => popup.setLngLat([property.longitude!, property.latitude!]).addTo(map.current!));
    el.addEventListener("mouseleave", () => popup.remove());
    el.addEventListener("click", (e) => { e.stopPropagation(); setSelectedProperty(property); });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([property.longitude, property.latitude])
      .addTo(map.current);
    return { marker, popup };
  }, [createTooltipContent]);

  const getClusters = useCallback(() => {
    if (!map.current) return [];
    const bounds = map.current.getBounds();
    return superclusterRef.current.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      Math.floor(map.current.getZoom())
    );
  }, []);

  const createClusterMarker = useCallback((cluster: any) => {
    if (!map.current) return null;
    const count = cluster.properties.point_count;
    const sizeClass = count > 20 ? "w-16 h-16 text-lg" : count > 10 ? "w-14 h-14 text-base" : "w-12 h-12 text-sm";
    const el = document.createElement("div");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Cluster of ${count} properties`);
    el.innerHTML = `
      <div class="bg-purple-600 text-white ${sizeClass} rounded-full flex items-center justify-center font-bold shadow-lg hover:scale-110 transition-transform cursor-pointer border-4 border-white">
        ${count > 99 ? "99+" : count}
      </div>`;

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 25 })
      .setHTML(`<div class="text-center font-semibold">${count} properties</div>`);

    const [lng, lat] = cluster.geometry.coordinates;
    el.addEventListener("mouseenter", () => popup.setLngLat([lng, lat]).addTo(map.current!));
    el.addEventListener("mouseleave", () => popup.remove());
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const zoom = superclusterRef.current.getClusterExpansionZoom(cluster.id);
      map.current?.flyTo({ center: [lng, lat], zoom, duration: 800 });
    });

    const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current);
    return { marker, popup };
  }, []);

  const updateMarkers = useCallback(() => {
    if (!map.current || !mapLoaded || validProperties.length === 0) { clearMarkers(); return; }
    clearMarkers();
    const zoom = map.current.getZoom();

    if (showClusters && validProperties.length > 5 && zoom < CLUSTER_MAX_ZOOM) {
      getClusters().forEach((cluster: any) => {
        if (cluster.properties.cluster) {
          const result = createClusterMarker(cluster);
          if (result) markers.current.set(`cluster-${cluster.id}`, result);
        } else {
          const prop = validProperties.find((p) => p.id === cluster.properties.propertyId);
          if (prop) {
            const result = createMarker(prop);
            if (result) markers.current.set(prop.id, result);
          }
        }
      });
    } else {
      validProperties.forEach((prop) => {
        const result = createMarker(prop);
        if (result) markers.current.set(prop.id, result);
      });
    }
  }, [validProperties, mapLoaded, showClusters, getClusters, createMarker, createClusterMarker, clearMarkers]);

  // ── Layers: transit / traffic ─────────────────────────────────────────────
  const toggleTransitLayer = useCallback(() => {
    if (!map.current) return;
    const next = !showTransit;
    setShowTransit(next);
    const key = getApiKey();
    const src = "transit-source", layer = "transit-layer";
    if (next) {
      if (!map.current.getSource(src)) map.current.addSource(src, { type: "raster", tiles: [`https://api.maptiler.com/maps/transit/256/{z}/{x}/{y}.png?key=${key}`], tileSize: 256 });
      if (!map.current.getLayer(layer)) map.current.addLayer({ id: layer, type: "raster", source: src, paint: { "raster-opacity": 0.7 } });
    } else {
      if (map.current.getLayer(layer)) map.current.removeLayer(layer);
    }
  }, [showTransit, getApiKey]);

  const toggleTrafficLayer = useCallback(() => {
    if (!map.current) return;
    const next = !showTraffic;
    setShowTraffic(next);
    const key = getApiKey();
    const src = "traffic-source", layer = "traffic-layer";
    if (next) {
      if (!map.current.getSource(src)) map.current.addSource(src, { type: "raster", tiles: [`https://api.maptiler.com/maps/traffic/256/{z}/{x}/{y}.png?key=${key}`], tileSize: 256 });
      if (!map.current.getLayer(layer)) map.current.addLayer({ id: layer, type: "raster", source: src, paint: { "raster-opacity": 0.7 } });
    } else {
      if (map.current.getLayer(layer)) map.current.removeLayer(layer);
    }
  }, [showTraffic, getApiKey]);

  // ── Auto-refresh ──────────────────────────────────────────────────────────
  // Use a ref for the callback so the interval always calls the latest version
  const refreshProperties = useCallback(() => {
    setLastRefreshTime(new Date());
    // Wire up real property refresh from your API here when ready
  }, []);

  const refreshPropertiesRef = useRef(refreshProperties);
  useEffect(() => { refreshPropertiesRef.current = refreshProperties; }, [refreshProperties]);

  const toggleAutoRefresh = useCallback((enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    if (enabled) {
      refreshPropertiesRef.current();
      autoRefreshIntervalRef.current = setInterval(() => refreshPropertiesRef.current(), AUTO_REFRESH_INTERVAL);
    } else {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    }
  }, []);

  // Clean up interval on unmount
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
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
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

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const apiKey = getApiKey();

    if (!apiKey) {
      setMapError("Map API key is missing. Please add NEXT_PUBLIC_MAPTILER_API_KEY to your .env file.");
      setIsLocating(false);
      return;
    }

    const initMap = (center: [number, number]) => {
      try {
        // Capture the initial style — use a local variable to avoid closure on state
        const initialStyle = "streets-v4";
        map.current = new maplibregl.Map({
          container: mapContainer.current!,
          style: `https://api.maptiler.com/maps/${initialStyle}/style.json?key=${apiKey}`,
          center,
          zoom: DEFAULT_ZOOM,
        });
        map.current.addControl(new maplibregl.NavigationControl(), "top-right");
        map.current.on("load", () => {
          setMapLoaded(true);
          if (userLocationRef.current) {
            placeUserLocationMarker(userLocationRef.current[0], userLocationRef.current[1]);
          }
        });
        map.current.on("error", () => setMapError("Map failed to load. Please check your connection."));
      } catch {
        setMapError("Failed to initialize map. Please check your API key.");
      }
    };

    if (!("geolocation" in navigator)) {
      initMap(FALLBACK_CENTER);
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        userLocationRef.current = coords;
        setUserLocation(coords);
        initMap(coords);
        setIsLocating(false);
      },
      () => {
        initMap(FALLBACK_CENTER);
        setIsLocating(false);
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );

    return () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      if (styleLoadTimeoutRef.current) clearTimeout(styleLoadTimeoutRef.current);
      clearMarkers();
      userLocationMarker.current?.remove();
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — map init runs once

  // Sync user location marker when state updates after init
  useEffect(() => {
    if (userLocation && map.current && mapLoaded) {
      userLocationRef.current = userLocation;
      placeUserLocationMarker(userLocation[0], userLocation[1]);
    }
  }, [userLocation, mapLoaded, placeUserLocationMarker]);

  // Zoom tracking
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const handleZoomEnd = () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = setTimeout(() => {
        if (map.current) setZoomLevel(Math.round(map.current.getZoom() * 10) / 10);
      }, ZOOM_DEBOUNCE_MS);
    };
    map.current.on("zoomend", handleZoomEnd);
    return () => { map.current?.off("zoomend", handleZoomEnd); };
  }, [mapLoaded]);

  // Selected location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedLocation) return;
    placeSelectedMarker(selectedLocation.lng, selectedLocation.lat);
  }, [selectedLocation, mapLoaded, placeSelectedMarker]);

  // Map click handler — reads measurementMode/Points from refs to avoid stale closures
  const measurementModeRef = useRef(measurementMode);
  const measurementPointsRef = useRef(measurementPoints);
  useEffect(() => { measurementModeRef.current = measurementMode; }, [measurementMode]);
  useEffect(() => { measurementPointsRef.current = measurementPoints; }, [measurementPoints]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleClick = async (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;

      if (isDrawing) {
        drawingCoords.current.push([lng, lat]);
        updateDrawnPolygon(drawingCoords.current);
        return;
      }

      if (measurementModeRef.current) {
        addMeasurementPoint(lng, lat, measurementModeRef.current, measurementPointsRef.current);
        return;
      }

      placeSelectedMarker(lng, lat);
      onMapClick?.(lng, lat);
      const addr = await reverseGeocode(lng, lat);
      onLocationSelect?.(lng, lat, addr ?? undefined);
    };

    map.current.on("click", handleClick);
    return () => { map.current?.off("click", handleClick); };
  }, [isDrawing, mapLoaded, updateDrawnPolygon, addMeasurementPoint, onMapClick, placeSelectedMarker, reverseGeocode, onLocationSelect]);

  // Update markers on zoom or property change
  useEffect(() => { updateMarkers(); }, [updateMarkers, zoomLevel]);

  // Heatmap toggle
  useEffect(() => {
    if (!mapLoaded) return;
    showHeatmap ? addHeatmapLayer() : removeHeatmapLayer();
  }, [showHeatmap, mapLoaded, addHeatmapLayer, removeHeatmapLayer]);

  // ── Style change ──────────────────────────────────────────────────────────
  const changeMapStyle = useCallback((styleId: string) => {
    if (!map.current) return;
    const key = getApiKey();
    setMapLoaded(false);
    map.current.setStyle(`https://api.maptiler.com/maps/${styleId}/style.json?key=${key}`);
    setCurrentStyle(styleId);

    if (styleLoadTimeoutRef.current) clearTimeout(styleLoadTimeoutRef.current);

    map.current.once("style.load", () => {
      styleLoadTimeoutRef.current = setTimeout(() => {
        setMapLoaded(true);
        setTimeout(() => {
          if (showHeatmap) addHeatmapLayer();
          if (drawnPolygon) updateDrawnPolygon(drawnPolygon);
          if (userLocationRef.current) placeUserLocationMarker(userLocationRef.current[0], userLocationRef.current[1]);
        }, 100);
      }, STYLE_LOAD_TIMEOUT_MS);
    });
  }, [getApiKey, showHeatmap, drawnPolygon, addHeatmapLayer, updateDrawnPolygon, placeUserLocationMarker]);

  // ── Go to user location ───────────────────────────────────────────────────
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
        setUserLocation(coords);
        map.current?.flyTo({ center: coords, zoom: 14, duration: 2000 });
        placeUserLocationMarker(coords[0], coords[1]);
        setIsModalOpen(false);
        setIsLocating(false);
      },
      () => {
        toast.error("Unable to get your location. Please enable location services.");
        setIsLocating(false);
      }
    );
  }, [placeUserLocationMarker]);

  // ── Property preview ──────────────────────────────────────────────────────
  const handlePropertyView = useCallback(() => {
    if (selectedProperty) onPropertyClick?.(selectedProperty.id);
  }, [selectedProperty, onPropertyClick]);

  const selectedPropertyImages = useMemo(() => {
    if (!selectedProperty) return [PLACEHOLDER_IMAGE];
    const imgs = selectedProperty.images?.length ? selectedProperty.images : selectedProperty.image ? [selectedProperty.image] : [];
    return imgs.length > 0 ? imgs : [PLACEHOLDER_IMAGE];
  }, [selectedProperty]);

  // ── Toggle switch helper ──────────────────────────────────────────────────
  const Toggle = ({ active, color = "bg-blue-600" }: { active: boolean; color?: string }) => (
    <div className={`w-10 h-5 rounded-full transition-colors ${active ? color : "bg-gray-300"} relative`}>
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${active ? "translate-x-5" : ""}`} />
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Property preview card */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20">
          <Card className="overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedProperty(null)}
              aria-label="Close preview"
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative h-48">
              {selectedPropertyImages.length > 1 ? (
                <Carousel className="w-full" opts={{ loop: true }}>
                  <CarouselContent className="ml-0">
                    {selectedPropertyImages.map((img, i) => (
                      <CarouselItem key={i} className="pl-0">
                        <img
                          src={img}
                          alt={`${selectedProperty.address ?? "Property"} — photo ${i + 1}`}
                          loading="lazy"
                          className="w-full h-48 object-cover"
                          onError={(e) => { (e.currentTarget).src = PLACEHOLDER_IMAGE; }}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div onClick={(e) => e.preventDefault()}>
                    <CarouselPrevious className="left-2 bg-white/80 backdrop-blur-sm text-gray-800 border-0 hover:bg-white" />
                    <CarouselNext className="right-2 bg-white/80 backdrop-blur-sm text-gray-800 border-0 hover:bg-white" />
                  </div>
                </Carousel>
              ) : (
                <img
                  src={selectedPropertyImages[0]}
                  alt={selectedProperty.address ?? "Property"}
                  loading="lazy"
                  className="w-full h-48 object-cover"
                  onError={(e) => { (e.currentTarget).src = PLACEHOLDER_IMAGE; }}
                />
              )}

              {selectedProperty.listingType && (
                <Badge className={`absolute top-3 left-3 ${selectedProperty.listingType.toLowerCase() === "rent" ? "bg-blue-600" : "bg-green-600"}`}>
                  {selectedProperty.listingType.toUpperCase()}
                </Badge>
              )}
            </div>

            <CardContent className="p-4">
              <div className="mb-2">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-2xl font-bold">{selectedProperty.price.toLocaleString()} XAF</span>
                  {selectedProperty.listingType?.toLowerCase() === "rent" && (
                    <span className="text-sm text-gray-500">/month</span>
                  )}
                </div>
                {selectedProperty.type && <p className="text-sm font-medium text-gray-700">{selectedProperty.type}</p>}
              </div>

              {selectedProperty.address && <p className="text-sm text-gray-600 mb-3">{selectedProperty.address}</p>}

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                {selectedProperty.sqft && <div className="flex items-center gap-1.5"><Ruler className="h-4 w-4" /><span>{selectedProperty.sqft}</span></div>}
                {(selectedProperty.beds ?? 0) > 0 && <div className="flex items-center gap-1.5"><Bed className="h-4 w-4" /><span>{selectedProperty.beds}</span></div>}
                {(selectedProperty.baths ?? 0) > 0 && <div className="flex items-center gap-1.5"><Bath className="h-4 w-4" /><span>{selectedProperty.baths}</span></div>}
              </div>

              <button
                onClick={handlePropertyView}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                View Details
                <ExternalLink className="w-4 h-4" />
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings */}
      <div className="absolute top-4 left-4 z-10">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button
              aria-label="Open map settings"
              className="bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto scrollbar-hide">
            <DialogHeader>
              <DialogTitle>Map Controls</DialogTitle>
              <DialogDescription>Customize your map view and tools</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Navigation */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Navigation</h3>
                <button
                  onClick={goToUserLocation}
                  disabled={isLocating}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Navigation className={`w-5 h-5 ${isLocating ? "animate-pulse" : ""}`} />
                  {isLocating ? "Locating…" : "Go to My Location"}
                </button>
              </div>

              {/* Display options */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Display Options</h3>
                <div className="space-y-2">
                  {[
                    { label: "Clustering", icon: <MapPin className="w-5 h-5" />, active: showClusters, toggle: () => setShowClusters((v) => !v), activeColor: "bg-blue-600", activeBg: "bg-blue-50 text-blue-700 border-2 border-blue-200" },
                    { label: "Heatmap", icon: <Layers className="w-5 h-5" />, active: showHeatmap, toggle: () => setShowHeatmap((v) => !v), activeColor: "bg-red-600", activeBg: "bg-red-50 text-red-700 border-2 border-red-200" },
                    { label: "Transit Lines", icon: <Bus className="w-5 h-5" />, active: showTransit, toggle: toggleTransitLayer, activeColor: "bg-blue-600", activeBg: "bg-blue-50 text-blue-700 border-2 border-blue-200" },
                    { label: "Traffic", icon: <div className="w-5 h-5 flex items-center justify-center"><div className="w-4 h-4 border-2 border-current rounded-full border-t-transparent animate-spin" style={{ animationDuration: "3s" }} /></div>, active: showTraffic, toggle: toggleTrafficLayer, activeColor: "bg-orange-600", activeBg: "bg-orange-50 text-orange-700 border-2 border-orange-200" },
                  ].map(({ label, icon, active, toggle, activeColor, activeBg }) => (
                    <button key={label} onClick={toggle}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active ? activeBg : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                    >
                      <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
                      <Toggle active={active} color={activeColor} />
                    </button>
                  ))}
                </div>
              </div>

              {/* POI */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Points of Interest</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {POI_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activePOICategories.has(cat.id);
                    return (
                      <button key={cat.id} onClick={() => togglePOICategory(cat.id)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive ? `${cat.color.replace("bg-", "bg-opacity-10 bg-")} ${cat.color.replace("bg-", "text-")} border-2 ${cat.color.replace("bg-", "border-")}` : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                      >
                        <div className="flex items-center gap-3"><Icon className="w-4 h-4" /><span>{cat.name}</span></div>
                        <Toggle active={isActive} color={cat.color} />
                      </button>
                    );
                  })}
                </div>
                {activePOICategories.size > 0 && (
                  <button onClick={clearAllPOI} className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                    <X className="w-4 h-4" /> Clear All POI
                  </button>
                )}
                {poiLoading && <p className="mt-2 text-xs text-center text-gray-500">Loading POI…</p>}
              </div>

              {/* Drawing */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Drawing Tools</h3>
                <div className="space-y-2">
                  {!isDrawing && !drawnPolygon && (
                    <button onClick={startDrawing} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <Pencil className="w-5 h-5" /> Draw Search Area
                    </button>
                  )}
                  {isDrawing && (
                    <button onClick={finishDrawing} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium bg-green-50 text-green-700 border-2 border-green-200 rounded-lg">
                      <Pencil className="w-5 h-5" /> Finish Drawing
                    </button>
                  )}
                  {drawnPolygon && (
                    <button onClick={clearDrawing} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" /> Clear Drawn Area
                    </button>
                  )}
                </div>
              </div>

              {/* Measurement */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Measurement Tools</h3>
                <div className="space-y-2">
                  {!measurementMode ? (
                    <>
                      <button onClick={() => startMeasurement("distance")} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <Ruler className="w-5 h-5" /> Measure Distance
                      </button>
                      <button onClick={() => startMeasurement("area")} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <MapPin className="w-5 h-5" /> Measure Area
                      </button>
                    </>
                  ) : (
                    <button onClick={clearMeasurement} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" /> Clear Measurement
                    </button>
                  )}
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Units</span>
                    <div className="flex bg-white rounded-md shadow-sm p-1">
                      {(["metric", "imperial"] as const).map((u) => (
                        <button key={u} onClick={() => setMeasurementUnit(u)}
                          className={`px-3 py-1 text-xs font-medium rounded capitalize ${measurementUnit === u ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance & Offline */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Performance & Offline</h3>
                <div className="space-y-2">
                  <button onClick={() => toggleAutoRefresh(!autoRefreshEnabled)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${autoRefreshEnabled ? "bg-green-50 text-green-700 border-2 border-green-200" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className={`w-5 h-5 ${autoRefreshEnabled ? "animate-spin" : ""}`} />
                      <span>Auto-refresh</span>
                    </div>
                    <Toggle active={autoRefreshEnabled} color="bg-green-600" />
                  </button>

                  <button onClick={() => toggleOfflineMode(!offlineModeEnabled)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${offlineModeEnabled ? "bg-purple-50 text-purple-700 border-2 border-purple-200" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                  >
                    <div className="flex items-center gap-3">
                      {offlineModeEnabled ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                      <span>Offline Mode</span>
                    </div>
                    <Toggle active={offlineModeEnabled} color="bg-purple-600" />
                  </button>

                  {offlineModeEnabled && (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Cache Size</span>
                        <span className="font-medium">{cacheSize} MB</span>
                      </div>
                      <button onClick={clearOfflineCache} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3 h-3" /> Clear Cache
                      </button>
                    </div>
                  )}

                  {lastRefreshTime && (
                    <p className="text-xs text-center text-gray-400">
                      Last refreshed: {lastRefreshTime.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Map Style */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Map Style</h3>
                <div className="grid grid-cols-2 gap-2">
                  {MAP_STYLES.map((style) => (
                    <button key={style.id} onClick={() => changeMapStyle(style.id)}
                      className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${currentStyle === style.id ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                    >
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-20 min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-800">
              {measurementMode === "distance" ? "Distance" : "Area"} Measurement
            </h3>
            <button onClick={finishMeasurement} aria-label="Close measurement panel">
              <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {measurementResult
              ? formatMeasurement(
                measurementMode === "distance" ? measurementResult.distance! : measurementResult.area!,
                measurementMode
              )
              : `0 ${measurementMode === "distance" ? (measurementUnit === "metric" ? "m" : "ft") : (measurementUnit === "metric" ? "m²" : "ft²")}`
            }
          </div>
          {measurementMode === "area" && measurementResult?.perimeter != null && (
            <div className="text-xs text-gray-500">
              Perimeter: {formatMeasurement(measurementResult.perimeter, "distance")}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Click map to add points.{measurementPoints.length > 0 ? " Double click to finish." : ""}
          </p>
        </div>
      )}

      {/* Drawing indicator */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-10">
          Click on the map to draw points. Press "Finish Drawing" when done.
        </div>
      )}

      {/* Error overlay */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 p-4 z-30">
          <p className="text-sm text-red-400 font-semibold mb-2">Map Error</p>
          <p className="text-xs text-gray-300 text-center max-w-md">{mapError}</p>
        </div>
      )}

      {/* Loading overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/30 z-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
            <p className="text-sm text-gray-600">
              {isLocating ? "Getting your location…" : "Loading map…"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;