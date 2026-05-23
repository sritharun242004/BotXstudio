import { useState, useEffect } from "react";

interface AffInfo {
  name: string;
  bonusCredits: number;
}

export default function ReferralBanner() {
  const [info, setInfo] = useState<AffInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (!code) return;

    // Persist so AuthCallbackPage can attribute after signup
    localStorage.setItem("bsx_affiliate_ref", code);

    // Fetch affiliate name + bonus credits from the tracking endpoint (fire & read)
    fetch(`/api/affiliates/r/${encodeURIComponent(code)}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { name?: string; bonusCredits?: number } | null) => {
        if (data) setInfo({ name: data.name ?? code, bonusCredits: data.bonusCredits ?? 0 });
      })
      .catch(() => setInfo({ name: code, bonusCredits: 0 }));
  }, []);

  if (!info || dismissed) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 9999,
      background: "linear-gradient(90deg,#7C3AED,#6366F1)",
      color: "#fff",
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      fontSize: 14,
      fontWeight: 600,
      fontFamily: "Plus Jakarta Sans,system-ui,sans-serif",
      boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
      flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 20 }}>🎁</span>
      <span>
        <strong>{info.name}</strong> invited you!
        {info.bonusCredits > 0
          ? <> Sign up and get <strong style={{ color: "#FDE68A" }}>₹{info.bonusCredits} free credits</strong> instantly.</>
          : " Create your free account to get started."
        }
      </span>
      <a
        href="/login"
        style={{ background: "#fff", color: "#7C3AED", padding: "5px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}
      >
        Claim Now →
      </a>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.65)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 0, flexShrink: 0 }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
