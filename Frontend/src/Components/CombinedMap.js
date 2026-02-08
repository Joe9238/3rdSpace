import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import heatOnPng from '../images/heat-on.png';
import heatOffPng from '../images/heat-off.png';
import favOnPng from '../images/favourite-on.png';
import favOffPng from '../images/favourite-off.png';
import Panel from "../Components/panel.jsx";
import 'leaflet.heat';
import Safehaven from '../Components/Safehaven'; 
import "./CombinedMap.css";

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

// Function to create popup content for a location
const createPopUpContent = (loc) => {
  const { name: displayName, latitude, longitude, lat, lng, id } = loc;
  const finalName = displayName || 'Saved Place';
  const displayLat = (latitude ?? lat ?? 0).toFixed(5);
  const displayLng = (longitude ?? lng ?? 0).toFixed(5);

  return `
    <div style="padding: 4px; min-width: 140px;">
      <strong style="font-size: 14px; color: #333;">${finalName}</strong><br/>
      <div style="font-size: 11px; color: #666; margin-top: 4px; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 4px;">
        Lat: ${displayLat}<br/>
        Lng: ${displayLng}
      </div>
      <button id="pop-del-${id}" style="width: 100%; background: #ff4d4f; color: white; border: none; border-radius: 4px; padding: 4px; cursor: pointer;">
        Remove
      </button>
    </div>
  `;
};





