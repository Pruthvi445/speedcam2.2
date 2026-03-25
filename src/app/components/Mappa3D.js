"use client";

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Mappa3D - A production-ready 3D Map component using MapLibre GL
 * Provides seamless 3D building extrusion, tactical markers, and real-time tracking.
 */
import {
  getRadarHTML,
  getRedLightHTML,
  getCarHTML,
  getDestinationHTML,
  getPinHTML,
  getRouteTargetHTML,
  SHARED_MAP_STYLES
} from '../map/tacticalIcons';

/**
 * Mappa3D - A production-ready 3D Map component using MapLibre GL
 * Provides seamless 3D building extrusion, tactical markers, and real-time tracking.
 */
const Mappa3D = ({
  coords,
  zoom,
  theme,
  cameras,
  route,
  heading = 0,
  nextCam,
  overspeedAlert,
  destination,
  onMapClick,
  pinMode,
  tempPin,
  routeDistance,
  routeDuration,
  isLocked,
  onReportCamera,
  onMarkerClick
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const markersRef = useRef([]);

  // Initialization: One-time setup
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      const initialStyle = theme === 'night'
        ? 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        : 'https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json';

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: initialStyle,
        center: [coords[1] || 73.8567, coords[0] || 18.5204],
        zoom: (zoom || 17) - 1,
        pitch: 60,
        bearing: heading || 0,
        antialias: true
      });

      map.current.on('load', () => {
        setStyleLoaded(true);
        
        // Add click listener for pinning cameras
        map.current.on('click', (e) => {
          if (onMapClick) {
            onMapClick({ latlng: { lat: e.lngLat.lat, lng: e.lngLat.lng } });
          }
        });

        // Add 3D Buildings Layer
        if (map.current.getSource('carto')) {
          map.current.addLayer({
            'id': '3d-buildings',
            'source': 'carto',
            'source-layer': 'building',
            'type': 'fill-extrusion',
            'minzoom': 14,
            'paint': {
              'fill-extrusion-color': [
                'interpolate', ['linear'], ['get', 'render_height'],
                0, theme === 'night' ? '#222' : '#eee',
                50, theme === 'night' ? '#004488' : '#99ccff',
                100, theme === 'night' ? '#001133' : '#6699cc'
              ],
              'fill-extrusion-height': ['get', 'render_height'],
              'fill-extrusion-base': ['get', 'render_min_height'],
              'fill-extrusion-opacity': 0.8,
              'fill-extrusion-vertical-gradient': true
            }
          });
        }
      });
    } catch (error) {
      console.error('Mappa3D Initialization Error:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Sync Camera: flyTo on position/heading changes
  useEffect(() => {
    if (!map.current || !coords || !isLocked) return;
    map.current.flyTo({
      center: [coords[1], coords[0]],
      zoom: (zoom || 17) - 1,
      bearing: heading || 0,
      duration: 500, // Faster for real-time tracking
      essential: true
    });
  }, [coords, zoom, heading, isLocked]);

  useEffect(() => {
    // Car Marker: Managed separately to prevent flickering
    window.handleMapReport = (camId) => {
      const cam = (cameras || []).find(c => c.id === camId);
      if (cam && onReportCamera) onReportCamera(cam);
    };

    window.handleMapSelect = (camId) => {
      const cam = (cameras || []).find(c => c.id === camId);
      if (cam && onMarkerClick) onMarkerClick(cam);
    };
  }, [cameras, onReportCamera, onMarkerClick]);

  const carMarkerRef = useRef(null);

  useEffect(() => {
    if (!map.current || !coords || !styleLoaded) return;

    // In 3D tracking mode, if the map is already rotated (bearing = heading),
    // the car should point "UP" relative to the screen (0 degrees).
    // In 2D map, the icon itself rotates because the map is North-up.
    const iconHeading = isLocked ? 0 : heading;
    const html = getCarHTML(iconHeading, overspeedAlert, theme);
    
    if (!carMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'car-marker-container';
      el.innerHTML = html;
      carMarkerRef.current = new maplibregl.Marker({ 
        element: el,
        rotationAlignment: 'map', // Changed to screen-relative if needed, but 'map' is more tactical
        pitchAlignment: 'map'
      })
        .setLngLat([coords[1], coords[0]])
        .addTo(map.current);
    } else {
      carMarkerRef.current.setLngLat([coords[1], coords[0]]);
      carMarkerRef.current.getElement().innerHTML = html;
    }
  }, [coords, heading, overspeedAlert, theme, isLocked, styleLoaded]);

  // Sync Content: Markers, Route, Theme
  useEffect(() => {
    if (!map.current || !styleLoaded) return;

    // 1. Cleanup old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Helper to create element
    const createEl = (html) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.firstElementChild;
    };

    // 2. Render Camera Markers
    // Clear existing markers
    if (window._mappaMarkers) {
      window._mappaMarkers.forEach(m => m.remove());
    }
    window._mappaMarkers = [];

    if (cameras) {
      cameras.forEach(cam => {
        const isNear = nextCam?.id === cam.id;
        const isPending = cam.status === 'pending';
        const type = cam.type;
        const isSuspicious = cam.isSuspicious;
        const lat = parseFloat(cam.lat);
        const lng = parseFloat(cam.lng);

        if (isNaN(lat) || isNaN(lng)) return;

        let html;
        if (type === 'red' || type === 'redlight') {
          html = getRedLightHTML(isNear, isSuspicious, theme, cam.reports || 0, isPending);
        } else {
          html = getRadarHTML(cam.speedLimit, isNear, isSuspicious, theme, cam.reports || 0, isPending);
        }

        const marker = new maplibregl.Marker({
          element: createEl(html),
          anchor: (type === 'red' || type === 'redlight') ? 'bottom' : 'center'
        })
          .setLngLat([lng, lat])
          .addTo(map.current);
        
        marker.getElement().addEventListener('click', (e) => {
          e.stopPropagation();
          onMarkerClick?.(cam);
        });

        window._mappaMarkers.push(marker);
      });
    }

    // 3. Render Car Marker - MOVED TO SEPARATE EFFECT ABOVE

    // 4. Render Destination Marker (Updated to Pin for better visibility)
    if (destination) {
      const html = getPinHTML(false); // Using the pulsing gold pin
      const destMarker = new maplibregl.Marker({
        element: createEl(html),
        anchor: 'bottom'
      }).setLngLat([destination[1], destination[0]]).addTo(map.current);
      markersRef.current.push(destMarker);

      // 4b. Route Info Label
      if (routeDistance > 0) {
        const infoHtml = getRouteTargetHTML(routeDistance, routeDuration, theme);
        const infoMarker = new maplibregl.Marker({ 
          element: createEl(infoHtml),
          anchor: 'bottom' 
        }).setLngLat([destination[1], destination[0]]).addTo(map.current);
        markersRef.current.push(infoMarker);
      }
    }

    // 6. Render Temp Pin for Add Camera
    if (tempPin) {
      const html = getPinHTML(true);
      const pinMarker = new maplibregl.Marker({
        element: createEl(html),
        anchor: 'bottom'
      }).setLngLat([tempPin[1], tempPin[0]]).addTo(map.current);
      markersRef.current.push(pinMarker);
    }

    // 5. Render Route
    if (route && route.length > 0) {
      const geojson = {
        'type': 'Feature',
        'geometry': {
          'type': 'LineString',
          'coordinates': route.map(c => [c[1], c[0]])
        }
      };

      if (map.current.getSource('route')) {
        map.current.getSource('route').setData(geojson);
      } else {
        map.current.addSource('route', { 'type': 'geojson', 'data': geojson });
        map.current.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'route',
          'layout': { 'line-join': 'round', 'line-cap': 'round' },
          'paint': {
            'line-color': theme === 'night' ? '#00f2ff' : '#2563eb',
            'line-width': 6,
            'line-opacity': 0.8
          }
        });
      }
    }
  }, [cameras, coords, heading, theme, route, styleLoaded, nextCam, overspeedAlert, destination, tempPin, routeDistance, routeDuration]);

  return (
    <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-[#050505] z-0 overflow-hidden">
      <style>{SHARED_MAP_STYLES}</style>
    </div>
  );
};

export default Mappa3D;