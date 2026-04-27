import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { handleCallback } from "../lib/auth";

const BASE = import.meta.env.BASE_URL;

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const handledRef = useRef(false);

  useEffect(() => {
    // Prevent StrictMode double-invocation from consuming the PKCE verifier twice
    if (handledRef.current) return;
    handledRef.current = true;

    const errorParam = params.get("error");
    const errorDesc = params.get("error_description");
    if (errorParam) {
      setError(`${errorParam}: ${errorDesc || "Unknown error from auth provider."}`);
      return;
    }

    const code = params.get("code");
    if (!code) {
      setError("Missing authorization code.");
      return;
    }

    handleCallback(code)
      .then(() => {
        window.location.href = BASE + "app";
      })
      .catch((err) => {
        handledRef.current = false; // Allow retry on error
        setError(err.message || "Authentication failed.");
      });
  }, [params]);

  if (error) {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <h1 className="auth-title">Authentication Error</h1>
          <p className="auth-subtitle">{error}</p>
          <a href={BASE + "login"} className="auth-btn" style={{ display: "block", textAlign: "center", marginTop: "16px", textDecoration: "none" }}>
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h1 className="auth-title">Signing you in...</h1>
        <p className="auth-subtitle">Please wait while we complete authentication.</p>
      </div>
    </div>
  );
}
