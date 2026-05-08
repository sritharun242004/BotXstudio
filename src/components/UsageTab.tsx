import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

type ApiLogEntry = {
  id: string;
  type: string;
  model: string;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

type UsageData = {
  user: { email: string; name: string; memberSince: string } | null;
  storyboards: number;
  images: number;
  assets: number;
  storageBytes: number;
  dailyImageCounts: Record<string, number>;
  apiActivity: {
    totalApiCalls: number;
    totalTokens: number;
    totalPromptTokens: number;
    totalOutputTokens: number;
    avgLatencyMs: number;
    logs: ApiLogEntry[];
  };
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function shortenModel(model: string): string {
  return model.replace(/^models\//, "").replace(/-preview$/, "");
}

export default function UsageTab() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<UsageData>("/api/usage")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="usagePage">
        <div className="usageLoadingState">
          <div className="usageLoadingSpinner" />
          <span>Loading your usage data…</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="usagePage">
        <div className="usageLoadingState">Unable to load usage data. Please try again.</div>
      </div>
    );
  }

  const activity = data.apiActivity ?? { totalApiCalls: 0, totalTokens: 0, totalPromptTokens: 0, totalOutputTokens: 0, avgLatencyMs: 0, logs: [] };

  // Last 7 days chart
  const days: { label: string; date: string; count: number }[] = [];
  const now = new Date();
  let maxCount = 1;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const count = data.dailyImageCounts[key] || 0;
    if (count > maxCount) maxCount = count;
    days.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), date: key, count });
  }

  const totalWeekImages = days.reduce((s, d) => s + d.count, 0);
  const initials = (data.user?.name || data.user?.email || "?")[0]?.toUpperCase() ?? "?";

  return (
    <div className="usagePage">
      {/* Hero header */}
      <div className="usageHero">
        <div className="usageHeroLeft">
          <div className="usageAvatar">{initials}</div>
          <div>
            <div className="usageHeroName">{data.user?.name || "User"}</div>
            <div className="usageHeroEmail">{data.user?.email}</div>
            <div className="usageHeroBadge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Active subscriber · Member since {data.user ? formatDate(data.user.memberSince) : "—"}
            </div>
          </div>
        </div>
        <div className="usageHeroRight">
          <div className="usageHeroPlanTag">BotStudioX Pro</div>
        </div>
      </div>

      {/* Overview stat cards */}
      <div className="usageStatRow">
        <div className="usageStatCard usageStatCard--purple">
          <div className="usageStatCardIcon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </div>
          <div className="usageStatCardValue">{data.storyboards}</div>
          <div className="usageStatCardLabel">Mood Boards</div>
          <div className="usageStatCardSub">Total created</div>
        </div>
        <div className="usageStatCard usageStatCard--pink">
          <div className="usageStatCardIcon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div className="usageStatCardValue">{data.images}</div>
          <div className="usageStatCardLabel">Generated Images</div>
          <div className="usageStatCardSub">AI-generated outputs</div>
        </div>
        <div className="usageStatCard usageStatCard--yellow">
          <div className="usageStatCardIcon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div className="usageStatCardValue">{data.assets}</div>
          <div className="usageStatCardLabel">Uploaded Assets</div>
          <div className="usageStatCardSub">Garments, models & poses</div>
        </div>
        <div className="usageStatCard usageStatCard--green">
          <div className="usageStatCardIcon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div className="usageStatCardValue">{formatBytes(data.storageBytes)}</div>
          <div className="usageStatCardLabel">Storage Used</div>
          <div className="usageStatCardSub">Images & assets</div>
        </div>
      </div>

      <div className="usageTwoCol">
        {/* Weekly activity chart */}
        <div className="usageCard">
          <div className="usageCardHeader">
            <div>
              <div className="usageCardTitle">Weekly Activity</div>
              <div className="usageCardSub">Images generated in the last 7 days</div>
            </div>
            <div className="usageWeekTotal">
              <span className="usageWeekTotalNum">{totalWeekImages}</span>
              <span className="usageWeekTotalLabel">this week</span>
            </div>
          </div>
          <div className="usageBarChart">
            {days.map((d, i) => (
              <div key={i} className="usageBarCol">
                <div className="usageBarCount">{d.count > 0 ? d.count : ""}</div>
                <div className="usageBarTrack">
                  <div
                    className="usageBarFill"
                    style={{ height: maxCount > 0 ? `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 6 : 0)}%` : "0%" }}
                  />
                </div>
                <div className="usageBarLabel">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* API summary */}
        <div className="usageCard">
          <div className="usageCardHeader">
            <div>
              <div className="usageCardTitle">API Consumption</div>
              <div className="usageCardSub">All-time usage across your account</div>
            </div>
          </div>
          <div className="usageApiSummaryGrid">
            <div className="usageApiSummaryItem">
              <div className="usageApiSummaryVal">{formatNumber(activity.totalApiCalls)}</div>
              <div className="usageApiSummaryLabel">Total API Calls</div>
            </div>
            <div className="usageApiSummaryItem">
              <div className="usageApiSummaryVal">{formatNumber(activity.totalTokens)}</div>
              <div className="usageApiSummaryLabel">Total Tokens</div>
            </div>
            <div className="usageApiSummaryItem">
              <div className="usageApiSummaryVal">{formatNumber(activity.totalPromptTokens)}</div>
              <div className="usageApiSummaryLabel">Prompt Tokens</div>
            </div>
            <div className="usageApiSummaryItem">
              <div className="usageApiSummaryVal">{formatNumber(activity.totalOutputTokens)}</div>
              <div className="usageApiSummaryLabel">Output Tokens</div>
            </div>
            <div className="usageApiSummaryItem usageApiSummaryItem--wide">
              <div className="usageApiSummaryVal">{Math.round(activity.avgLatencyMs).toLocaleString()}ms</div>
              <div className="usageApiSummaryLabel">Avg. Generation Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent API Calls */}
      <div className="usageCard">
        <div className="usageCardHeader">
          <div>
            <div className="usageCardTitle">Recent API Calls</div>
            <div className="usageCardSub">Your latest image generation requests</div>
          </div>
          {activity.logs.length > 0 && (
            <div className="usageLogCount">{activity.logs.length} entries</div>
          )}
        </div>
        {activity.logs.length > 0 ? (
          <div className="usageTableWrap">
            <table className="usageTable">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Model</th>
                  <th>Prompt</th>
                  <th>Output</th>
                  <th>Total</th>
                  <th>Latency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activity.logs.map((log) => (
                  <tr key={log.id} className={log.status === "error" ? "usageTableRowError" : ""}>
                    <td className="usageTableDate">{formatDateTime(log.createdAt)}</td>
                    <td>
                      <span className={`usageTypeBadge usageTypeBadge--${log.type}`}>{log.type.toUpperCase()}</span>
                    </td>
                    <td className="usageTableModel">{shortenModel(log.model)}</td>
                    <td className="usageTableNum">{formatNumber(log.promptTokens)}</td>
                    <td className="usageTableNum">{formatNumber(log.outputTokens)}</td>
                    <td className="usageTableNum usageTableNum--bold">{formatNumber(log.totalTokens)}</td>
                    <td className="usageTableLatency">{log.latencyMs.toLocaleString()}ms</td>
                    <td>
                      <span className={`usageStatusBadge usageStatusBadge--${log.status}`}>
                        {log.status === "success" ? "✓" : "✗"} {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="usageEmptyLogs">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>No API calls recorded yet.</div>
            <div className="usageEmptyLogsSub">Generate an image to start tracking activity.</div>
          </div>
        )}
      </div>
    </div>
  );
}
