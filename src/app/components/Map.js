'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: 0,
  lng: 0
};

export default function Map({ onLocationSelect, initialLocation }) {
  const [marker, setMarker] = useState(initialLocation || null);

  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarker({ lat, lng });
    if (onLocationSelect) {
      onLocationSelect({ lat, lng });
    }
  }, [onLocationSelect]);

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={marker || defaultCenter}
        zoom={marker ? 15 : 2}
        onClick={handleMapClick}
      >
        {marker && (
          <Marker
            position={marker}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
} 