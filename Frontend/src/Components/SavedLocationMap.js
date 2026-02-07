import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import greenMarkerIcon2x from 'leaflet-color-markers/img/marker-icon-2x-green.png';
import greenMarkerIcon from 'leaflet-color-markers/img/marker-icon-green.png';
import greenMarkerShadow from 'leaflet-color-markers/img/marker-shadow.png';

// Click the map to add markers.


const defaultIcon = L.icon({
	iconUrl: markerIcon,
	iconRetinaUrl: markerIcon2x,
	shadowUrl: markerShadow,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

const eventIcon = L.icon({
	iconUrl: greenMarkerIcon,
	iconRetinaUrl: greenMarkerIcon2x,
	shadowUrl: greenMarkerShadow,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

const SavedLocationMap = () => {
	const mapRef = useRef(null);
	const leafletMap = useRef(null);
	const [locations, setLocations] = useState([]);
	const [events, setEvents] = useState([]);
	const [popup, setPopup] = useState(null); // {lat, lng} or null
	const [placeName, setPlaceName] = useState('');

	useEffect(() => {
		if (!mapRef.current || leafletMap.current) return;

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

		// Add click handler
		leafletMap.current.on('click', e => {
			const { lat, lng } = e.latlng;
			setPopup({ lat, lng });
			setPlaceName('');
		});
	}, []);

	// Add/remove markers
	useEffect(() => {
		if (!leafletMap.current) return;
		if (leafletMap.current._markers) {
			leafletMap.current._markers.forEach(m => m.remove());
		}
		// User-saved places (red)
		const placeMarkers = locations.map(loc => {
			const marker = L.marker([loc.lat, loc.lng], { icon: defaultIcon }).addTo(leafletMap.current);
			let popupContent = '';
			if (loc.name) {
				popupContent += `<strong>${loc.name}</strong><br/>`;
			}
			popupContent += `Lat: ${loc.lat.toFixed(5)}<br/>Lng: ${loc.lng.toFixed(5)}`;
			marker.bindPopup(popupContent);
			return marker;
		});
		// Event markers (blue)
		const eventMarkers = events.map(ev => {
			const marker = L.marker([ev.latitude, ev.longitude], { icon: eventIcon }).addTo(leafletMap.current);
			let popupContent = `<strong style='color:#1976d2'>Event: ${ev.name}</strong><br/>`;
			if (ev.bar && ev.bar.name) popupContent += `Bar: ${ev.bar.name}<br/>`;
			if (ev.start_at) popupContent += `Start: ${ev.start_at}<br/>`;
			if (ev.end_at) popupContent += `End: ${ev.end_at}<br/>`;
			marker.bindPopup(popupContent);
			return marker;
		});
		leafletMap.current._markers = [...placeMarkers, ...eventMarkers];
	}, [locations, events]);

	// Handle popup form submission
	const handlePopupSubmit = async (e) => {
		e.preventDefault();
		if (!popup || !placeName.trim()) return;
		const newLoc = { lat: popup.lat, lng: popup.lng, name: placeName.trim() };
		setLocations(prev => [...prev, newLoc]);
		setPopup(null);
		setPlaceName('');
		// Optionally: save to backend
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

	// Mock event data for demonstration (Plymouth)
	useEffect(() => {
		setEvents([
			{
				id: 'event-1',
				name: 'Plymouth Pub Quiz',
				latitude: 50.3755,
				longitude: -4.1427,
				bar: { name: 'The Navy Inn' },
				start_at: '2026-02-10T19:00:00Z',
				end_at: '2026-02-10T22:00:00Z',
			},
			{
				id: 'event-2',
				name: 'Live DJ Night',
				latitude: 50.3700,
				longitude: -4.1430,
				bar: { name: 'Union Rooms' },
				start_at: '2026-02-11T21:00:00Z',
				end_at: '2026-02-11T23:30:00Z',
			},
			{
				id: 'event-3',
				name: 'Open Mic',
				latitude: 50.3770,
				longitude: -4.1340,
				bar: { name: 'The Bank' },
				start_at: '2026-02-12T20:00:00Z',
				end_at: '2026-02-12T23:00:00Z',
			},
			{
				id: 'event-4',
				name: 'Karaoke Night',
				latitude: 50.3725,
				longitude: -4.1450,
				bar: { name: 'Walkabout Plymouth' },
				start_at: '2026-02-13T20:00:00Z',
				end_at: '2026-02-13T23:00:00Z',
			},
		]);
	}, []);

	return (
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
	);
};

export default SavedLocationMap;
