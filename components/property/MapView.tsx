"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Layers, Navigation, Pencil, Trash2, Settings, X, Bed, Bath, Ruler, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

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

interface MapViewProps {
  properties?: Property[];
  onPropertyClick?: (propertyId: string) => void;
  onAreaSelect?: (coordinates: [number, number][]) => void;
  onMapClick?: (lng: number, lat: number) => void;
  selectedLocation?: { lng: number; lat: number } | null;
  onLocationSelect?: (lng: number, lat: number, address?: { label?: string; city?: string; country?: string; raw?: any }) => void;
}

// Constants
const FALLBACK_CENTER: [number, number] = [11.5167, 3.8667]; // Douala, Cameroon
const DEFAULT_ZOOM = 12;
const MAX_ZOOM = 18;
const CLUSTER_MAX_ZOOM = 16;
const ZOOM_INCREMENT = 2;
const ZOOM_DEBOUNCE_MS = 300;
const STYLE_LOAD_TIMEOUT_MS = 500;

const MAP_STYLES = [
  { id: "streets-v2", name: "Streets" },
  { id: "basic-v2", name: "Basic" },
  { id: "bright-v2", name: "Bright" },
  { id: "outdoor-v2", name: "Outdoor" },
  { id: "019a3e44-212e-7306-92fa-85dd8bac3ed1", name: "Satellite" },
];

