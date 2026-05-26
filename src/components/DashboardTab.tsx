import { useEffect, useState } from "react";
import {
  LayoutGrid, Sparkles, FolderOpen, HardDrive,
  Zap, Hash, Timer, Calendar,
} from "lucide-react";
import { apiGet } from "../lib/api";
import { getModelCreditCost } from "../lib/pricing";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiLogEntry = {
  id: string; type: string; model: string;
  promptTokens: number; outputTokens: number; totalTokens: number;
  latencyMs: number; status: string; errorMessage: string | null; createdAt: string;
};

type UsageData = {
  user: { email: string; name: string; memberSince: string } | null;
  storyboards: number; images: number; assets: number; storageBytes: number;
  dailyImageCounts: Record<string, number>;
  apiActivity: {
    totalApiCalls: number; totalTokens: number;
    totalPromptTokens: number; totalOutputTokens: number;
    avgLatencyMs: number; logs: ApiLogEntry[];
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL_GROUPS: { key: string; label: string; color: string; match: (m: string) => boolean }[] = [
  { key: "flash",   label: "Flash",    color: "#8B5CF6", match: m => m.includes("flash") },
  { key: "pro",     label: "Pro",      color: "#3B82F6", match: m => m.includes("pro") && !m.includes("kontext") },
  { key: "flux",    label: "Flux Pro", color: "#F59E0B", match: m => m.includes("flux") || m.includes("kontext") },
  { key: "gpt",     label: "GPT",      color: "#10B981", match: m => m.includes("gpt") || m.includes("openai") },
  { key: "other",   label: "Other",    color: "#94A3B8", match: () => true },
];

function classifyModel(model: string): typeof MODEL_GROUPS[0] {
  const m = (model || "").toLowerCase();
  return MODEL_GROUPS.find(g => g.match(m)) ?? MODEL_GROUPS[MODEL_GROUPS.length - 1]!;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(b: number) {
  if (!b) return "0 B";
  const u = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return (b / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + u[i];
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
}
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}
function shortModel(m: string) {
  return m.replace(/^models\//, "").replace(/-latest$/, "").replace(/-preview$/, "");
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || target === 0) { setVal(target); return; }
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);
  return val;
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

function BarChart({ days, animate }: {
  days: { short: string; full: string; count: number }[];
  animate: boolean;
}) {
  const W = 420, H = 180, padL = 32, padR = 8, padT = 20, padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxCount = Math.max(1, ...days.map(d => d.count));
  const barW = Math.floor(chartW / days.length * 0.55);
  const gap  = chartW / days.length;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="barGradHov" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {gridLines.map(frac => {
        const y = padT + chartH * (1 - frac);
        const val = Math.round(maxCount * frac);
        return (
          <g key={frac}>
            <line x1={padL} y1={y} x2={W - padR} y2={y}
              stroke={frac === 0 ? "#CBD5E1" : "#E2E8F0"}
              strokeWidth={frac === 0 ? 1.5 : 1}
              strokeDasharray={frac === 0 ? "none" : "3 3"}
            />
            {frac > 0 && (
              <text x={padL - 5} y={y + 4} textAnchor="end"
                fontSize={9} fill="#94A3B8" fontFamily="inherit">
                {val}
              </text>
            )}
          </g>
        );
      })}

      {/* Bars */}
      {days.map((d, i) => {
        const cx    = padL + gap * i + gap / 2;
        const bx    = cx - barW / 2;
        const pct   = maxCount > 0 ? d.count / maxCount : 0;
        const bh    = animate ? Math.max(pct * chartH, d.count > 0 ? 4 : 0) : 0;
        const by    = padT + chartH - bh;
        const rFull = 5;

        return (
          <g key={i}>
            {/* Bar */}
            <rect
              x={bx} y={by} width={barW} height={bh}
              rx={bh >= rFull * 2 ? rFull : bh / 2}
              fill="url(#barGrad)"
              style={{
                transition: `y 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms, height 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`,
              }}
            >
              <title>{d.full}: {d.count} images</title>
            </rect>

            {/* Count label above bar */}
            {d.count > 0 && animate && (
              <text
                x={cx} y={by - 4}
                textAnchor="middle" fontSize={10} fontWeight={700}
                fill="#8B5CF6" fontFamily="inherit"
                style={{ transition: `opacity 0.4s ease ${i * 60 + 400}ms` }}
              >
                {d.count}
              </text>
            )}

            {/* Day label */}
            <text x={cx} y={H - 4} textAnchor="middle"
              fontSize={10} fontWeight={700} fill="#94A3B8"
              fontFamily="inherit" style={{ textTransform: "uppercase" }}>
              {d.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────

function DonutChart({ slices, animate }: {
  slices: { label: string; value: number; color: string }[];
  animate: boolean;
}) {
  const cx = 80, cy = 80, r = 58, rInner = 36;
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, color: "#94A3B8", fontSize: 12 }}>
        No model data yet
      </div>
    );
  }

  // Sort descending so largest slice starts at top-ish
  const sorted = [...slices].sort((a, b) => b.value - a.value);
  // Start from top (-90°)
  const startAngle = -90;

  function polarToXY(deg: number, radius: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(startDeg: number, endDeg: number): string {
    const s = polarToXY(startDeg, r);
    const e = polarToXY(endDeg, r);
    const si = polarToXY(startDeg, rInner);
    const ei = polarToXY(endDeg, rInner);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${s.x} ${s.y}`,
      `A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`,
      `L ${ei.x} ${ei.y}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${si.x} ${si.y}`,
      "Z",
    ].join(" ");
  }

  let angle = startAngle;
  const arcs = sorted.map(sl => {
    const sweep = (sl.value / total) * 360;
    const start = angle;
    const end   = angle + sweep;
    angle = end;
    return { ...sl, start, end, sweep };
  });

  // Center label: largest slice
  const biggest = sorted[0];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, flexShrink: 0 }}>
        {arcs.map((arc, i) => (
          <path
            key={arc.label}
            d={arcPath(arc.start, arc.end)}
            fill={arc.color}
            stroke="#fff"
            strokeWidth={2}
            style={{
              opacity: animate ? 1 : 0,
              transition: `opacity 0.5s ease ${i * 80}ms`,
            }}
          >
            <title>{arc.label}: {arc.value} ({((arc.value / total) * 100).toFixed(1)}%)</title>
          </path>
        ))}

        {/* Center text */}
        {biggest && (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight={900} fill="#1E293B" fontFamily="inherit">
              {biggest.value}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fontWeight={700} fill="#8B5CF6" fontFamily="inherit" style={{ textTransform: "uppercase" }}>
              {biggest.label}
            </text>
          </>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {arcs.map(arc => (
          <div key={arc.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: arc.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", flex: 1 }}>{arc.label}</span>
            <span style={{ fontSize: 12, color: "#64748B" }}>{arc.value}</span>
            <span style={{ fontSize: 11, color: "#94A3B8", minWidth: 36, textAlign: "right" }}>
              {((arc.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ Icon, label, value, color, active }: {
  Icon: React.ElementType; label: string; value: number | string; color: string; active: boolean;
}) {
  const isStr = typeof value === "string";
  const animated = useCountUp(isStr ? 0 : (value as number), active);
  return (
    <div className="dbStatCard" style={{ borderTopColor: color }}>
      <div className="dbStatIcon" style={{ color }}><Icon size={22} strokeWidth={1.5} /></div>
      <div className="dbStatNum">{isStr ? value : animated.toLocaleString()}</div>
      <div className="dbStatLabel">{label}</div>
    </div>
  );
}

function ApiCard({ Icon, label, value, active }: {
  Icon: React.ElementType; label: string; value: number | string; active: boolean;
}) {
  const isStr = typeof value === "string";
  const animated = useCountUp(isStr ? 0 : (value as number), active);
  const display = isStr ? value : fmtNum(animated);
  return (
    <div className="dbApiCard">
      <div className="dbApiCardIcon"><Icon size={18} strokeWidth={2} /></div>
      <div className="dbApiCardBody">
        <div className="dbApiCardNum">{display}</div>
        <div className="dbApiCardLabel">{label}</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardTab() {
  const [data, setData]       = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    apiGet<UsageData>("/api/usage")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setAnimate(true), 120);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const activity = data?.apiActivity ?? { totalApiCalls: 0, totalTokens: 0, avgLatencyMs: 0, logs: [] };

  // Last-7-days bar data
  const days: { short: string; full: string; count: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d   = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    days.push({
      short: d.toLocaleDateString("en-US", { weekday: "short" }),
      full:  d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
      count: data?.dailyImageCounts[key] ?? 0,
    });
  }
  const totalWeek = days.reduce((s, d) => s + d.count, 0);

  // Model-usage pie data — built from all API logs
  const modelCounts: Record<string, number> = {};
  for (const log of activity.logs) {
    const group = classifyModel(log.model);
    modelCounts[group.key] = (modelCounts[group.key] ?? 0) + 1;
  }
  const pieSlices = MODEL_GROUPS
    .map(g => ({ label: g.label, value: modelCounts[g.key] ?? 0, color: g.color }))
    .filter(s => s.value > 0);

  if (loading) {
    return (
      <div className="dbRoot">
        <div className="dbSkeleton">

          {/* Header */}
          <div className="dbSkHeader">
            <div className="dbSk" style={{ width: 160, height: 30 }} />
            <div className="dbSkUserRow">
              <div className="dbSk" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="dbSk" style={{ width: 130, height: 14 }} />
                <div className="dbSk" style={{ width: 200, height: 12 }} />
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="dbSkStatGrid">
            {[1,2,3,4].map(i => (
              <div key={i} className="dbSkStatCard">
                <div className="dbSk" style={{ width: 22, height: 22, borderRadius: 4 }} />
                <div className="dbSk" style={{ width: "55%", height: 26 }} />
                <div className="dbSk" style={{ width: "80%", height: 10 }} />
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="dbSkChartsRow">
            <div className="dbSkSection">
              <div className="dbSkSectionHead">
                <div className="dbSk" style={{ width: 200, height: 16 }} />
                <div className="dbSk" style={{ width: 160, height: 12 }} />
              </div>
              <div className="dbSkBarChart">
                {[45, 70, 50, 85, 60, 95, 75].map((h, i) => (
                  <div key={i} className="dbSkBar" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="dbSkSection">
              <div className="dbSkSectionHead">
                <div className="dbSk" style={{ width: 120, height: 16 }} />
                <div className="dbSk" style={{ width: 160, height: 12 }} />
              </div>
              <div className="dbSkDonutRow">
                <div className="dbSk" style={{ width: 140, height: 140, borderRadius: "50%", flexShrink: 0 }} />
                <div className="dbSkDonutLegend">
                  {[100, 80, 65].map((_, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="dbSk" style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0 }} />
                      <div className="dbSk" style={{ flex: 1, height: 13 }} />
                      <div className="dbSk" style={{ width: 24, height: 13 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="dbSkBottomRow">
            <div className="dbSkSection">
              <div className="dbSk" style={{ width: 100, height: 16, marginBottom: 16 }} />
              <div className="dbSkApiList">
                {[1,2,3].map(i => (
                  <div key={i} className="dbSkApiCard">
                    <div className="dbSk" style={{ width: 36, height: 36, borderRadius: 6, flexShrink: 0 }} />
                    <div className="dbSkApiCardTexts">
                      <div className="dbSk" style={{ height: 18, width: "45%" }} />
                      <div className="dbSk" style={{ height: 11, width: "65%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="dbSkSection">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="dbSk" style={{ width: 150, height: 16 }} />
                <div className="dbSk" style={{ width: 28, height: 22, borderRadius: 10 }} />
              </div>
              <div className="dbSkTableRows">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="dbSkTableRow">
                    <div className="dbSk" style={{ width: 56, height: 22, borderRadius: 4 }} />
                    <div className="dbSk" style={{ flex: 1, height: 14 }} />
                    <div className="dbSk" style={{ width: 58, height: 14 }} />
                    <div className="dbSk" style={{ width: 58, height: 14 }} />
                    <div className="dbSk" style={{ width: 50, height: 22, borderRadius: 4 }} />
                    <div className="dbSk" style={{ width: 84, height: 12 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="dbRoot">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="dbHeader">
        <div className="dbHeaderLeft">
          <h1 className="dbTitle">Dashboard</h1>
          {data?.user && (
            <div className="dbUserRow">
              <div className="dbAvatar">{(data.user.name || data.user.email)[0].toUpperCase()}</div>
              <div>
                <div className="dbUserName">{data.user.name || data.user.email}</div>
                <div className="dbUserMeta">
                  <Calendar size={11} strokeWidth={2} />
                  Member since {fmtDate(data.user.memberSince)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="dbStatGrid">
        <StatCard Icon={LayoutGrid} label="Mood Boards"      value={data?.storyboards ?? 0}             color="#8B5CF6" active={animate} />
        <StatCard Icon={Sparkles}   label="Generated Images" value={data?.images ?? 0}                  color="#3B82F6" active={animate} />
        <StatCard Icon={FolderOpen} label="Uploaded Assets"  value={data?.assets ?? 0}                  color="#10B981" active={animate} />
        <StatCard Icon={HardDrive}  label="Storage Used"     value={fmtBytes(data?.storageBytes ?? 0)}  color="#F59E0B" active={animate} />
      </div>

      {/* ── Charts row ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, marginBottom: 14 }}>

        {/* Bar Chart */}
        <div className="dbSection" style={{ marginBottom: 0 }}>
          <div className="dbSectionHead">
            <div>
              <div className="dbSectionTitle">Image Generation Activity</div>
              <div className="dbSectionSub">Last 7 days · {totalWeek} total images</div>
            </div>
            <div className="dbChartLegend">
              <span className="dbChartLegendDot" />
              <span className="dbChartLegendText">Images generated</span>
            </div>
          </div>
          <div style={{ height: 180, width: "100%" }}>
            <BarChart days={days} animate={animate} />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="dbSection" style={{ marginBottom: 0 }}>
          <div className="dbSectionHead">
            <div>
              <div className="dbSectionTitle">Models Used</div>
              <div className="dbSectionSub">Based on API call history</div>
            </div>
          </div>
          <DonutChart slices={pieSlices} animate={animate} />
        </div>

      </div>

      {/* ── API stats + Recent calls ─────────────────────────── */}
      <div className="dbBottom">

        <div className="dbSection dbSectionNarrow">
          <div className="dbSectionHead">
            <div className="dbSectionTitle">API Activity</div>
          </div>
          <div className="dbApiList">
            <ApiCard Icon={Zap}   label="Total API Calls"  value={activity.totalApiCalls}       active={animate} />
            <ApiCard Icon={Hash}  label="Tokens Consumed"  value={activity.totalTokens}         active={animate} />
            <ApiCard Icon={Timer} label="Avg Latency"      value={`${activity.avgLatencyMs}ms`} active={animate} />
          </div>
        </div>

        <div className="dbSection dbSectionWide">
          <div className="dbSectionHead">
            <div className="dbSectionTitle">Recent API Calls</div>
            {activity.logs.length > 0 && (
              <span className="dbBadge">{activity.logs.length}</span>
            )}
          </div>
          {activity.logs.length === 0 ? (
            <div className="dbEmpty">No API calls recorded yet.</div>
          ) : (
            <div className="dbCallsList">
              {/* Header row */}
              <div className="dbCallRow dbCallRowHeader">
                <span className="dbCallType">Type</span>
                <span className="dbCallModel">Model</span>
                <span className="dbCallToks">Credits</span>
                <span className="dbCallMs">Duration</span>
                <span className="dbCallStatus">Status</span>
                <span className="dbCallDate">Date</span>
              </div>
              {activity.logs.slice(0, 6).map((log, i) => (
                <div
                  key={log.id}
                  className={`dbCallRow${log.status === "error" ? " dbCallRowErr" : ""}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className={`dbCallType dbCallType-${log.type}`}>{log.type}</span>
                  <span className="dbCallModel">{shortModel(log.model)}</span>
                  <span className="dbCallToks">{getModelCreditCost(log.model)} cr</span>
                  <span className="dbCallMs">{log.latencyMs.toLocaleString()}ms</span>
                  <span className={`dbCallStatus dbCallStatus-${log.status}`}>{log.status}</span>
                  <span className="dbCallDate">{fmtDateTime(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
