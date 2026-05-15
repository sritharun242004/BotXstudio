import { useState } from "react";
import {
  type GenerationTierId,
  type TierBadge,
  GENERATION_TIERS,
  TIER_ORDER,
} from "../lib/generationTiers";

// ── Badge colours ─────────────────────────────────────────────────────────────

const BADGE_STYLE: Record<TierBadge["variant"], { bg: string; text: string; border: string }> = {
  blue:   { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa", border: "rgba(59,130,246,0.25)"  },
  green:  { bg: "rgba(34,197,94,0.12)",   text: "#4ade80", border: "rgba(34,197,94,0.25)"   },
  purple: { bg: "rgba(168,85,247,0.14)",  text: "#c084fc", border: "rgba(168,85,247,0.3)"   },
  amber:  { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24", border: "rgba(245,158,11,0.25)"  },
  indigo: { bg: "rgba(99,102,241,0.12)",  text: "#818cf8", border: "rgba(99,102,241,0.25)"  },
  rose:   { bg: "rgba(244,63,94,0.12)",   text: "#fb7185", border: "rgba(244,63,94,0.25)"   },
};

// ── Tier accent colours ───────────────────────────────────────────────────────

const TIER_ACCENT: Record<GenerationTierId, { active: string; glow: string; cost: string }> = {
  fast_draft:         { active: "rgba(59,130,246,0.18)",  glow: "rgba(59,130,246,0.08)",  cost: "#60a5fa" },
  standard_studio:    { active: "rgba(168,85,247,0.16)",  glow: "rgba(168,85,247,0.07)",  cost: "#c084fc" },
  premium_editorial:  { active: "rgba(245,158,11,0.16)",  glow: "rgba(245,158,11,0.07)",  cost: "#fbbf24" },
};

// ── Speed icon ────────────────────────────────────────────────────────────────

function SpeedIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function CoinIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2m0 8v2m-4-6h8" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  value: GenerationTierId;
  onChange: (tier: GenerationTierId) => void;
};

export default function GenerationQualityCard({ value, onChange }: Props) {
  const [hovered, setHovered] = useState<GenerationTierId | null>(null);
  const activeTier = GENERATION_TIERS[value];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Tier selector grid ─────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
      }}>
        {TIER_ORDER.map((tierId) => {
          const tier    = GENERATION_TIERS[tierId];
          const accent  = TIER_ACCENT[tierId];
          const selected = value === tierId;
          const isHover  = hovered === tierId;

          return (
            <button
              key={tierId}
              type="button"
              onClick={() => onChange(tierId)}
              onMouseEnter={() => setHovered(tierId)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "flex-start",
                gap:            8,
                padding:        "13px 13px 12px",
                borderRadius:   10,
                border:         selected
                  ? `1.5px solid ${accent.active}`
                  : isHover
                    ? "1.5px solid rgba(255,255,255,0.1)"
                    : "1.5px solid rgba(255,255,255,0.06)",
                background:     selected
                  ? accent.glow
                  : isHover
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(255,255,255,0.02)",
                cursor:         "pointer",
                textAlign:      "left",
                transition:     "all 0.15s ease",
                position:       "relative",
                overflow:       "hidden",
                boxSizing:      "border-box",
                width:          "100%",
              }}
            >
              {/* Selected ring glow */}
              {selected && (
                <div style={{
                  position:  "absolute",
                  inset:     0,
                  background: `radial-gradient(ellipse at 50% 0%, ${accent.active} 0%, transparent 70%)`,
                  opacity:   0.5,
                  pointerEvents: "none",
                }} />
              )}

              {/* Tier name */}
              <div style={{
                fontSize:   12,
                fontWeight: 700,
                color:      selected ? "#e2d9f3" : "#9ca3af",
                lineHeight: 1.2,
                letterSpacing: "0.01em",
              }}>
                {tier.name}
              </div>

              {/* Cost */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <CoinIcon size={11} />
                <span style={{
                  fontSize:   11,
                  fontWeight: 700,
                  color:      selected ? accent.cost : "#6b7280",
                  lineHeight: 1,
                }}>
                  {tier.costLabel}
                </span>
                <span style={{ fontSize: 10, color: "#4b5563" }}>/img</span>
              </div>

              {/* Speed */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <SpeedIcon size={11} />
                <span style={{ fontSize: 10, color: selected ? "#9ca3af" : "#4b5563" }}>
                  {tier.speedLabel}
                </span>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                {tier.badges.map((badge) => {
                  const bs = BADGE_STYLE[badge.variant];
                  return (
                    <span
                      key={badge.label}
                      style={{
                        display:       "inline-block",
                        fontSize:      9,
                        fontWeight:    700,
                        padding:       "2px 7px",
                        borderRadius:  999,
                        background:    bs.bg,
                        color:         bs.text,
                        border:        `1px solid ${bs.border}`,
                        letterSpacing: "0.03em",
                        textTransform: "uppercase" as const,
                        lineHeight:    1.4,
                        alignSelf:     "flex-start",
                      }}
                    >
                      {badge.label}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Live details strip ─────────────────────────────────────── */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "10px 14px",
        borderRadius:   8,
        background:     "rgba(255,255,255,0.03)",
        border:         "1px solid rgba(255,255,255,0.06)",
        gap:            8,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#d1d5db" }}>
            {activeTier.name}
          </span>
          <span style={{ fontSize: 11, color: "#6b7280" }}>
            {activeTier.tagline}
          </span>
        </div>
        <div style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "flex-end",
          gap:            3,
          flexShrink:     0,
        }}>
          <span style={{
            fontSize:   13,
            fontWeight: 800,
            color:      TIER_ACCENT[value].cost,
            lineHeight: 1,
          }}>
            {activeTier.costLabel}
          </span>
          <span style={{ fontSize: 10, color: "#4b5563" }}>per image</span>
        </div>
      </div>
    </div>
  );
}