const MapView = ({ properties = [], onPropertyClick, onAreaSelect, onMapClick, selectedLocation = null, onLocationSelect }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, { marker: maplibregl.Marker; popup: maplibregl.Popup }>>(new Map());
  const userLocationMarker = useRef<maplibregl.Marker | null>(null);
  const drawingCoords = useRef<[number, number][]>([]);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const styleLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showClusters, setShowClusters] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [currentStyle, setCurrentStyle] = useState("streets-v2");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<[number, number][] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const selectedMarker = useRef<maplibregl.Marker | null>(null);

  const getApiKey = useCallback((): string => {
    return process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "demo-key";
  }, []);

  // Get user's current location
  const getUserLocation = useCallback((): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          resolve(coords);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          reject(error);
        },
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
      );
    });
  }, []);

  const placeUserLocationMarker = useCallback((lng: number, lat: number) => {
    if (!map.current) return;
    
    try {
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
      }

      const el = document.createElement('div');
      el.className = 'relative';
      el.innerHTML = `
        <div class="relative">
          <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" style="width: 20px; height: 20px;"></div>
          <div class="relative bg-blue-600 rounded-full border-4 border-white shadow-lg" style="width: 20px; height: 20px;"></div>
        </div>
      `;

      userLocationMarker.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map.current);
    } catch (err) {
      console.error("Error placing user location marker:", err);
    }
  }, []);

  const placeSelectedMarker = useCallback((lng: number, lat: number) => {
    if (!map.current) return;
    try {
      if (selectedMarker.current) {
        selectedMarker.current.remove();
        selectedMarker.current = null;
      }

      const el = document.createElement('div');
      el.className = 'rounded-full bg-red-600 w-4 h-4 border-2 border-white shadow-lg';

      selectedMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current);

      map.current.flyTo({ center: [lng, lat], zoom: Math.max(map.current.getZoom(), 14), duration: 600 });
    } catch (err) {
      console.error("Error placing selected marker:", err);
    }
  }, []);

  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    const key = getApiKey();
    if (!key || key === 'demo-key') return null;
    try {
      const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${key}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const feat = data?.features?.[0];
      if (!feat) return null;
      const label = feat.place_name || feat.properties?.label || '';
      let city = '';
      let country = '';
      if (feat.context && Array.isArray(feat.context)) {
        feat.context.forEach((c: any) => {
          if (c.id?.startsWith('place')) city = city || c.text;
          if (c.id?.startsWith('country')) country = country || c.text;
        });
      }
      city = city || feat.properties?.locality || feat.properties?.county || '';
      country = country || feat.properties?.country || '';
      return { label, city, country, raw: feat };
    } catch (err) {
      return null;
    }
  }, [getApiKey]);

  const formatPrice = useCallback((price: number): string => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)}B`.replace(".0B", "B");
    } else if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`.replace(".0M", "M");
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}k`.replace(".0k", "k");
    }
    return `${price}`;
  }, []);

  const getDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Memoize valid properties to avoid recalculation
  const validProperties = useMemo(() => 
    properties.filter(p => p.latitude !== undefined && p.longitude !== undefined),
    [properties]
  );

  const clusterProperties = useCallback((props: Property[], zoom: number) => {
    const clusters: { lat: number; lng: number; properties: Property[] }[] = [];
    const clustered = new Set<string>();
    const distanceThreshold = Math.pow(2, 15 - zoom) * 100;

    props.forEach((prop) => {
      if (clustered.has(prop.id) || !prop.latitude || !prop.longitude) return;

      const nearby: Property[] = [];
      
      props.forEach((p) => {
        if (clustered.has(p.id) || !p.latitude || !p.longitude) return;
        const distance = getDistance(prop.latitude!, prop.longitude!, p.latitude!, p.longitude!);
        if (distance <= distanceThreshold) {
          nearby.push(p);
        }
      });

      nearby.forEach((p) => clustered.add(p.id));
      const avgLat = nearby.reduce((sum, p) => sum + p.latitude!, 0) / nearby.length;
      const avgLng = nearby.reduce((sum, p) => sum + p.longitude!, 0) / nearby.length;

      clusters.push({ lat: avgLat, lng: avgLng, properties: nearby });
    });

    return clusters;
  }, [getDistance]);

  const createTooltipContent = useCallback((property: Property): string => {
    const imageArray = property.images && property.images.length > 0 ? property.images : (property.image ? [property.image] : []);
    const displayImage = imageArray[0] || '/placeholder.jpg';
    const isRent = property.listingType?.toLowerCase() === "rent";
    
    return `
      <div class="min-w-[200px] max-w-[250px]">
        <img src="${displayImage}" alt="${property.title}" class="w-full h-32 object-cover rounded-t-lg mb-2" onerror="this.src='/placeholder.jpg'"/>
        <div class="px-1">
          <div class="font-bold text-base mb-1">${formatPrice(property.price)} XAF${isRent ? '/mo' : ''}</div>
          ${property.type ? `<div class="text-xs text-gray-600 mb-1">${property.type}</div>` : ''}
          ${property.address ? `<div class="text-xs text-gray-500 mb-2">${property.address}</div>` : ''}
          <div class="flex items-center gap-2 text-xs text-gray-600">
            ${property.sqft ? `<span>📏 ${property.sqft}</span>` : ''}
            ${property.beds ? `<span>🛏️ ${property.beds}</span>` : ''}
            ${property.baths ? `<span>🛁 ${property.baths}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }, [formatPrice]);

  const updateDrawnPolygon = useCallback((coords: [number, number][]) => {
    if (!map.current || !mapLoaded) return;

    const sourceId = "drawn-polygon";
    const layerId = "drawn-polygon-layer";
    const outlineLayerId = "drawn-polygon-outline";

    const geojsonData: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [coords.length > 2 ? [...coords, coords[0]] : coords],
      },
    };

    try {
      const source = map.current.getSource(sourceId);
      if (source && source.type === 'geojson') {
        (source as maplibregl.GeoJSONSource).setData(geojsonData);
      } else {
        if (!map.current.getSource(sourceId)) {
          map.current.addSource(sourceId, { type: "geojson", data: geojsonData });
        }
        if (!map.current.getLayer(layerId)) {
          map.current.addLayer({
            id: layerId,
            type: "fill",
            source: sourceId,
            paint: { "fill-color": "#3b82f6", "fill-opacity": 0.2 },
          });
        }
        if (!map.current.getLayer(outlineLayerId)) {
          map.current.addLayer({
            id: outlineLayerId,
            type: "line",
            source: sourceId,
            paint: { "line-color": "#3b82f6", "line-width": 2 },
          });
        }
      }
    } catch (error) {
      console.error("Error updating drawn polygon:", error);
    }
  }, [mapLoaded]);

  const clearDrawing = useCallback(() => {
    setDrawnPolygon(null);
    drawingCoords.current = [];
    
    if (!map.current) return;

    try {
      const layersToRemove = ["drawn-polygon-layer", "drawn-polygon-outline"];
      layersToRemove.forEach((layerId) => {
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
        }
      });
      if (map.current.getSource("drawn-polygon")) {
        map.current.removeSource("drawn-polygon");
      }
    } catch (error) {
      console.error("Error clearing drawing:", error);
    }
  }, []);

  const addHeatmapLayer = useCallback(() => {
    if (!map.current || !mapLoaded || validProperties.length === 0) return;

    const geojsonData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features: validProperties.map((p) => ({
        type: "Feature",
        properties: { price: p.price },
        geometry: { type: "Point", coordinates: [p.longitude!, p.latitude!] },
      })),
    };

    try {
      if (map.current.getLayer("properties-heatmap")) {
        map.current.removeLayer("properties-heatmap");
      }
      if (map.current.getSource("properties-heat")) {
        map.current.removeSource("properties-heat");
      }

      map.current.addSource("properties-heat", { type: "geojson", data: geojsonData });
      map.current.addLayer({
        id: "properties-heatmap",
        type: "heatmap",
        source: "properties-heat",
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "price"], 0, 0, 100000, 0.5, 1000000, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(33,102,172,0)",
            0.2, "rgb(103,169,207)",
            0.4, "rgb(209,229,240)",
            0.6, "rgb(253,219,199)",
            0.8, "rgb(239,138,98)",
            1, "rgb(178,24,43)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
          "heatmap-opacity": 0.8,
        },
      });
    } catch (error) {
      console.error("Error adding heatmap layer:", error);
    }
  }, [validProperties, mapLoaded]);

  const removeHeatmapLayer = useCallback(() => {
    if (!map.current) return;
    
    try {
      if (map.current.getLayer("properties-heatmap")) {
        map.current.removeLayer("properties-heatmap");
      }
      if (map.current.getSource("properties-heat")) {
        map.current.removeSource("properties-heat");
      }
    } catch (error) {
      console.error("Error removing heatmap layer:", error);
    }
  }, []);

  const clearMarkers = useCallback(() => {
    markers.current.forEach(({ marker, popup }) => {
      popup.remove();
      marker.remove();
    });
    markers.current.clear();
  }, []);

  const createMarker = useCallback((property: Property) => {
    if (!map.current || !property.latitude || !property.longitude) return null;

    const isRent = property.listingType?.toLowerCase() === "rent";
    const bgColor = isRent ? "bg-blue-600" : "bg-green-600";

    const el = document.createElement("div");
    el.className = "custom-marker";
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${property.title}, ${formatPrice(property.price)}`);
    el.innerHTML = `
      <div class="${bgColor} text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg hover:scale-110 transition-transform cursor-pointer">
        ${formatPrice(property.price)}
      </div>
    `;

    // Create tooltip popup
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 25,
      className: 'property-tooltip'
    }).setHTML(createTooltipContent(property));

    // Show popup on hover
    el.addEventListener("mouseenter", () => {
      popup.setLngLat([property.longitude!, property.latitude!]).addTo(map.current!);
    });

    el.addEventListener("mouseleave", () => {
      popup.remove();
    });

    // Click to select property
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      setSelectedProperty(property);
    });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([property.longitude, property.latitude])
      .addTo(map.current);

    return { marker, popup };
  }, [formatPrice, createTooltipContent]);

  const createClusterMarker = useCallback((cluster: { lat: number; lng: number; properties: Property[] }) => {
    if (!map.current) return null;

    const el = document.createElement("div");
    el.className = "custom-marker";
    const clusterSize = Math.min(cluster.properties.length, 99);
    const sizeClass = clusterSize > 20 ? "w-16 h-16 text-lg" : clusterSize > 10 ? "w-14 h-14 text-base" : "w-12 h-12 text-sm";
    
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Cluster of ${cluster.properties.length} properties`);
    el.innerHTML = `
      <div class="bg-purple-600 text-white ${sizeClass} rounded-full flex items-center justify-center font-bold shadow-lg hover:scale-110 transition-transform cursor-pointer border-4 border-white">
        ${clusterSize}${cluster.properties.length > 99 ? '+' : ''}
      </div>
    `;

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 25,
    }).setHTML(`<div class="text-center font-semibold">${cluster.properties.length} properties</div>`);

    el.addEventListener("mouseenter", () => {
      popup.setLngLat([cluster.lng, cluster.lat]).addTo(map.current!);
    });

    el.addEventListener("mouseleave", () => {
      popup.remove();
    });

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (map.current) {
        const currentZ = map.current.getZoom();
        const newZoom = Math.min(currentZ + ZOOM_INCREMENT, MAX_ZOOM);
        
        map.current.flyTo({
          center: [cluster.lng, cluster.lat],
          zoom: newZoom,
          duration: 800,
        });
      }
    });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([cluster.lng, cluster.lat])
      .addTo(map.current);

    return { marker, popup };
  }, []);

  const updateMarkers = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    clearMarkers();

    if (validProperties.length === 0) return;

    const currentZoom = map.current.getZoom();

    if (showClusters && validProperties.length > 5 && currentZoom < CLUSTER_MAX_ZOOM) {
      const clusters = clusterProperties(validProperties, currentZoom);

      clusters.forEach((cluster) => {
        if (cluster.properties.length === 1) {
          const result = createMarker(cluster.properties[0]);
          if (result) markers.current.set(cluster.properties[0].id, result);
        } else {
          const result = createClusterMarker(cluster);
          if (result) {
            const clusterId = `cluster-${cluster.lat}-${cluster.lng}`;
            markers.current.set(clusterId, result);
          }
        }
      });
    } else {
      validProperties.forEach((property) => {
        const result = createMarker(property);
        if (result) markers.current.set(property.id, result);
      });
    }
  }, [validProperties, mapLoaded, showClusters, clusterProperties, createMarker, createClusterMarker, clearMarkers]);

  // Initialize map with user location
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const apiKey = getApiKey();

    if (!apiKey || apiKey === "demo-key") {
      console.error("NEXT_PUBLIC_MAPTILER_API_KEY is not set");
      setMapError("Map API key is missing. Please add NEXT_PUBLIC_MAPTILER_API_KEY to your .env file.");
      setIsLocating(false);
      return;
    }

    // Get user location first
    getUserLocation()
      .then((coords) => {
        setUserLocation(coords);
        initializeMap(coords);
      })
      .catch((error) => {
        console.warn("Could not get user location, using fallback:", error);
        initializeMap(FALLBACK_CENTER);
      })
      .finally(() => {
        setIsLocating(false);
      });

    function initializeMap(center: [number, number]) {
      try {
        map.current = new maplibregl.Map({
          container: mapContainer.current!,
          style: `https://api.maptiler.com/maps/${currentStyle}/style.json?key=${apiKey}`,
          center,
          zoom: DEFAULT_ZOOM,
        });

        map.current.addControl(new maplibregl.NavigationControl(), "top-right");

        map.current.on("load", () => {
          setMapLoaded(true);
          // Place user location marker if we have it
          if (userLocation) {
            placeUserLocationMarker(userLocation[0], userLocation[1]);
          }
        });

        map.current.on("error", (e) => {
          console.error("Map error:", e);
          setMapError("Map failed to load. Please check your API key and connection.");
        });
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError("Failed to initialize map. Please check your API key.");
      }
    }

    return () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      if (styleLoadTimeoutRef.current) clearTimeout(styleLoadTimeoutRef.current);
      clearMarkers();
      if (userLocationMarker.current) userLocationMarker.current.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [getApiKey, currentStyle, getUserLocation, clearMarkers]);

  // Update user location marker when location changes
  useEffect(() => {
    if (userLocation && map.current && mapLoaded) {
      placeUserLocationMarker(userLocation[0], userLocation[1]);
    }
  }, [userLocation, mapLoaded, placeUserLocationMarker]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleZoomEnd = () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);

      zoomTimeoutRef.current = setTimeout(() => {
        if (map.current) {
          const newZoom = Math.round(map.current.getZoom() * 10) / 10;
          setZoomLevel(newZoom);
        }
        zoomTimeoutRef.current = null;
      }, ZOOM_DEBOUNCE_MS);
    };

    map.current.on("zoomend", handleZoomEnd);

    return () => {
      if (map.current) {
        map.current.off("zoomend", handleZoomEnd);
      }
    };
  }, [mapLoaded]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    if (!selectedLocation) return;

    const { lng, lat } = selectedLocation;
    try {
      placeSelectedMarker(lng, lat);
      onMapClick?.(lng, lat);

      (async () => {
        const addr = await reverseGeocode(lng, lat);
        onLocationSelect?.(lng, lat, addr || undefined);
      })();
    } catch (err) {
      console.error("Error handling selected location:", err);
    }
  }, [selectedLocation, mapLoaded, placeSelectedMarker, reverseGeocode, onLocationSelect, onMapClick]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (isDrawing) {
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        drawingCoords.current.push(coords);

        if (drawingCoords.current.length > 0) {
          updateDrawnPolygon(drawingCoords.current);
        }
        return;
      }

      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      try {
        placeSelectedMarker(lng, lat);
        onMapClick?.(lng, lat);

        (async () => {
          const addr = await reverseGeocode(lng, lat);
          onLocationSelect?.(lng, lat, addr || undefined);
        })();
      } catch (err) {
        console.error("Error handling map click:", err);
      }
    };

    map.current.on("click", handleClick);

    return () => {
      if (map.current) {
        map.current.off("click", handleClick);
      }
    };
  }, [isDrawing, mapLoaded, updateDrawnPolygon, onMapClick, placeSelectedMarker, reverseGeocode, onLocationSelect]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers, zoomLevel]);

  useEffect(() => {
    if (!mapLoaded) return;
    
    if (showHeatmap) {
      addHeatmapLayer();
    } else {
      removeHeatmapLayer();
    }
  }, [showHeatmap, mapLoaded, addHeatmapLayer, removeHeatmapLayer]);

  const startDrawing = useCallback(() => {
    setIsDrawing(true);
    drawingCoords.current = [];
    setIsModalOpen(false);
    if (map.current) {
      map.current.getCanvas().style.cursor = "crosshair";
    }
  }, []);

  const finishDrawing = useCallback(() => {
    setIsDrawing(false);
    if (map.current) {
      map.current.getCanvas().style.cursor = "";
    }
    if (drawingCoords.current.length > 2) {
      setDrawnPolygon(drawingCoords.current);
      onAreaSelect?.(drawingCoords.current);
    }
  }, [onAreaSelect]);

  const changeMapStyle = useCallback((styleId: string) => {
    if (!map.current) return;

    const apiKey = getApiKey();
    setMapLoaded(false);
    
    map.current.setStyle(`https://api.maptiler.com/maps/${styleId}/style.json?key=${apiKey}`);
    setCurrentStyle(styleId);
    
    if (styleLoadTimeoutRef.current) {
      clearTimeout(styleLoadTimeoutRef.current);
    }

    const handleStyleLoad = () => {
      styleLoadTimeoutRef.current = setTimeout(() => {
        setMapLoaded(true);
        
        setTimeout(() => {
          if (showHeatmap) {
            addHeatmapLayer();
          }
          if (drawnPolygon) {
            updateDrawnPolygon(drawnPolygon);
          }
          if (userLocation) {
            placeUserLocationMarker(userLocation[0], userLocation[1]);
          }
        }, 100);
      }, STYLE_LOAD_TIMEOUT_MS);
    };

    map.current.once("style.load", handleStyleLoad);
  }, [getApiKey, showHeatmap, drawnPolygon, addHeatmapLayer, updateDrawnPolygon, userLocation, placeUserLocationMarker]);

  const goToUserLocation = useCallback(() => {
    if (!map.current) return;
    
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
          map.current?.flyTo({
            center: coords,
            zoom: 14,
            duration: 2000,
          });
          placeUserLocationMarker(coords[0], coords[1]);
          setIsModalOpen(false);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enable location services.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }, [placeUserLocationMarker]);

  const handlePropertyView = () => {
    if (selectedProperty && onPropertyClick) {
      onPropertyClick(selectedProperty.id);
    }
  };

  // Get image array for selected property
  const selectedPropertyImages = useMemo(() => {
    if (!selectedProperty) return [];
    return selectedProperty.images && selectedProperty.images.length > 0 
      ? selectedProperty.images 
      : selectedProperty.image 
        ? [selectedProperty.image] 
        : ['/placeholder.jpg'];
  }, [selectedProperty]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Property Preview Card */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-20">
          <Card className="overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="relative h-48">
              {selectedPropertyImages.length > 1 ? (
                <Carousel className="w-full" opts={{ loop: true }}>
                  <CarouselContent className="ml-0">
                    {selectedPropertyImages.map((img, index) => (
                      <CarouselItem key={index} className="pl-0">
                        <img
                          src={img}
                          alt={`${selectedProperty.address} - Image ${index + 1}`}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
                          }}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div onClick={(e) => e.preventDefault()} className="group">
                    <CarouselPrevious className="left-2 bg-white/80 backdrop-blur-sm text-gray-800 hidden group-hover:flex border-0 hover:bg-white transition-all" />
                    <CarouselNext className="right-2 bg-white/80 backdrop-blur-sm text-gray-800 hidden group-hover:flex border-0 hover:bg-white transition-all" />
                  </div>
                </Carousel>
              ) : (
                <img
                  src={selectedPropertyImages[0]}
                  alt={selectedProperty.address || 'Property'}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.jpg';
                  }}
                />
              )}
              
              {selectedProperty.listingType && (
                <Badge className={`absolute top-3 left-3 ${
                  selectedProperty.listingType.toLowerCase() === "rent" 
                    ? "bg-blue-600" 
                    : "bg-green-600"
                }`}>
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
                {selectedProperty.type && (
                  <p className="text-sm font-medium text-gray-700">{selectedProperty.type}</p>
                )}
              </div>

              {selectedProperty.address && (
                <p className="text-sm text-gray-600 mb-3">{selectedProperty.address}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                {selectedProperty.sqft && (
                  <div className="flex items-center gap-1.5">
                    <Ruler className="h-4 w-4" />
                    <span>{selectedProperty.sqft}</span>
                  </div>
                )}
                {selectedProperty.beds !== undefined && selectedProperty.beds > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Bed className="h-4 w-4" />
                    <span>{selectedProperty.beds}</span>
                  </div>
                )}
                {selectedProperty.baths !== undefined && selectedProperty.baths > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Bath className="h-4 w-4" />
                    <span>{selectedProperty.baths}</span>
                  </div>
                )}
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
      
      {/* Settings Button */}
      <div className="absolute top-4 left-4 z-10">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button 
              className="bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Open map settings"
            >
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Map Controls</DialogTitle>
              <DialogDescription>
                Customize your map view and tools
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Navigation</h3>
                <button
                  onClick={goToUserLocation}
                  disabled={isLocating}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Navigation className={`w-5 h-5 ${isLocating ? 'animate-pulse' : ''}`} />
                  {isLocating ? 'Locating...' : 'Go to My Location'}
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Display Options</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowClusters(!showClusters)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      showClusters
                        ? "bg-blue-50 text-blue-700 border-2 border-blue-200"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5" />
                      <span>Clustering</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors ${showClusters ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${showClusters ? 'translate-x-5' : ''}`} />
                    </div>
                  </button>

                  <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      showHeatmap
                        ? "bg-red-50 text-red-700 border-2 border-red-200"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5" />
                      <span>Heatmap</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors ${showHeatmap ? 'bg-red-600' : 'bg-gray-300'} relative`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${showHeatmap ? 'translate-x-5' : ''}`} />
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Drawing Tools</h3>
                <div className="space-y-2">
                  {!isDrawing && !drawnPolygon && (
                    <button
                      onClick={startDrawing}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
                      Draw Search Area
                    </button>
                  )}
                  {isDrawing && (
                    <button
                      onClick={finishDrawing}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium bg-green-50 text-green-700 border-2 border-green-200 rounded-lg transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
                      Finish Drawing
                    </button>
                  )}
                  {drawnPolygon && (
                    <button
                      onClick={clearDrawing}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                      Clear Drawn Area
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Map Style</h3>
                <div className="grid grid-cols-2 gap-2">
                  {MAP_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => changeMapStyle(style.id)}
                      className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        currentStyle === style.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
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

      {/* Drawing Mode Indicator */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-10">
          Click on the map to draw points. Press "Finish Drawing" when done.
        </div>
      )}

      {/* Error State */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 p-4 z-30">
          <p className="text-sm text-red-400 font-semibold mb-2">Map Error</p>
          <p className="text-xs text-gray-300 text-center max-w-md">{mapError}</p>
        </div>
      )}

      {/* Loading State */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/30 z-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-600">
              {isLocating ? 'Getting your location...' : 'Loading map...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;