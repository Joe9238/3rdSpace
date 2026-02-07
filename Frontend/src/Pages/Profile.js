import { useState } from 'react';
import { authRequest } from '../utils/AuthRequest';
import Security from '../Components/Security.js';
import Info from '../Components/Info.js';
import SavedLocationMap from '../Components/SavedLocationMap.js';

const navItems = [
  { key: 'personal', label: 'Personal Info' },
  { key: 'security', label: 'Security' },
  { key: 'map', label: 'Map' }
];

export default function Profile({ onLogout }) {
  const [selected, setSelected] = useState('personal');

  const handleLogout = async () => {
    try {
      await authRequest(`/api/auth/logout`, {
        method: "POST",
      });
    } catch {}

    if (onLogout) onLogout(); // Notify parent
  };

  const renderContent = () => {
    switch (selected) {
      case 'personal': return <Info onLogout={onLogout}/>;
      case 'security': return <Security onLogout={onLogout} />;
      case 'map': return <SavedLocationMap />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '95vh', background: '#f5f6fa' }}>
      <div style={{
        width: 286,
        background: '#222e3c',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 0'
      }}>
        <div>
          {navItems.map(item => (
            <div
              key={item.key}
              id={item.key + '-nav'}
              onClick={() => setSelected(item.key)}
              style={{
                padding: '16px 32px',
                cursor: 'pointer',
                background: selected === item.key ? '#30415d' : 'transparent',
                fontWeight: selected === item.key ? 'bold' : 'normal'
              }}
            >
              {item.label}
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '16px 0',
            background: '#e74c3c',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 16
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ flex: 1, padding: '48px 64px', overflowY: 'auto' }}>
        {renderContent()}
      </div>
    </div>
  );
}