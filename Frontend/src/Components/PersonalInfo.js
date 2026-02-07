import { useState } from "react";
import { authRequest } from "../utils/AuthRequest";

export default function PersonalInfo({ onLogout }) {
    const [newUsername, setNewUsername] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChangeUsername = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        if (!newUsername) {
            setError("Username required.");
            return;
        }
        setLoading(true);
        try {
            const res = await authRequest(`/api/auth/change-username`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newUsername })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage("Username changed successfully. Please log in again.");
                setNewUsername("");
                if (onLogout) onLogout();
            } else {
                setError(data.error || "Failed to change username.");
            }
        } catch (err) {
            setError("Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Personal Info</h2>
            <form onSubmit={handleChangeUsername} style={{ marginTop: 24 }}>
                <label>New Username:</label>
                <input
                    type="text"
                    value={newUsername}
                    id="edit-username"
                    onChange={e => setNewUsername(e.target.value)}
                    style={{ width: 300, padding: 8, marginLeft: 8 }}
                />
                <button type="submit" id="change-username-submit" disabled={loading} style={{ marginLeft: 12, padding: "8px 16px" }}>
                    {loading ? "Changing..." : "Change Username"}
                </button>
            </form>
            {message && <div style={{ color: "green", marginTop: 12 }}>{message}</div>}
            {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
            <p style={{ color: "grey", marginTop: 12, fontSize: 14 }}>Note: Changing your username will log you out and require you to log in again with the new username.</p>
        </div>
    );
}