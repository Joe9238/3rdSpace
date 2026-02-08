import React from "react";
import "./Panel.css";

const ThirdspaceCard = ({ amenity }) => {
  const tags = amenity.tags || {};
  const isSaved = amenity.isSavedPin;

  // 1. Extract the scores we calculated in the Map component
  const safetyScore = amenity.score || 0;
  const crimeLevel = amenity.crimeLevel || 0;

  const getAccessibility = () => {
    return {
      wheelchair: tags.wheelchair || (isSaved ? "N/A" : "unknown"),
      ramp: tags.ramp || (isSaved ? "N/A" : "unknown"),
      smoothness: tags.smoothness || (isSaved ? "N/A" : "unknown"),
      surface: tags.surface || (isSaved ? "N/A" : "unknown"),
    };
  };

  // Determine badge color based on the weighted score
  const getScoreColor = (score) => {
    if (score > 0.7) return "#28a745"; // Green (Safe/Close)
    if (score > 0.4) return "#ffc107"; // Yellow (Average)
    return "#dc3545"; // Red (High Crime or very far)
  };

  const acc = getAccessibility();
  const name = amenity.name || tags.name || "Unnamed Place";

  const type = isSaved 
    ? "⭐ Saved Place" 
    : (tags.amenity || tags.leisure || tags.shop || tags.natural || "Location");

  const lat = amenity.lat || amenity.latitude || amenity.center?.lat;
  const lon = amenity.lon || amenity.longitude || amenity.lng || amenity.center?.lon;

  if (!lat || !lon) return null;

  const cardStyle = isSaved ? {
      borderLeft: "5px solid gold",
      backgroundColor: "#fffbe6",
      padding: "15px",
      marginBottom: "12px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  } : { 
      padding: "15px", 
      marginBottom: "12px",
      borderLeft: `5px solid ${getScoreColor(safetyScore)}`,
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  };

  return (
    <div className="singleCard">
      <div className="amenity-card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <strong style={{ fontSize: '1.1em' }}>{name}</strong>
          {/* Weighted Score Badge */}
          <div style={{
            backgroundColor: getScoreColor(safetyScore),
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75em',
            fontWeight: 'bold'
          }}>
            {Math.round(safetyScore * 100)}% Match
          </div>
        </div>

        <p style={{ color: isSaved ? '#b8860b' : '#666', fontWeight: isSaved ? 'bold' : 'normal', margin: '4px 0' }}>
          {type}
        </p>

        {/* 2. Visual Safety & Distance Breakdown */}
        <div style={{ margin: '12px 0', padding: '8px', background: '#f8f9fa', borderRadius: '4px', fontSize: '0.85em' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Safety Rating:</span>
            <span style={{ fontWeight: 'bold', color: crimeLevel > 0.5 ? '#dc3545' : '#28a745' }}>
              {crimeLevel > 0.5 ? crimeLevel.toFixed(2) : crimeLevel.toFixed(2)}
            </span>
          </div>
          {/* Simple progress bar representing (1 - crimeLevel) */}
          <div style={{ width: '100%', height: '6px', background: '#e9ecef', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${(1 - crimeLevel) * 100}%`, 
              height: '100%', 
              background: getScoreColor(1 - crimeLevel),
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        <p style={{ marginTop: '8px', marginBottom: '4px', fontSize: '0.9em' }}><strong>Accessibility</strong></p>
        <ul style={{ fontSize: '0.8em', listStyle: 'none', paddingLeft: 0, color: '#555' }}>
            <li>♿ Wheelchair: {acc.wheelchair}</li>
            <li>Slope: {acc.ramp}</li>
            <li>Surface: {acc.surface} ({acc.smoothness})</li>
        </ul>
        
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`} 
          target="_blank" 
          rel="noreferrer"
          style={{ 
            display: 'inline-block', 
            marginTop: '10px', 
            fontSize: '0.85em', 
            color: '#007bff', 
            textDecoration: 'none',
            fontWeight: '500' 
          }}
        >
          View on Google Maps →
        </a>
      </div>
    </div>
  );
};



function Panel({ isOpen, closePanel, amenities }) {
  if (!isOpen) return null;

  return (
    <div className={`Panel-container ${isOpen ? 'active' : ''}`}>
      <div className="Panel-header" style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5em' }}>Nearby Places</h1>
        <button className="exit" onClick={closePanel} style={{ background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer' }}>×</button>
      </div>
      
      <div className="list" style={{ padding: '15px', overflowY: 'auto', height: 'calc(100% - 80px)' }}>
        {amenities === null ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ marginBottom: '10px' }}>⌛</div>
            <p style={{ color: '#888', fontStyle: 'italic' }}>Analyzing safety and proximity...</p>
          </div>
        ) : Array.isArray(amenities) && amenities.length === 0 ? (
          <p className="no-data" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No places found in this area.</p>
        ) : (
          Array.isArray(amenities) && amenities.map((amenity, index) => (
            <ThirdspaceCard key={amenity.id || index} amenity={amenity} />
          ))
        )}
      </div>
    </div>
  );
}

export default Panel;