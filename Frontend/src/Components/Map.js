import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Panel from "../Components/panel";
// Replace with your PNG path
import heatOnPng from '../images/heat-on.png';
import heatOffPng from '../images/heat-off.png';

import 'leaflet.heat';

// Example props:
// publicSpaces: [{ lat, lng, name }]
// heatData: [[lat, lng, intensity], ...]
//
// Usage: <Map publicSpaces={spaces} heatData={heatArray} />


const Map = ({ publicSpaces = [] }) => {
	
    const [isOpen, setIsOpen] = useState(false);
	const mapRef = useRef(null);
	const leafletMap = useRef(null);
	const heatLayerRef = useRef(null);
	const [showHeat, setShowHeat] = useState(true);
	const [heatData, setHeatData] = useState([]);
	const [zoomLevel, setZoomLevel] = useState(6);
	const fetchTimeout = useRef(null);
	// Local cache for heat data, keyed by rounded bounds
	const heatCache = useRef({});
	// Amenity popup state
	const [amenityPopup, setAmenityPopup] = useState(null); // {lat, lng, amenities}
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
				const url = 'https://overpass-api.de/api/interpreter';
				const res = await fetch(url, {
					method: 'POST',
					body: query,
					headers: { 'Content-Type': 'text/plain' }
				});
				const data = await res.json();
				// Filter results to only visitable places
  
            
				return data.elements.filter(a => {
					const amenity = a.tags && a.tags.amenity;
					const shop = a.tags && a.tags.shop;
					return (
						(amenity && amenityTypes.includes(amenity)) || shop
					);
				});
			
			};
		// Fixed heatmap options
		const radius = 55;
		const blur = 70;
		// Dynamically adjust maxIntensity based on zoom
		const getMaxIntensity = (zoom) => {
			if (zoom >= 16) return 1.2;
			if (zoom >= 15) return 1.7;
			if (zoom >= 14) return 2.2;
			return 0.3;
		};


	// Debounced heat data fetch (commented out)
	// const debounceFetch = (() => {
	//     let lastCall = 0;
	//     let timer = null;
	//     return (bounds, delay = 700) => {
	//         if (timer) clearTimeout(timer);
	//         timer = setTimeout(() => {
	//             lastCall = Date.now();
	//             fetchHeatData(bounds);
	//         }, delay);
	//     };
	// })();

	// Helper to round bounds for cache key
	const round = (num, places = 3) => Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
	const boundsKey = (bounds) => {
		const sw = bounds.getSouthWest();
		const ne = bounds.getNorthEast();
		return [round(sw.lat), round(sw.lng), round(ne.lat), round(ne.lng)].join(",");
	};

	// Helper to fetch heat data for given bounds, with cache
	const fetchHeatData = async (bounds) => {
		if (!bounds) return;
		const key = boundsKey(bounds);
		if (heatCache.current[key]) {
			setHeatData(heatCache.current[key]);
			return;
		}
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
				heatCache.current[key] = data.heat;
				setHeatData(data.heat);
			} else {
				setHeatData([]);
			}
		} catch (e) {
			setHeatData([]);
		}
	};

	useEffect(() => {
		if (!mapRef.current) return;
		if (leafletMap.current) return; // Only initialize once

		// UK bounds (SW then NE)
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

		// Fetch initial heat data
		fetchHeatData(leafletMap.current.getBounds());

		// Listen for map move/zoom events
		const onMoveEnd = () => {
			fetchHeatData(leafletMap.current.getBounds());
			setZoomLevel(leafletMap.current.getZoom());
		};
		leafletMap.current.on('moveend', onMoveEnd);
		// Also update zoom on zoom events
		const onZoom = () => setZoomLevel(leafletMap.current.getZoom());
		leafletMap.current.on('zoomend', onZoom);

		// Listen for map click to fetch amenities
		leafletMap.current.on('click', async e => {
			const { lat, lng } = e.latlng;
			setAmenityPopup({ lat, lng, amenities: null }); // Show loading
			const amenities = await fetchAmenities(lat, lng);
            setIsOpen(true); 

			setAmenityPopup({ lat, lng, amenities });

		});

		// Set initial zoom
		setZoomLevel(leafletMap.current.getZoom());

		return () => {
			leafletMap.current.off('moveend', onMoveEnd);
			leafletMap.current.off('zoomend', onZoom);
			leafletMap.current.off('click');
		};
	}, []);
	// Remove popup logic; amenities will be shown in sidebar

	// Add/remove public space markers
	useEffect(() => {
		if (!leafletMap.current) return;
		// Remove existing markers
		if (leafletMap.current._publicMarkers) {
			leafletMap.current._publicMarkers.forEach(m => m.remove());
		}
		// Add new markers
		const markers = publicSpaces.map(space => {
			if (space.lat == null || space.lng == null) return null;
			return L.marker([space.lat, space.lng]).addTo(leafletMap.current);
		}).filter(Boolean);
		leafletMap.current._publicMarkers = markers;
	}, [publicSpaces]);

		// Add/remove heat layer
		useEffect(() => {
			if (!leafletMap.current) return;
			if (!window.L || !window.L.heatLayer) return; // leaflet.heat required
			if (heatLayerRef.current) {
				heatLayerRef.current.remove();
				heatLayerRef.current = null;
			}
			// Only show heatmap if zoomed in (e.g., zoom >= 14)
			if (showHeat && heatData && heatData.length > 0 && zoomLevel >= 14) {
				// Pure red gradient
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
	return (
				



		<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
			<div ref={mapRef} style={{ height: 750, width: 750 }} />
			<div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: 750, width: 350, background: '#fafafa', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 16 }}>
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

		{/*
				
				<div style={{ marginTop: 8, width: '100%' }}>
							

					<div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>Amenities Nearby</div>
					{amenityPopup && amenityPopup.amenities === null && (
						<div style={{ color: '#888', fontStyle: 'italic' }}>Loading amenities...</div>
					)}
					{amenityPopup && amenityPopup.amenities && amenityPopup.amenities.length === 0 && (
						<div style={{ color: '#888', fontStyle: 'italic' }}>No amenities found.</div>
					)}
					{amenityPopup && amenityPopup.amenities && amenityPopup.amenities.length > 0 && (
						<ul style={{ margin: 0, paddingLeft: 18 }}>
							{amenityPopup.amenities.slice(0, 10).map((a, idx) => {
								const name = a.tags && a.tags.name ? a.tags.name : '(Unnamed)';
								const type = a.tags && a.tags.amenity ? a.tags.amenity : (a.tags && a.tags.shop ? a.tags.shop : 'Amenity');
								const desc = a.tags && (a.tags.description || a.tags.note || a.tags['addr:housename'] || a.tags['addr:housenumber']) ?
									(a.tags.description || a.tags.note || a.tags['addr:housename'] || a.tags['addr:housenumber']) : '';
								const latVal = a.lat || (a.center && a.center.lat);
								const lngVal = a.lon || (a.center && a.center.lon);
								return (

									
									<li key={idx} style={{ marginBottom: 8 }}>
										<b>{name}</b> <span style={{ color: '#888' }}>({type})</span>
										{desc && <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{desc}</div>}
										<div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
											Lat: {latVal ? latVal.toFixed(5) : '—'}<br />Lng: {lngVal ? lngVal.toFixed(5) : '—'}
										</div>
									</li>
								);
							})}
						</ul>
					)}
					{amenityPopup && amenityPopup.amenities && amenityPopup.amenities.length > 10 && (
						<div style={{ marginTop: 8, color: '#888' }}>+{amenityPopup.amenities.length - 10} more...</div>
					)}
*/} 
					
			
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

export default Map;
