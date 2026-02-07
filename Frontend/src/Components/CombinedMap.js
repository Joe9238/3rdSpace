import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import heatOnPng from '../images/heat-on.png';
import heatOffPng from '../images/heat-off.png';
import favOnPng from '../images/favourite-on.png';
import favOffPng from '../images/favourite-off.png';
import Panel from "../Components/panel";
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
  const [airData, setAirData] = useState([]); 
  const [showAirQuality, setShowAirQuality] = useState(false);
  const [tempMarkerPos, setTempMarkerPos] = useState(null);
  const tempMarkerRef = useRef(null);

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

						"beach", "nature_reserve"

				];
				const tags = ["amenity", "leisure", "natural", "landuse"];
				const query = `
					[out:json];
					(
				${tags.map( tag =>
				       amenityTypes.map(type => `
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

					node["natural"](around:${radius},${lat},${lng});
					way["natural"](around:${radius},${lat},${lng});
					relation["natural"](around:${radius},${lat},${lng});
					);

					node["boundary"="protected_area"]["protect_class"="2"](around:${radius},${lat},${lng});
					way["boundary"="protected_area"]["protect_class"="2"](around:${radius},${lat},${lng});
					relation["boundary"="protected_area"]["protect_class"="2"](around:${radius},${lat},${lng});

					node["boundary"="national_park"](around:${radius},${lat},${lng});
					way["boundary"="national_park"](around:${radius},${lat},${lng});
					relation["boundary"="national_park"](around:${radius},${lat},${lng});

					out center;
				`;
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'text/plain' }
      });
      const data = await res.json();
      return data.elements;
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

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const ukBounds = L.latLngBounds(L.latLng(49.4, -12), L.latLng(59.0, 2.5));
    //set to UK center and zoomed out
    leafletMap.current = L.map(mapRef.current, {
      center: [51.5, -1.0],
      zoom: 6,
      maxBounds: ukBounds,
      maxBoundsViscosity: 1,
    });
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
      minZoom: 6,
    }).addTo(leafletMap.current);

    fetchHeatData(leafletMap.current.getBounds()); // Initial heat data load

    // Update heat data and zoom level on map interactions
    leafletMap.current.on('moveend', () => {
      fetchHeatData(leafletMap.current.getBounds());
      setZoomLevel(leafletMap.current.getZoom());
    });
    leafletMap.current.on('zoomend', () => setZoomLevel(leafletMap.current.getZoom())); // Keep track of zoom level

    // Click handler does Fetch Amenities and sets a temp marker
leafletMap.current.on('click', async e => {
    const { lat, lng } = e.latlng;

    // Remove the previous marker if it exists
    if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
    }

    // Create the new blue marker
    const tempIcon = createColoredIcon('blue');
    const newTempMarker = L.marker([lat, lng], { 
        icon: tempIcon,
        alt: "Selection Marker"
    }).addTo(leafletMap.current);
    
    tempMarkerRef.current = newTempMarker;

    // The marker now waits to be clicked
    newTempMarker.on('click', (markerEvent) => {
        // Prevent the map click from firing again
        L.DomEvent.stopPropagation(markerEvent); 
        
        // Open your naming form
        setPopup({ lat, lng }); 
        setPlaceName('');
    });

    //Update sidebar amenities 
    setAmenityPopup({ lat, lng, amenities: null });
    const amenities = await fetchAmenities(lat, lng);
    setAmenityPopup({ lat, lng, amenities });
});
    leafletMap.current.on('click', async e => {
      const { lat, lng } = e.latlng;
      setPopup({ lat, lng });
      setPlaceName('');
      setIsOpen(true); 
      setAmenityPopup({ lat, lng, amenities: null }); 
      const amenities = await fetchAmenities(lat, lng);
      setAmenityPopup({ lat, lng, amenities });
    });

    return () => {
      leafletMap.current.off('moveend');
      leafletMap.current.off('zoomend');
      leafletMap.current.off('click');
    };
  }, []);

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


  const placeMarkers = locations.map(loc => {
    
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
    const newLoc = { lat: popup.lat, lng: popup.lng, name: placeName.trim() };
  
    setLocations(prev => [...prev, newLoc]); // Optimistically add to UI
    setPopup(null); // Close the popup immediately
    // Save to backend, no need to wait for this to update UI
    try {
      await fetch('/api/location/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLoc)
      });
    } catch (err) { console.error(err); }
    setPopup(null); // Close the popup immediately
        
        // Remove the blue marker now that it's a permanent "Saved" marker
        if (tempMarkerRef.current) {
            tempMarkerRef.current.remove();
            tempMarkerRef.current = null;
        }
    
  };
  

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
      <div style={{ position: 'relative', width: 750, height: 750 }}>
        <div ref={mapRef} style={{ height: 750, width: 750 }} />
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

      {/* SIDEBAR */}
      <div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', width: 350, height: 750, background: '#fafafa', borderRadius: 8, padding: 16, overflowY: 'auto' }}>
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
 </div>

        {amenityPopup && (
					<Panel
					    key={`${amenityPopup?.lat}-${amenityPopup?.lng}`}
						isOpen={isOpen}
						closePanel={() => setIsOpen(false)}
						amenities={amenityPopup.amenities}
					/>
                    )}
                  
     
    </div>
  );
};

export default CombinedMap;