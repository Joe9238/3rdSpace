import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      if (onLogin) onLogin(); // call to app.js to update auth state (for navbar)

      navigate("/profile");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{display: "flex", flexDirection:"column", justifyContent:"center", alignItems:"center"}}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "300px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={{ width: "90px", textAlign: "left" }} htmlFor="login-username">
            Username
          </label>
          <input
            id="login-username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={{ width: "90px", textAlign: "left" }} htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <button type="submit" id="login-submit" style={{ marginTop: "16px" }}>Log in</button>
      <div style={{ marginTop: "1rem" }}>
        <span>Don't have an account? </span>
        <a href="/register" id="register-redirect" style={{ color: "#2563eb" }}>Register</a>
      </div>
    </form>
  );
}

export default Login;
