'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip } from '@/types';

interface TripMapProps {
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (id: string | null) => void;
  showFitAllButton?: boolean;
}

export function TripMap({ trips, selectedTripId, onSelectTrip }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const polylinesRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true,
    });

    // Light mode tiles (CartoDB Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapInstanceRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);
    polylinesRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers and routes when trips change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current || !polylinesRef.current) return;

    // Clear existing
    markersRef.current.clearLayers();
    polylinesRef.current.clearLayers();

    trips.forEach((trip) => {
      const isSelected = trip.id === selectedTripId;
      const coordinates: L.LatLngExpression[] = [];

      // Add markers for each city
      trip.cities.forEach((city, index) => {
        coordinates.push([city.lat, city.lng]);

        // Create custom marker
        const isFirst = index === 0;
        const markerColor = isSelected ? trip.color : '#6B7280';
        
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: ${isSelected ? '14px' : '10px'};
              height: ${isSelected ? '14px' : '10px'};
              background-color: ${markerColor};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              ${isFirst && isSelected ? 'transform: scale(1.2);' : ''}
            "></div>
          `,
          iconSize: [isSelected ? 14 : 10, isSelected ? 14 : 10],
          iconAnchor: [isSelected ? 7 : 5, isSelected ? 7 : 5],
        });

        const marker = L.marker([city.lat, city.lng], { icon })
          .on('click', () => onSelectTrip(trip.id));

        // Add tooltip
        const date = new Date(city.arriveDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        marker.bindTooltip(`
          <div style="font-weight: 600; color: #111827;">${city.name}</div>
          <div style="color: #6B7280; font-size: 11px;">${date}</div>
        `, {
          direction: 'top',
          offset: [0, -5],
          className: 'custom-tooltip'
        });

        markersRef.current?.addLayer(marker);
      });

      // Draw route line
      if (coordinates.length > 1) {
        const polyline = L.polyline(coordinates, {
          color: isSelected ? trip.color : '#9CA3AF',
          weight: isSelected ? 3 : 2,
          opacity: isSelected ? 1 : 0.5,
          dashArray: isSelected ? undefined : '5, 5',
        }).on('click', () => onSelectTrip(trip.id));

        polylinesRef.current?.addLayer(polyline);
      }
    });

    // Fit bounds to selected trip
    if (selectedTripId) {
      const selectedTrip = trips.find(t => t.id === selectedTripId);
      if (selectedTrip && selectedTrip.cities.length > 0) {
        const bounds = L.latLngBounds(
          selectedTrip.cities.map(c => [c.lat, c.lng] as L.LatLngExpression)
        );
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
      }
    }
  }, [trips, selectedTripId, onSelectTrip]);

  const fitAllTrips = () => {
    if (!mapInstanceRef.current || trips.length === 0) return;
    
    const allCoords: L.LatLngExpression[] = [];
    trips.forEach(trip => {
      trip.cities.forEach(city => {
        allCoords.push([city.lat, city.lng]);
      });
    });
    
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 5 });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" style={{ background: '#f8fafc' }} />
      {trips.length > 1 && (
        <button
          onClick={fitAllTrips}
          className="absolute top-3 left-3 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600 text-sm rounded-lg shadow border border-gray-200 transition-colors z-[1000]"
          title="Fit all trips"
        >
          Show All
        </button>
      )}
    </div>
  );
}
