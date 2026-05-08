import { useState } from "react";
import {
  CognitoUser,
  CognitoUserPool,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";
import { setAccessToken } from "../lib/api";
import { apiPost } from "../lib/api";
import type { Session } from "../lib/auth";

const TOKENS_KEY = "bsx_cognito_tokens";
const SESSION_KEY = "bsx_session_v1";

function getPool() {
  const UserPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string;
  const ClientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string;
  return new CognitoUserPool({ UserPoolId, ClientId });
}

type Props = { onSuccess: (session: Session) => void };

export default function AdminLogin({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError("");

    const authDetails = new AuthenticationDetails({
      Username: email.trim().toLowerCase(),
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email.trim().toLowerCase(),
      Pool: getPool(),
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: async (result) => {
        try {
          const accessToken = result.getAccessToken().getJwtToken();
          const idToken = result.getIdToken().getJwtToken();
          const refreshToken = result.getRefreshToken().getToken();
          const expiresIn = result.getAccessToken().getExpiration() * 1000;

          // Store tokens in the same format as the PKCE auth flow
          setAccessToken(accessToken);
          localStorage.setItem(
            TOKENS_KEY,
            JSON.stringify({ accessToken, idToken, refreshToken, expiresAt: expiresIn }),
          );

          // Sync user with backend and get role
          const idPayload = JSON.parse(atob(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
          const name = idPayload.name || email.split("@")[0];

          const data = await apiPost<{ user: Session }>("/api/auth/me", {
            email: email.trim().toLowerCase(),
            name,
          });

          const session = data.user;
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));

          const role = (session as any).role;
          if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
            setError("Access denied. Your account does not have admin privileges.");
            localStorage.removeItem(TOKENS_KEY);
            localStorage.removeItem(SESSION_KEY);
            setAccessToken(null);
            setLoading(false);
            return;
          }

          onSuccess(session);
        } catch (err: any) {
          setError(err.message || "Authentication failed. Please try again.");
          setLoading(false);
        }
      },
      onFailure: (err) => {
        const msg =
          err.code === "NotAuthorizedException"
            ? "Incorrect email or password."
            : err.code === "UserNotFoundException"
            ? "No account found with that email."
            : err.code === "UserNotConfirmedException"
            ? "Account not verified. Please check your email."
            : err.message || "Sign-in failed. Please try again.";
        setError(msg);
        setLoading(false);
      },
      newPasswordRequired: () => {
        setError("A new password is required. Please use the main login page to set one.");
        setLoading(false);
      },
    });
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--adm-bg)",
      padding: "24px 16px",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "var(--adm-surface)",
        border: "1px solid var(--adm-border)",
        borderRadius: "var(--adm-radius)",
        padding: "40px 36px 36px",
      }}>
        {/* Brand */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "var(--adm-accent-glow)",
            border: "1px solid var(--adm-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            fontSize: 22,
          }}>
            🛡️
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--adm-text)", lineHeight: 1.2 }}>
            Botzudio Admin
          </div>
          <div style={{ fontSize: 13, color: "var(--adm-text-muted)", marginTop: 4 }}>
            Sign in to access the admin panel
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="adm-alert adm-alert-error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="adm-form-group" style={{ marginBottom: 0 }}>
            <label className="adm-label">Email</label>
            <input
              className="adm-input"
              type="email"
              placeholder="admin@thebotcompany.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div className="adm-form-group" style={{ marginBottom: 0 }}>
            <label className="adm-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="adm-input"
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
                style={{ width: "100%", boxSizing: "border-box", paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  color: "var(--adm-text-muted)", cursor: "pointer",
                  fontSize: 16, padding: 2, lineHeight: 1,
                }}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="adm-btn adm-btn-primary"
            disabled={loading || !email.trim() || !password}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "11px 20px",
              fontSize: 14,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  animation: "adm-spin 0.7s linear infinite",
                  display: "inline-block",
                }} />
                Signing in…
              </span>
            ) : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: "1px solid var(--adm-border)",
          textAlign: "center",
          fontSize: 12,
          color: "var(--adm-text-muted)",
        }}>
          Not an admin?{" "}
          <a href="/app" style={{ color: "var(--adm-accent)", textDecoration: "none", fontWeight: 500 }}>
            Go to App →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes adm-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
