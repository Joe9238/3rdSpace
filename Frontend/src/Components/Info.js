import { useState } from "react";
import { authRequest } from "../utils/AuthRequest";

export default function Info({ onLogout }) {
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, Result] = useState("");
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
            const data = await res.json();
            if (res.ok){
                const actualResult = await res.text();
                Result(actualResult);
                setMessage("Refreshed Successfully");
            } else {
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
            <button onClick={InfoRefresh}>⟳</button>
            <h1>{Result}</h1>
            <p>Stats..: </p>
            <p>Saved Places NUM, Visted Places: NUM</p>
            <p>List saved places: </p>
            <ul>{savedPlaces.map(place => 
            <li>{place}</li>
            )}</ul>
        </div>
    );

}
