import { useState } from "react";
import { authRequest } from "../utils/AuthRequest";

export default function Info({ onLogout }) {
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState("");
    const savedPlaces = [
        "Drake Circus", 
        "Mcdonalds George Street", 
        "The Hoe"
    ];

    const InfoRefresh = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);
        try {
            const res = await authRequest(`/api/auth/getMe`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok){
                const actualResult = await res.text();
                setResult(actualResult);
                setMessage("Refreshed Successfully");
            } else {
                const data = await res.json();
                setError(data.error || "Failed to Refresh");
            }        
        } catch (err) {
            setError("Network error.");
        } finally {
            setLoading(false);
        }
    }

    return(
        <div>
            <button onClick={InfoRefresh} disabled={loading}>⟳</button>
            {message && <div style={{ color: 'green' }}>{message}</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <h1>{result}</h1>
            <p>Stats..: </p>
            <p>Saved Places NUM, Visted Places: NUM</p>
            <p>List saved places: </p>
            <div>
                {savedPlaces.map((place, idx) => (
                    <div key={idx} style={{ marginBottom: 4 }}>{place}</div>
                ))}
            </div>
        </div>
    );

}
