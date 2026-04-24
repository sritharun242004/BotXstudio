import { redirectToLogin } from "../lib/auth";

const BASE = import.meta.env.BASE_URL;

export default function LoginPage() {
  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-logo"><img src={`${BASE}logo.png`} alt="BotStudioX" /></div>
          <div>
            <div className="auth-brand-name">BotStudioX</div>
            <div className="auth-brand-sub">by The Bot Company</div>
          </div>
        </div>

        <h1 className="auth-title">Welcome</h1>
        <p className="auth-subtitle">Sign in to continue to BotStudioX.</p>

        <div className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            type="button"
            className="auth-btn"
            onClick={() => redirectToLogin("Google")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <button
            type="button"
            className="auth-btn"
            onClick={() => redirectToLogin("Apple")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              background: "#000", color: "#fff",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 22" fill="currentColor">
              <path d="M17.05 18.68c-.93 2.07-1.38 2.99-2.58 4.82-1.67 2.55-4.03 5.73-6.95 5.76-2.6.02-3.27-1.69-6.8-1.66-3.53.02-4.27 1.7-6.87 1.67-2.92-.03-5.16-2.92-6.84-5.47C-16.48 18.78-18.36 10.87-15.02 5.6c2.36-3.72 6.1-5.9 9.54-5.9 3.24 0 5.28 1.72 7.96 1.72 2.6 0 4.18-1.73 7.93-1.73 3.06 0 6.38 1.66 8.74 4.54-7.68 4.21-6.43 15.18 1.9 18.45zM12.66-3.27C14.07-4.93 15.1-7.28 14.76-9.68c-2.14.15-4.64 1.51-6.1 3.28-1.32 1.6-2.41 3.97-1.99 6.27 2.34.07 4.76-1.33 5.99-3.14z" transform="translate(3 9) scale(0.5)"/>
            </svg>
            Sign in with Apple
          </button>

          <div style={{ textAlign: "center", color: "#888", fontSize: "13px", margin: "4px 0" }}>or</div>

          <button
            type="button"
            className="auth-btn"
            onClick={() => redirectToLogin()}
            style={{ background: "transparent", color: "#aaa", border: "1px solid #444" }}
          >
            Sign in with Email
          </button>
        </div>
      </div>
    </div>
  );
}
