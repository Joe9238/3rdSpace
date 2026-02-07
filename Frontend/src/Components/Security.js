
import { useState } from "react";
import { authRequest } from "../utils/AuthRequest";


export default function Security( { onLogout } ) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [changeLoading, setChangeLoading] = useState(false);
	const [logoutLoading, setLogoutLoading] = useState(false);
	const [logoutMsg, setLogoutMsg] = useState("");
	const [deletePassword, setDeletePassword] = useState("");
	const [deleteError, setDeleteError] = useState("");
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deleteMsg, setDeleteMsg] = useState("");

	const [newUsername, setNewUsername] = useState("");
    const [loading, setLoading] = useState(false);
    
	const handleChangePassword = async (e) => {
		e.preventDefault();
		setError("");
		setMessage("");
		if (!currentPassword || !newPassword || !confirmPassword) {
			setError("All fields are required.");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("New passwords do not match.");
			return;
		}
		if (newPassword.length < 6 || newPassword.length > 16 || newPassword.includes(" ")) {
			setError("Password must be 6-16 characters, no spaces.");
			return;
		}
		setChangeLoading(true);
		try {
			const res = await authRequest(`/api/auth/change-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ currentPassword, newPassword })
			});
			const data = await res.json();
			if (res.ok) {
				setMessage("Password changed successfully.");
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
			} else {
				setError(data.error || "Failed to change password.");
			}
            if (onLogout) onLogout();
		} catch (err) {
			setError("Network error.");
		} finally {
			setChangeLoading(false);
		}





	};
	
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
        }    };

	const handleLogoutAll = async () => {
		setLogoutMsg("");
		setError("");
		setLogoutLoading(true);
		try {
			const res = await authRequest(`/api/auth/logout-everywhere`, {
				method: "POST"
			});
			const data = await res.json();
			if (res.ok) {
				setLogoutMsg("Logged out of all locations.");
			} else {
				setError(data.error || "Failed to log out everywhere.");
			}
		} catch (err) {
			setError("Network error.");
		} finally {
			setLogoutLoading(false);
		}
        if (onLogout) onLogout();
	};

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setDeleteError("");
        setDeleteMsg("");
        if (!deletePassword) {
            setDeleteError("Password is required.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
            return;
        }
        setDeleteLoading(true);
        try {
            const res = await authRequest(`/api/auth/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: deletePassword })
            });
            const data = await res.json();
            if (res.ok) {
                setDeleteMsg("Account deleted. Goodbye!");
                if (onLogout) onLogout();
            } else {
                setDeleteError(data.error || "Failed to delete account.");
            }
        } catch (err) {
            setDeleteError("Network error.");
        } finally {
            setDeleteLoading(false);
        }
    };

	return (
		
		<div style={{ maxWidth: 400, margin: "0 auto" }}>
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
			<h2>Change Password</h2>
			<form onSubmit={handleChangePassword}>
				<div style={{ marginBottom: 16 }}>
					<label>Current Password</label>
					<input
						type="password"
						id="reset-current-password"
						value={currentPassword}
						onChange={e => setCurrentPassword(e.target.value)}
						style={{ width: 380, padding: 8, marginTop: 4 }}
						autoComplete="current-password"
					/>
				</div>
				<div style={{ marginBottom: 16 }}>
					<label>New Password</label>
					<input
						type="password"
						id="reset-new-password"
						value={newPassword}
						onChange={e => setNewPassword(e.target.value)}
						style={{ width: 380, padding: 8, marginTop: 4 }}
						autoComplete="new-password"
					/>
				</div>
				<div style={{ marginBottom: 16 }}>
					<label>Confirm New Password</label>
					<input
						type="password"
						id="reset-confirm-password"
						value={confirmPassword}
						onChange={e => setConfirmPassword(e.target.value)}
						style={{ width: 380, padding: 8, marginTop: 4 }}
						autoComplete="new-password"
					/>
				</div>
				<button type="submit" id="change-password-submit" disabled={changeLoading} style={{ width: "100%", padding: 12, background: "#30415d", color: "#fff", border: "none", fontWeight: "bold" }}>
					{changeLoading ? "Changing..." : "Change Password"}
				</button>
			</form>
			{message && <div style={{ color: "green", marginTop: 12 }}>{message}</div>}
			{error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
            <p style={{ color: "grey", marginTop: 12, fontSize: 14 }}>Note: Changing your password will log you out and require you to log in again with the new password.</p>

			<hr style={{ margin: "32px 0" }} />
			<h2>Log Out Everywhere</h2>
			<button onClick={handleLogoutAll} disabled={logoutLoading} style={{ width: "100%", padding: 12, background: "#e74c3c", color: "#fff", border: "none", fontWeight: "bold" }}>
				{logoutLoading ? "Logging out..." : "Log out across all devices (including this one)"}
			</button>
			{logoutMsg && <div style={{ color: "green", marginTop: 12 }}>{logoutMsg}</div>}

            <hr style={{ margin: "32px 0" }} />
            <h2>Delete Account</h2>
            <form onSubmit={handleDeleteAccount}>
                <div style={{ marginBottom: 16 }}>
                    <label htmlFor="delete-password">Enter Password to Confirm</label>
                    <input
                        type="password"
						id="delete-password"
                        value={deletePassword}
                        onChange={e => setDeletePassword(e.target.value)}
                        style={{ width: 380, padding: 8, marginTop: 4 }}
                        autoComplete="current-password"
                    />
                </div>
                <button type="submit" id="delete-account-submit" disabled={deleteLoading} style={{ width: "100%", padding: 12, background: "#b71c1c", color: "#fff", border: "none", fontWeight: "bold" }}>
                    {deleteLoading ? "Deleting..." : "Delete My Account"}
                </button>
            </form>
            {deleteMsg && <div style={{ color: "green", marginTop: 12 }}>{deleteMsg}</div>}
            {deleteError && <div style={{ color: "red", marginTop: 12 }}>{deleteError}</div>}
		</div>
	);
}
