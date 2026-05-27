import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Nav } from "../lp/Nav";

export default function ReferralPage() {
  const { code } = useParams<{ code: string }>();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) { window.location.href = "/"; return; }

    localStorage.setItem("bsx_affiliate_ref", code);

    const qs = new URLSearchParams(window.location.search);
    fetch(`/api/affiliates/r/${encodeURIComponent(code)}`, {
      headers: {
        "x-utm-source": qs.get("utm_source") || "",
        "x-utm-medium": qs.get("utm_medium") || "",
      },
    }).catch(() => {});

    setDone(true);
    setTimeout(() => { window.location.href = "/login"; }, 900);
  }, [code]);

  return (
    <>
    <Nav />
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0F172A", fontFamily: "Plus Jakarta Sans, system-ui, sans-serif", color: "#fff" }}>
      <div style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(139,92,246,0.2)", border: "2px solid rgba(139,92,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 26 }}>
          ✨
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", fontFamily: "Outfit, system-ui, sans-serif" }}>Welcome!</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: 0 }}>
          {done ? "Redirecting you to sign up…" : "Setting up your referral…"}
        </p>
        <div style={{ marginTop: 28, display: "flex", gap: 6, justifyContent: "center" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#8B5CF6", animation: `refDot 1.2s ease ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes refDot{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
    </>
  );
}