const defaultIcon = createColoredIcon('red');

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
  const [tempMarkerPos, setTempMarkerPos] = useState(null);
  const tempMarkerRef = useRef(null);
  const [showSafehaven, setShowSafehaven] = useState(false);

  // State for Amenities
  const [isOpen, setIsOpen] = useState(false);
  const [amenityPopup, setAmenityPopup] = useState(null); 

  // Heatmap options
  const radius = 55;
  const blur = 70;
  const getMaxIntensity = (zoom) => {
    if (zoom >= 16) return 1.2;
    if (zoom >= 15) return 1.7;
    if (zoom >= 14) return 2.2;
    return 0.3;
  };

  // Handle deletion of a saved location
  const handleDelete = async (id) => {
    if (!id) return;
    try {
      const response = await fetch(`/api/location/delete/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setLocations(prev => prev.filter(l => l.id !== id));
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // Fetch amenities from Overpass API
  const fetchAmenities = async (lat, lng, radius = 400) => {
 const amenityTypes = [
						"pub", "bar", "restaurant", "cafe", "fast_food", "biergarten", "ice_cream",

						"cinema", "theatre", "arts_centre", "museum", "library", "karaoke_box",
						"nightclub", "escape_game", "bowling_alley",
						"community_centre", "social_centre", "youth_centre",
						"townhall", "public_bookcase", "cultural_centre", "community_hall",

						"bakery",

						"park", "garden", "recreation_ground", "playground", "common",
						"dog_park", "pitch", "golf_course", "outdoor_seating",

						"beach", "nature_reserve", "pitch"

				];
				const tags = ["amenity", "leisure", "natural", "landuse"];
const query = `
[out:json];
(
  ${tags
    .map(tag =>
      amenityTypes
        .map(type => `
          node["${tag}"="${type}"](around:${radius},${lat},${lng});
          way["${tag}"="${type}"](around:${radius},${lat},${lng});
          relation["${tag}"="${type}"](around:${radius},${lat},${lng});
        `)
        .join("")
    )
    .join("")}

      node["leisure"="nature_reserve"](around:${radius},${lat},${lng});
      way["leisure"="nature_reserve"](around:${radius},${lat},${lng});
      relation["leisure"="nature_reserve"](around:${radius},${lat},${lng});

      node["boundary"="protected_area"]["protect_class"="2"](around:${radius},${lat},${lng});
      way["boundary"="protected_area"]["protect_class"="2"](around:${radius},${lat},${lng});
      relation["boundary"="protected_area"]["protect_class"="2"](around:${radius},${lat},${lng});

      node["boundary"="national_park"](around:${radius},${lat},${lng});
      way["boundary"="national_park"](around:${radius},${lat},${lng});
      relation["boundary"="national_park"](around:${radius},${lat},${lng});
    );
    out center;
    `;
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'text/plain' }
      });
      const data = await res.json();
      const elements = data.elements;

      // Calculate distance and sort
      const sortedElements = elements.sort((a, b) => {
          const aLat = a.lat || a.center?.lat;
          const aLon = a.lon || a.center?.lon;
          const bLat = b.lat || b.center?.lat;
          const bLon = b.lon || b.center?.lon;

          const distA = Math.sqrt(Math.pow(aLat - lat, 2) + Math.pow(aLon - lng, 2));
          const distB = Math.sqrt(Math.pow(bLat - lat, 2) + Math.pow(bLon - lng, 2));
          
          return distA - distB;
      });

      return sortedElements;
    } catch (e) {
      console.error("Overpass error", e);
      return [];
    }
  };


  useEffect(() => {
  const syncDatabase = async () => {
    try {
      const response = await fetch('/api/location/saved', {
        credentials: 'include' 
      });

      const data = await response.json();

      // Your controller wraps the array in a 'locations' key
      if (data && data.locations) {
        setLocations(data.locations);
      }
    } catch (err) {
      console.error("Sync failed. Check if your cookie is expired.");
    }
  };
  syncDatabase();
  }, []);

  // Helper to get heat intensity at a specific location
  function getHeatAtLocation(lat, lng) {
    if (!heatData || heatData.length === 0) return 0;
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

 

  // Fetch heatmap data for the current map bounds
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
          topLeftLat: nw.lat, topLeftLong: nw.lng,
          topRightLat: ne.lat, topRightLong: ne.lng,
          bottomRightLat: se.lat, bottomRightLong: se.lng,
          bottomLeftLat: sw.lat, bottomLeftLong: sw.lng,
        }),
      });
      const data = await res.json();
      setHeatData(data && Array.isArray(data.heat) ? data.heat : []);
    } catch (e) {
      setHeatData([]);
    }
  };

// 1. INITIALIZE MAP (Runs only once)
useEffect(() => {
  if (!mapRef.current || leafletMap.current) return;
  
  const ukBounds = L.latLngBounds(L.latLng(49.4, -12), L.latLng(59.0, 2.5));
  leafletMap.current = L.map(mapRef.current, {
    center: [51.5, -1.0],
    zoom: 6,
    maxBounds: ukBounds,
    maxBoundsViscosity: 1,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
    minZoom: 6,
  }).addTo(leafletMap.current);

  fetchHeatData(leafletMap.current.getBounds());

  leafletMap.current.on('moveend', () => {
    fetchHeatData(leafletMap.current.getBounds());
    setZoomLevel(leafletMap.current.getZoom());
  });

  leafletMap.current.on('zoomend', () => setZoomLevel(leafletMap.current.getZoom()));
}, []); // Empty dependency array means this only runs ONCE
const calculateLocationScore = (lat, lng, targetLat, targetLng, heatData) => {
  let totalDangerImpact = 0;
  const points = Array.isArray(heatData) ? heatData : [];
  
  // Settings
  const sigma = 0.0012;  // Slightly wider influence
  const maxSearchDist = 0.00025; // 25 meters
  const sensitivity = 0.9; // Adjusted so the score is less "binary"

  points.forEach((point) => {
    // Explicitly use indices since the test showed [lat, lng, intensity]
    const hLat = point[0];
    const hLng = point[1];
    const hVal = point[2] || 1;

    // Use a basic squared distance check first (faster)
    const d2 = Math.pow(lat - hLat, 2) + Math.pow(lng - hLng, 2);
    const d = Math.sqrt(d2);
    
    if (d < maxSearchDist) {
      // Gaussian decay: closer crimes hurt the score more
      const impact = hVal * Math.exp(-d2 / (2 * Math.pow(sigma, 2)));
      totalDangerImpact += impact;
    }
  });

  const crimeIntensity = Math.min(totalDangerImpact / sensitivity, 1);
  const safetyGrade = Math.round((1 - crimeIntensity) * 100);

  // Distance from click to amenity
  const rawDist = Math.sqrt(Math.pow(lat - targetLat, 2) + Math.pow(lng - targetLng, 2));
  const normalizedDist = Math.min(rawDist / 0.01, 1);
  
  const score = (0.8 * (1 - crimeIntensity)) + (0.2 * (1 - normalizedDist));

  return {
    totalScore: score.toFixed(2),
    safetyGrade: safetyGrade,
    crimeLevel: crimeIntensity
  };
};
// 2. CLICK HANDLER (Updates whenever 'locations' changes)
useEffect(() => {
  if (!leafletMap.current) return;

  // Remove the old listener before adding a new one to prevent duplicates
  leafletMap.current.off('click');

  leafletMap.current.on('click', async (e) => {
    const { lat, lng } = e.latlng;

    // --- SELECTION PIN ---
    if (tempMarkerRef.current) tempMarkerRef.current.remove();
    const tempIcon = createColoredIcon('blue');
    const newTempMarker = L.marker([lat, lng], { icon: tempIcon }).addTo(leafletMap.current);
    tempMarkerRef.current = newTempMarker;

    newTempMarker.on('click', (markerEvent) => {
      L.DomEvent.stopPropagation(markerEvent);
      setPopup({ lat, lng });
      setPlaceName('');
    });

    // --- AMENITIES + SAVED PLACES LOGIC ---
    setIsOpen(true);
    setAmenityPopup({ lat, lng, amenities: null });

    const apiAmenities = await fetchAmenities(lat, lng);

    // Merge logic using the LATEST 'locations' state
    const localSaved = locations.map(loc => {
      const lLat = loc.latitude ?? loc.lat;
      const lLng = loc.longitude ?? loc.lng;
      const dist = Math.sqrt(Math.pow(lLat - lat, 2) + Math.pow(lLng - lng, 2));

      return {
        id: loc.id,
        isSavedPin: true, // Matches your ThirdspaceCard logic
        lat: lLat,
        lon: lLng,
        name: loc.name || 'Saved Place',
        tags: { name: loc.name || 'Saved Place', amenity: 'favourite' },
        distance: dist
      };
    });

   const formattedApi = apiAmenities.map(amt => {
    const aLat = amt.lat || amt.center?.lat;
    const aLon = amt.lon || amt.center?.lon;
    
   const assessment = calculateLocationScore(aLat, aLon, lat, lng, heatData);

    return {
        ...amt,
        isSavedPin: false,
        distance: Math.sqrt(Math.pow(aLat - lat, 2) + Math.pow(aLon - lng, 2)),
        score: assessment.totalScore,    // For sorting
        safetyGrade: assessment.safetyGrade, // For the UI Bar
        crimeLevel: assessment.crimeLevel    // For the UI Color
      };
    });

    // Sort so the safest, closest places appear at the top of the panel
    const combinedList = [...localSaved, ...formattedApi].sort((a, b) => b.score - a.score);
  setAmenityPopup({ lat, lng, amenities: combinedList });
  });
  window.debugMap = { heatData, locations };
}, [locations, heatData]); // RE-BINDS THE CLICK EVENT WHENEVER LOCATIONS CHANGE

  //temp marker management
  useEffect(() => {
  if (!leafletMap.current) return;

  // 1. Remove the old temporary marker if it exists
  if (tempMarkerRef.current) {
    tempMarkerRef.current.remove();
  }

  // 2. If we have a position, create a blue marker (so it looks different)
  if (tempMarkerPos) {
    const blueIcon = createColoredIcon('blue');
    tempMarkerRef.current = L.marker([tempMarkerPos.lat, tempMarkerPos.lng], { 
      icon: blueIcon,
      zIndexOffset: 1000 // Keep it on top
    }).addTo(leafletMap.current);
  }

  return () => {
    if (tempMarkerRef.current) tempMarkerRef.current.remove();
  };
}, [tempMarkerPos]);

  // Marker management (Public + User Saved)
  useEffect(() => {
    if (!leafletMap.current) return;
    if (leafletMap.current._markers) {
      leafletMap.current._markers.forEach(m => m.remove());
    }
    const publicMarkers = publicSpaces.map(space => {

      if (space.lat == null || space.lng == null) return null;
      const marker = L.marker([space.lat, space.lng], { icon: defaultIcon }).addTo(leafletMap.current);
      marker.bindPopup(createPopUpContent(space));
      return marker;
    }).filter(Boolean);


  const placeMarkers = (showUserMarkers > 0 ? locations : []).map(loc => {
    
    const lat = loc.latitude ?? loc.lat;
    const lng = loc.longitude ?? loc.lng;
    const heatVal = getHeatAtLocation(lat, lng);
    let color = 'yellow';
      if (heatVal > 0.4) color = 'red';
      else if (heatVal > 0.2) color = 'orange';
      else color = 'yellow';
      const icon = createColoredIcon(color);
    if (lat == null || lng == null) return null;

    const marker = L.marker([lat, lng], { icon: icon }).addTo(leafletMap.current);
  
    marker.bindPopup(createPopUpContent(loc));

  marker.on('popupopen', () => {
    const btn = document.getElementById(`pop-del-${loc.id}`);
    if (btn) {
      // Attach the click handler to the raw DOM element
      btn.onclick = () => {
        handleDelete(loc.id);
        leafletMap.current.closePopup(); // Close the popup after clicking
      };
    }
  });

  return marker;
}).filter(Boolean);

    leafletMap.current._markers = [...publicMarkers, ...placeMarkers];
  }, [publicSpaces, locations, showUserMarkers, heatData]);

  // Heat Layer management
  useEffect(() => {
    // Ensure Leaflet map and heat plugin are loaded
    if (!leafletMap.current || !window.L.heatLayer) return;
    if (heatLayerRef.current) heatLayerRef.current.remove();

    //Only show the heatmap if the toggle is on, we have data, and we're zoomed in enough
    if (showHeat && heatData.length > 0 && zoomLevel >= 14) {
      heatLayerRef.current = window.L.heatLayer(heatData, {
        radius, blur, maxZoom: 17,
        gradient: { 0.4: '#ff9999', 0.8: '#ff2222', 1.0: '#ff0000' },
        max: getMaxIntensity(zoomLevel),
      }).addTo(leafletMap.current);
    }
  }, [heatData, showHeat, zoomLevel]);


  //handles the submission of the "Save Location" form in the popup
  const handlePopupSubmit = async (e) => {
    e.preventDefault();
    if (!popup || !placeName.trim()) return;

    // 1. ADD A TEMPORARY ID (Date.now() works great for this)
    const newLoc = { 
        id: Date.now(), // This allows handleDelete to work immediately
        lat: popup.lat, 
        lng: popup.lng, 
        name: placeName.trim() 
    };
  
    setLocations(prev => [...prev, newLoc]);
    setPopup(null); 

    try {
        await fetch('/api/location/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLoc)
        });
        // Note: In a production app, you'd replace the temp ID 
        // with the real ID from the server response here.
    } catch (err) { 
        console.error(err); 
    }
        
    // 2. Remove the blue marker
    if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
        tempMarkerRef.current = null;
    }
};
  

return (
  <div className="map-page-wrapper" style={{ display: 'flex', height: '750px', position: 'relative', overflow: 'hidden' }}>
    
    {/* 1. SIDEBAR PANEL CONTAINER */}
    <div className={`side-panel ${isOpen ? 'open' : ''}`}>
      {amenityPopup && (
        <Panel
          // Removing the key here prevents the component from unmounting/remounting
          // which allows the CSS transition to work smoothly
          isOpen={isOpen}
          closePanel={() => setIsOpen(false)}
          amenities={amenityPopup.amenities}
        />
      )}
    </div>

    {/* 2. MAP CONTAINER */}
    <div style={{ position: 'relative', flexGrow: 1 }}>
      <div ref={mapRef} style={{ height: '750px', width: '100%' }} />
      
      {/* Save Location Overlay Form */}
        {popup && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', zIndex: 1000 }}>
            <form onSubmit={handlePopupSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, display: 'flex', flexDirection: 'column', minWidth: 300 }}>
              <label>Place Name: <input type="text" value={placeName} onChange={e => setPlaceName(e.target.value)} style={{ width: '100%' }} autoFocus /></label>
              <div style={{ margin: '8px 0' }}>Lat: {popup.lat.toFixed(5)} | Lng: {popup.lng.toFixed(5)}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit">Add Place</button>
                <button type="button" onClick={() => setPopup(null)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>

    {/* 3. FILTERS (Right Side) */}
    <div className="filter-sidebar">
      <h1>Filters</h1>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setShowHeat(!showHeat)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}>
          <img src={showHeat ? heatOnPng : heatOffPng} alt="toggle" style={{ width: 40, height: 40 }} />
        </button>
        <span>Show Heatmap</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setShowUserMarkers(!showUserMarkers)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}>
          <img src={showUserMarkers ? favOnPng : favOffPng} alt="toggle" style={{ width: 40, height: 40 }} />
        </button>
        <span>Show Saved Places</span>
      </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button
            onClick={() => setShowSafehaven(!showSafehaven)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}
          >
            <img src={showUserMarkers ? favOnPng : favOffPng} style={{ width: 40, height: 40 }} />
          </button>
          <span>Show Nearby Safehaven</span>
          
        </div>
           {showSafehaven && <Safehaven />}
    </div>
    </div>
);
};

export default CombinedMap;