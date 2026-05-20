import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { handleCallback, completeProfile } from "../lib/auth";

const BASE = import.meta.env.BASE_URL;

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
        const msg = err.message || "Authentication failed.";
        // Google SSO: Cognito doesn't provide email — ask user to enter it
        if (msg === "NEEDS_EMAIL") {
          setNeedsEmail(true);
          return;
        }
        // If PKCE verifier is missing (stale callback URL, back-nav, etc.),
        // auto-redirect to login to start a fresh auth flow
        if (msg.includes("PKCE")) {
          window.location.href = BASE + "login";
          return;
        }
        handledRef.current = false; // Allow retry on error
        setError(msg);
      });
  }, [params]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await completeProfile(email.trim());
      window.location.href = BASE + "app";
    } catch (err: any) {
      setError(err.message || "Failed to complete registration.");
      setSubmitting(false);
    }
  }

  // Email collection form for Google SSO users
  if (needsEmail) {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <h1 className="auth-title">Almost there!</h1>
          <p className="auth-subtitle">
            Please enter your email to complete your account setup.
          </p>
          {error && <p style={{ color: "#ef4444", fontSize: "14px", marginBottom: "12px" }}>{error}</p>}
          <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "16px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              className="auth-btn"
              disabled={submitting || !email.trim()}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Setting up..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
