import { redirectToLogin } from "../lib/auth";

const BASE = import.meta.env.BASE_URL;

export default function LoginPage() {
  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-logo"><img src={`${BASE}logo.png`} alt="Botzudio" /></div>
          <div>
            <div className="auth-brand-name">Botzudio</div>
            <div className="auth-brand-sub">by The Bot Company</div>
          </div>
        </div>

        <h1 className="auth-title" style={{ fontFamily: "var(--font-heading)", fontSize: "4.5rem", letterSpacing: "-0.05em", lineHeight: 1, color: "#000000", marginBottom: "16px" }}>
          Access
        </h1>
        <p className="auth-subtitle" style={{ fontFamily: "var(--font-body)", fontSize: "1.125rem", color: "#525252", borderLeft: "2px solid #000000", paddingLeft: "16px", marginBottom: "40px" }}>
          Sign in to continue to Botzudio.<br/>
          <em>Authorized personnel only.</em>
        </p>

        <div className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <button
            type="button"
            className="auth-btn"
            onClick={() => redirectToLogin("Google")}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#000000";
              e.currentTarget.style.color = "#FFFFFF";
              const paths = e.currentTarget.querySelectorAll("path");
              paths.forEach(p => p.setAttribute("fill", "#FFFFFF"));
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#FFFFFF";
              e.currentTarget.style.color = "#000000";
              const paths = e.currentTarget.querySelectorAll("path");
              paths[0].setAttribute("fill", "#4285F4");
              paths[1].setAttribute("fill", "#34A853");
              paths[2].setAttribute("fill", "#FBBC05");
              paths[3].setAttribute("fill", "#EA4335");
            }}
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
              background: "#FFFFFF", color: "#000000",
              border: "2px solid #000000", borderRadius: 0,
              padding: "16px", fontFamily: "var(--font-mono)", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "none"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
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
            onClick={() => redirectToLogin()}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#000000";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#FFFFFF";
              e.currentTarget.style.color = "#000000";
            }}
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
              background: "#FFFFFF", color: "#000000",
              border: "2px solid #000000", borderRadius: 0,
              padding: "16px", fontFamily: "var(--font-mono)", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "none"
            }}
          >
            Sign in with Email
          </button>
        </div>

        {/* Admin access */}
        <div style={{
          marginTop: 48,
          paddingTop: 32,
          borderTop: "4px solid #000000",
          textAlign: "center",
        }}>
          <button
            type="button"
            onClick={() => window.location.href = "/admin"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              borderRadius: 0,
              color: "#000000",
              fontSize: "0.85rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              padding: "8px 0",
              cursor: "pointer",
              transition: "none",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              textDecoration: "underline",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#000000";
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.textDecoration = "none";
              e.currentTarget.style.padding = "8px 16px";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#000000";
              e.currentTarget.style.textDecoration = "underline";
              e.currentTarget.style.padding = "8px 0";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
              <rect x="3" y="11" width="18" height="11"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Admin Access
          </button>
        </div>
      </div>
    </div>
  );
}
