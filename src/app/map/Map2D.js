'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { 
  getRadarHTML, 
  getRedLightHTML, 
  getCarHTML, 
  getDestinationHTML, 
  getPinHTML,
  getRouteTargetHTML,
  SHARED_MAP_STYLES 
} from './tacticalIcons';

// --- TACTICAL ICONS (THEMED) ---
const carIcon = (h, isAlert, theme) => new L.DivIcon({
  className: 'car-marker-container',
  html: getCarHTML(h, isAlert, theme),
  iconSize: [44, 44], iconAnchor: [22, 22]
});

const destIcon = (theme) => new L.DivIcon({
  className: 'dest-marker',
  html: getDestinationHTML(theme),
  iconSize: [40, 40], iconAnchor: [20, 20]
});

const routeTargetIcon = (distanceKm, durationMin, theme) => new L.DivIcon({
  className: 'route-target-marker',
  html: getRouteTargetHTML(distanceKm, durationMin, theme),
  iconSize: [50, 90],
  iconAnchor: [25, 90]
});

const radarIcon = (limit, passed, isNear, isSuspicious, type, theme, reports, isPending = false) => new L.DivIcon({
  className: 'radar-node-premium',
  html: `
    <div class="${(passed || isPending) ? 'opacity-40 grayscale scale-75' : 'scale-100'} transition-all duration-300">
      ${getRadarHTML(limit, isNear, isSuspicious, theme, reports, isPending)}
    </div>
  `,
  iconSize: [44, 44], iconAnchor: [22, 22]
});

const redLightIcon = (isSuspicious, isAlert, theme, reports, isPending = false) => new L.DivIcon({
  className: 'red-light-marker-premium',
  html: getRedLightHTML(isAlert, isSuspicious, theme, reports, isPending),
  iconSize: [32, 64], iconAnchor: [16, 32]
});

const pinIcon = (isSelected) => new L.DivIcon({
  className: 'pin-marker',
  html: getPinHTML(isSelected),
  iconSize: [40, 40], iconAnchor: [20, 20]
});

// --- Map Controller ---
function MapController({ coords, zoom, isLocked, routeBounds }) {
  const map = useMap();
  useEffect(() => {
    if (routeBounds && !isLocked) {
      map.flyToBounds(routeBounds, { padding: [50, 50], duration: 1.5 });
    } else if (coords && Array.isArray(coords) && coords.length === 2 && 
        !isNaN(coords[0]) && !isNaN(coords[1]) && isLocked) {
      map.flyTo(coords, zoom, { animate: true, duration: 1.5 });
    }
  }, [coords, zoom, map, isLocked, routeBounds]);
  return null;
}

// --- Map Click Handler ---
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

const Map2D = ({ 
  coords, 
  zoom, 
  theme, 
  cameras, 
  route, 
  heading, 
  nextCam, 
  overspeedAlert, 
  isLocked, 
  routeBounds,
  onMapClick,
  destination,
  routeDistance,
  routeDuration,
  pinMode,
  tempPin,
  onReportCamera,
  onMarkerClick
}) => {
  console.log(`🗺️ Map2D Render - Cameras: ${cameras?.length || 0}`);
  return (
    <MapContainer 
      center={coords} 
      zoom={zoom} 
      className="h-full w-full" 
      zoomControl={false} 
      dragging={!isLocked} 
      scrollWheelZoom={true} 
      doubleClickZoom={true}
    >
      <TileLayer 
        url={theme === 'night' 
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        }
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains='abcd'
        maxZoom={20}
      />
      
      <MapController coords={coords} zoom={zoom} isLocked={isLocked} routeBounds={routeBounds} />
      {pinMode && <MapClickHandler onMapClick={onMapClick} />}

      {/* Temp Pin for Add Camera */}
      {tempPin && (
        <Marker position={tempPin} icon={pinIcon(true)} />
      )}

      {/* Route */}
      {route && route.length > 0 && (
        <Polyline 
          positions={route} 
          pathOptions={{
            color: theme === 'night' ? '#00f2ff' : '#2563eb',
            weight: 6,
            opacity: 0.8,
            lineJoin: 'round'
          }} 
        />
      )}

      {/* Destination */}
      {destination && (
        <Marker position={destination} icon={destIcon(theme)} />
      )}

      {/* Route Info Marker */}
      {destination && routeDistance > 0 && (
        <Marker 
          position={destination} 
          icon={routeTargetIcon(routeDistance, routeDuration, theme)} 
        />
      )}

      {/* Cameras */}
      {cameras.map((cam, idx) => {
        const isNear = nextCam?.id === cam.id;
        const lat = parseFloat(cam.lat);
        const lng = parseFloat(cam.lng);
        const isPending = cam.status === 'pending';
        
        if (isNaN(lat) || isNaN(lng)) return null;
        const position = [lat, lng];
        const uniqueKey = cam.id || `cam-${idx}-${lat}-${lng}`;
        
        // Use a distinctive style for pending cameras
        let icon;
        if (cam.type === 'red' || cam.type === 'redlight') {
          icon = redLightIcon(cam.isSuspicious, isNear, theme, cam.reports || 0, isPending);
        } else {
          icon = radarIcon(cam.speedLimit, false, isNear, cam.isSuspicious, cam.type, theme, cam.reports || 0, isPending);
        }

        return (
          <Marker 
            key={uniqueKey} 
            position={position} 
            icon={icon}
            opacity={isPending ? 0.7 : 1.0}
            eventHandlers={{ click: (e) => {
              if (e.originalEvent) e.originalEvent.stopPropagation();
              onMarkerClick?.(cam);
            }}}
          />
        );
      })}

      {/* Car Marker */}
      <Marker position={coords} icon={carIcon(heading, overspeedAlert, theme)} />

      <style>{SHARED_MAP_STYLES}</style>
    </MapContainer>
  );
};

export default Map2D;
