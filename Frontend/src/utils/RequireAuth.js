import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authRequest } from "./AuthRequest";

function RequireAuth({ children, onAuthChange }) {
  const [valid, setValid] = useState(null);
  const location = useLocation(); 

  useEffect(() => {
    let cancelled = false;

    async function validate() {
      try {
        const res = await authRequest(`/api/auth/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!cancelled) {
          setValid(res.ok);
          onAuthChange?.(res.ok);
        }
      } catch {
        if (!cancelled) {
          setValid(false);
          onAuthChange?.(false);
        }
      }
    }

    validate();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, onAuthChange]);

  if (valid === null) return <div>Checking authentication...</div>;
  if (!valid) return <Navigate to="/login" replace />;
  return children;
}


export default RequireAuth;
