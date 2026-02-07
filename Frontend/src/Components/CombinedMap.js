import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import heatOnPng from '../images/heat-on.png';
import heatOffPng from '../images/heat-off.png';
import 'leaflet.heat';

// Helper to create colored marker icons
function createColoredIcon(color) {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

const defaultIcon = createColoredIcon('red'); // fallback

// Combined map: shows heatmap, public spaces, saved locations, and events

const CombinedMap = ({ publicSpaces = [] }) => {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const heatLayerRef = useRef(null);
  const [showHeat, setShowHeat] = useState(true);
  const [heatData, setHeatData] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(6);
  const [locations, setLocations] = useState([]);
  const [showUserMarkers, setShowUserMarkers] = useState(true);
  const [popup, setPopup] = useState(null);
  const [placeName, setPlaceName] = useState('');

  // Heatmap options
  const radius = 55;
  const blur = 70;
  const getMaxIntensity = (zoom) => {
    if (zoom >= 16) return 1.2;
    if (zoom >= 15) return 1.7;
    if (zoom >= 14) return 2.2;
    return 0.3;
  };

  // Helper: get heat value at a location
  function getHeatAtLocation(lat, lng) {
    if (!heatData || heatData.length === 0) return 0;
    // Find closest heat point
    let minDist = Infinity;
    let value = 0;
    for (const [hLat, hLng, hVal] of heatData) {
      const dist = Math.sqrt((lat - hLat) ** 2 + (lng - hLng) ** 2);
      if (dist < minDist) {
        minDist = dist;
        value = hVal;
      }
    }
    return value;
  }

  // Fetch heat data for bounds
  const fetchHeatData = async (bounds) => {
    if (!bounds) return;
    const sw = bounds.getSouthWest();
    const nw = L.latLng(bounds.getNorth(), bounds.getWest());
    const ne = bounds.getNorthEast();
    const se = L.latLng(bounds.getSouth(), bounds.getEast());
    try {
      const res = await fetch('/api/crime/maparea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topLeftLat: nw.lat,
          topLeftLong: nw.lng,
          topRightLat: ne.lat,
          topRightLong: ne.lng,
          bottomRightLat: se.lat,
          bottomRightLong: se.lng,
          bottomLeftLat: sw.lat,
          bottomLeftLong: sw.lng,
        }),
      });
      const data = await res.json();
      if (data && Array.isArray(data.heat)) {
        setHeatData(data.heat);
      } else {
        setHeatData([]);
      }
    } catch (e) {
      setHeatData([]);
    }
  };

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const ukBounds = L.latLngBounds(
      L.latLng(49.4, -12),
      L.latLng(59.0, 2.5)
    );
    leafletMap.current = L.map(mapRef.current, {
      center: [51.5, -1.0],
      zoom: 6,
      maxBounds: ukBounds,
      maxBoundsViscosity: 1,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      minZoom: 6,
    }).addTo(leafletMap.current);
    fetchHeatData(leafletMap.current.getBounds());
    leafletMap.current.on('moveend', () => {
      fetchHeatData(leafletMap.current.getBounds());
      setZoomLevel(leafletMap.current.getZoom());
    });
    leafletMap.current.on('zoomend', () => setZoomLevel(leafletMap.current.getZoom()));
    setZoomLevel(leafletMap.current.getZoom());
    // Add click handler for saving locations
    leafletMap.current.on('click', e => {
      const { lat, lng } = e.latlng;
      setPopup({ lat, lng });
      setPlaceName('');
    });
    return () => {
      leafletMap.current.off('moveend');
      leafletMap.current.off('zoomend');
      leafletMap.current.off('click');
    };
  }, []);

  // Add/remove markers (public spaces, saved locations)
  useEffect(() => {
    if (!leafletMap.current) return;
    if (leafletMap.current._markers) {
      leafletMap.current._markers.forEach(m => m.remove());
    }
    // Public spaces (default icon)
    const publicMarkers = publicSpaces.map(space => {
      if (space.lat == null || space.lng == null) return null;
      const marker = L.marker([space.lat, space.lng], { icon: defaultIcon }).addTo(leafletMap.current);
      let popupContent = '';
      if (space.name) popupContent += `<strong>${space.name}</strong><br/>`;
      popupContent += `Lat: ${space.lat.toFixed(5)}<br/>Lng: ${space.lng.toFixed(5)}`;
      marker.bindPopup(popupContent);
      return marker;
    }).filter(Boolean);
    // User-saved places (colored icon based on heat)
    const placeMarkers = showUserMarkers ? locations.map(loc => {
      const heatVal = getHeatAtLocation(loc.lat, loc.lng);
      // Map heat value to color: yellow (low) to red (high)
      let color = 'yellow';
      if (heatVal > 0.7) color = 'red';
      else if (heatVal > 0.4) color = 'orange';
      else if (heatVal > 0.15) color = 'gold';
      else color = 'yellow';
      const icon = createColoredIcon(color);
      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(leafletMap.current);
      let popupContent = '';
      if (loc.name) popupContent += `<strong>${loc.name}</strong><br/>`;
      popupContent += `Lat: ${loc.lat.toFixed(5)}<br/>Lng: ${loc.lng.toFixed(5)}`;
      popupContent += `<br/>Heat: ${heatVal.toFixed(2)}`;
      marker.bindPopup(popupContent);
      return marker;
    }) : [];
    leafletMap.current._markers = [...publicMarkers, ...placeMarkers];
  }, [publicSpaces, locations, showUserMarkers, heatData]);

  // Add/remove heat layer
  useEffect(() => {
    if (!leafletMap.current) return;
    if (!window.L || !window.L.heatLayer) return;
    if (heatLayerRef.current) {
      heatLayerRef.current.remove();
      heatLayerRef.current = null;
    }
    if (showHeat && heatData && heatData.length > 0 && zoomLevel >= 14) {
      const gradient = {
        0.0: '#fff5f5',
        0.2: '#ffcccc',
        0.4: '#ff9999',
        0.6: '#ff5555',
        0.8: '#ff2222',
        1.0: '#ff0000',
      };
      const maxIntensity = getMaxIntensity(zoomLevel);
      heatLayerRef.current = window.L.heatLayer(heatData, {
        radius,
        blur,
        maxZoom: 17,
        gradient,
        max: maxIntensity,
      }).addTo(leafletMap.current);
    }
  }, [heatData, showHeat, zoomLevel]);

  // Handle popup form submission for saving locations
  const handlePopupSubmit = async (e) => {
    e.preventDefault();
    if (!popup || !placeName.trim()) return;
    const newLoc = { lat: popup.lat, lng: popup.lng, name: placeName.trim() };
    setLocations(prev => [...prev, newLoc]);
    setPopup(null);
    setPlaceName('');
    try {
      await fetch('/api/save-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLoc)
      });
    } catch (err) {
      console.error('Failed to save location:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
      <div style={{ position: 'relative', width: 750, height: 750 }}>
        <div ref={mapRef} style={{ height: 750, width: 750 }} />
        {popup && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.2)',
            zIndex: 1000,
          }}>
            <form
              onSubmit={handlePopupSubmit}
              style={{
                background: '#fff',
                padding: 24,
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 300,
              }}
            >
              <label style={{ marginBottom: 8 }}>
                Place Name:
                <input
                  type="text"
                  value={placeName}
                  onChange={e => setPlaceName(e.target.value)}
                  style={{ width: '100%', marginTop: 4 }}
                  autoFocus
                />
              </label>
              <div style={{ marginBottom: 8 }}>
                Latitude: {popup.lat.toFixed(5)}<br />
                Longitude: {popup.lng.toFixed(5)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit">Add Place</button>
                <button type="button" onClick={() => setPopup(null)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
      <div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: 750 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button
            onClick={() => setShowHeat(h => !h)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              outline: 'none',
              marginRight: 8,
            }}
            aria-label={showHeat ? 'Hide heatmap' : 'Show heatmap'}
          >
            <img
              src={showHeat ? heatOnPng : heatOffPng}
              alt={showHeat ? 'Heatmap on' : 'Heatmap off'}
              style={{ width: 40, height: 40 }}
            />
          </button>
          <span style={{ fontSize: 18, userSelect: 'none' }}>Show Heatmap</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <label style={{ fontSize: 16, marginRight: 8 }}>
            <input
              type="checkbox"
              checked={showUserMarkers}
              onChange={e => setShowUserMarkers(e.target.checked)}
              style={{ marginRight: 4 }}
            />
            Show My Saved Places
          </label>
        </div>
      </div>
    </div>
  );
};

export default CombinedMap;
