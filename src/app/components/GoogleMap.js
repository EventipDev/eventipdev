'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px'
};

// Default center (can be modified)
const defaultCenter = {
  lat: 9.0820, // Default to Nigeria
  lng: 8.6753
};

export default function GoogleMapComponent({ onLocationSelect, initialLocation }) {
  const [marker, setMarker] = useState(initialLocation || null);
  const mapRef = useRef(null);

  // Save the map instance when the map loads
  const onLoad = useCallback(function callback(map) {
    mapRef.current = map;
  }, []);

  // Clear the map instance when the component unmounts
  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
  }, []);

  // Handle map click to place a marker
  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const newLocation = { lat, lng };
    
    setMarker(newLocation);
    
    if (onLocationSelect) {
      onLocationSelect(newLocation);
    }
  };

  return (
    <div>
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={marker || defaultCenter}
          zoom={10}
          onClick={handleMapClick}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: true,
            zoomControl: true
          }}
        >
          {marker && (
            <Marker
              position={marker}
              draggable={true}
              onDragEnd={(e) => {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                const newLocation = { lat, lng };
                setMarker(newLocation);
                if (onLocationSelect) {
                  onLocationSelect(newLocation);
                }
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
      <p className="text-xs text-gray-500 mt-2">
        Click on the map to place a marker. Drag the marker to adjust the position.
      </p>
    </div>
  );
} 