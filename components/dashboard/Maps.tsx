"use client";

import React, { useState } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";

const MapComponent = () => {
  const [selected, setSelected] = useState<number | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const containerStyle = {
    width: "100%",
    height: "500px",
    borderRadius: "8px",
    overflow: "hidden",  
  };

  const center = { lat: 48.8566, lng: 2.3522 };

  const properties = [
    { id: 1, title: "Paris Center", lat: 48.8566, lng: 2.3522 },
    { id: 2, title: "Versailles", lat: 48.8049, lng: 2.1204 },
  ];

  if (!isLoaded) return <p>Loading Map...</p>;

  return (
    <div className="w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={11}
      >
        {properties.map((prop) => (
          <Marker
            key={prop.id}
            position={{ lat: prop.lat, lng: prop.lng }}
            onClick={() => setSelected(prop.id)}
          />
        ))}

        {selected && (
          <InfoWindow
            position={{
              lat: properties.find((p) => p.id === selected)!.lat,
              lng: properties.find((p) => p.id === selected)!.lng,
            }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="text-sm font-bold text-black">
              {properties.find((p) => p.id === selected)?.title}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapComponent;
