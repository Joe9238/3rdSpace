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
      const res = await fetch(`/api/auth/register`, {
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

      try {
        const checkRes = await fetch(`/api/rooms/validate`, {
          method: "GET",
          credentials: "include"
        });
        const body = await checkRes.json().catch(() => ({}));
        if (body.hasPendingReservation) {
          navigate("/payment");
        } else {
          navigate("/profile");
        }
      } catch {
        navigate("/profile");
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{display: "flex", flexDirection:"column", justifyContent:"center", alignItems:"center"}}>
      <h2>Register</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "300px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={{ width: "90px", textAlign: "left" }} htmlFor="register-username">
            Username
          </label>
          <input
            id="register-username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={{ width: "90px", textAlign: "left" }} htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <button type="submit" id="register-submit" style={{ marginTop: "16px" }}>Create account</button>
      <div style={{ marginTop: "1rem" }}>
        <span>Already have an account? </span>
        <a href="/login" id="login-redirect" style={{ color: "#2563eb" }}>Log in</a>
      </div>
    </form>
  );
}

export default Login;
