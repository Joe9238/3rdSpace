import logo from './images/logo.png';
import './App.css';
import { useEffect, useState } from 'react';
import Login from './Pages/Login';
import Profile from './Pages/Profile';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import RequireAuth from './utils/RequireAuth';
import { authRequest } from './utils/AuthRequest';
import Register from './Pages/Register';
import { useNavigate } from 'react-router-dom';
import Map from './Components/Map';

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Recheck authentication on page load
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await authRequest(`/api/auth/validate`, {
          method: "POST",
        });
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await authRequest(`/api/auth/logout`, {
      method: "POST",
    });
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <div className="App">
      <nav className="App-nav">
        <Link to="/"><img src={logo} id="logo" className="App-logo" alt="logo" /></Link>
        {isAuthenticated ? (
          <Link to="/profile" className="nav-button">Profile</Link>
        ) : (
          <div>
            <Link to="/register" className="nav-button" style={{ paddingRight: "20px" }}>Register</Link>
            <Link to="/login" className="nav-button">Login</Link>
          </div>
        )}
      </nav>
      
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onLogin={handleLogin} />} />

        <Route
          path="/profile"
          element={
            <RequireAuth onAuthChange={setIsAuthenticated}>
              <Profile onLogout={handleLogout} />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}

export default AppWrapper;