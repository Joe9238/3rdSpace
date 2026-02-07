import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
	const mapRef = useRef(null);
	const leafletMap = useRef(null);
	const heatLayerRef = useRef(null);
	const [showHeat, setShowHeat] = useState(true);
	const [heatData, setHeatData] = useState([]);
	const [zoomLevel, setZoomLevel] = useState(6);
	const fetchTimeout = useRef(null);
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

	// Helper to fetch heat data for given bounds
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

		// Set initial zoom
		setZoomLevel(leafletMap.current.getZoom());

		return () => {
			leafletMap.current.off('moveend', onMoveEnd);
			leafletMap.current.off('zoomend', onZoom);
		};
	}, []);

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
			</div>
		</div>
	);
};

export default Map;
