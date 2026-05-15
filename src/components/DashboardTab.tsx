import { useEffect, useState } from "react";
import {
  LayoutGrid, Sparkles, FolderOpen, HardDrive,
  Zap, Hash, Timer, Calendar,
} from "lucide-react";
import { apiGet } from "../lib/api";

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
function shortModel(m: string) { return m.replace(/^models\//, "").replace(/-latest$/, "").replace(/-preview$/, ""); }

// ─── Animated counter hook ────────────────────────────────────────────────────

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
  const [data, setData] = useState<UsageData | null>(null);
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

  // Build last-7-days chart data
  const days: { short: string; full: string; count: number }[] = [];
  let maxCount = 1;
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const count = data?.dailyImageCounts[key] ?? 0;
    if (count > maxCount) maxCount = count;
    days.push({
      short: d.toLocaleDateString("en-US", { weekday: "short" }),
      full:  d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
      count,
    });
  }

  const totalWeek = days.reduce((s, d) => s + d.count, 0);

  if (loading) {
    return (
      <div className="dbRoot">
        <div className="dbSkeleton">
          <div className="dbSkeletonTitle" />
          <div className="dbSkeletonGrid">
            {[1,2,3,4].map(i => <div key={i} className="dbSkeletonCard" />)}
          </div>
          <div className="dbSkeletonChart" />
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

      {/* ── Activity chart ──────────────────────────────────── */}
      <div className="dbSection">
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

        <div className="dbChart">
          {days.map((d, i) => {
            const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
            const fillH = animate ? `${Math.max(pct, d.count > 0 ? 6 : 0)}%` : "0%";
            return (
              <div key={i} className="dbBarWrap" title={`${d.full}: ${d.count} images`}>
                <div className="dbBarCount" style={{ opacity: d.count > 0 ? 1 : 0 }}>
                  {d.count}
                </div>
                <div className="dbBarTrack">
                  <div
                    className="dbBarFill"
                    style={{
                      height: fillH,
                      transitionDelay: `${i * 65}ms`,
                    }}
                  />
                </div>
                <div className="dbBarDay">{d.short}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── API stats + Recent calls ─────────────────────────── */}
      <div className="dbBottom">

        {/* API Activity */}
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

        {/* Recent API Calls */}
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
              {activity.logs.slice(0, 6).map((log, i) => (
                <div
                  key={log.id}
                  className={`dbCallRow${log.status === "error" ? " dbCallRowErr" : ""}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className={`dbCallType dbCallType-${log.type}`}>{log.type}</span>
                  <span className="dbCallModel">{shortModel(log.model)}</span>
                  <span className="dbCallToks">{fmtNum(log.totalTokens)} tok</span>
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
