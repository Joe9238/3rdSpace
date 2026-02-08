import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ paddingLeft: '20px'}}>
      <h1>Welcome to 3rdSpace</h1>
      <p style={{ fontSize: '18px', marginBottom: '2rem' }}>
        Explore public spaces, view crime heatmaps, and manage your profile securely.
      </p>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '2rem' }}>
        <Link to="/map" className="nav-button" style={{ fontSize: '18px' }}>View Map</Link>
        <Link to="/profile" className="nav-button" style={{ fontSize: '18px' }}>Profile</Link>
        <Link to="/login" className="nav-button" style={{ fontSize: '18px' }}>Login</Link>
        <Link to="/register" className="nav-button" style={{ fontSize: '18px' }}>Register</Link>
      </div>
      <section style={{ marginBottom: '2rem' }}>
        <h2>Features</h2>
        <div style={{ fontSize: '16px' }}>
          Interactive map of public spaces<br />
          Crime heatmap visualization<br />
          Personal profile management<br />
          Secure authentication
        </div>
      </section>
      <section>
        <h2>Get Started</h2>
        <p>Register for an account or log in to access personalized features.</p>
      </section>
    </div>
  );
}

export default Home;
