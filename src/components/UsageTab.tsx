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
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    return <div className="usageLoading">Loading usage data...</div>;
  }

  if (!data) {
    return <div className="usageLoading">Unable to load usage data.</div>;
  }

  const stats = [
    { label: "Mood Boards", value: data.storyboards, icon: "\uD83D\uDCCB" },
    { label: "Generated Images", value: data.images, icon: "\uD83D\uDDBC" },
    { label: "Uploaded Assets", value: data.assets, icon: "\uD83D\uDCC1" },
    { label: "Storage Used", value: formatBytes(data.storageBytes), icon: "\uD83D\uDCBE" },
  ];

  const activity = data.apiActivity ?? { totalApiCalls: 0, totalTokens: 0, avgLatencyMs: 0, logs: [] };

  const apiStats = [
    { label: "API Calls", value: activity.totalApiCalls, icon: "\u26A1" },
    { label: "Total Tokens", value: formatNumber(activity.totalTokens), icon: "\uD83D\uDD22" },
    { label: "Avg Latency", value: activity.avgLatencyMs + "ms", icon: "\u23F1" },
  ];

  // Build last 7 days chart data
  const days: { label: string; count: number }[] = [];
  const now = new Date();
  let maxCount = 1;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const count = data.dailyImageCounts[key] || 0;
    if (count > maxCount) maxCount = count;
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      count,
    });
  }

  return (
    <div className="usageContainer">
      {/* Account info */}
      {data.user && (
        <div className="usageSection">
          <h2 className="usageSectionTitle">Account</h2>
          <div className="usageAccount">
            <div className="usageAccountAvatar">
              {(data.user.name || data.user.email)[0]?.toUpperCase()}
            </div>
            <div>
              <div className="usageAccountName">{data.user.name}</div>
              <div className="usageAccountEmail">{data.user.email}</div>
              <div className="usageAccountMeta">Member since {formatDate(data.user.memberSince)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="usageSection">
        <h2 className="usageSectionTitle">Usage Overview</h2>
        <div className="usageStatsGrid">
          {stats.map((s) => (
            <div key={s.label} className="usageStatCard">
              <div className="usageStatIcon">{s.icon}</div>
              <div className="usageStatValue">{s.value}</div>
              <div className="usageStatLabel">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity chart */}
      <div className="usageSection">
        <h2 className="usageSectionTitle">Last 7 Days Activity</h2>
        <div className="usageChart">
          {days.map((d, i) => (
            <div key={i} className="usageChartBar">
              <div className="usageChartBarTrack">
                <div
                  className="usageChartBarFill"
                  style={{ height: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <div className="usageChartCount">{d.count}</div>
              <div className="usageChartLabel">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API Activity */}
      <div className="usageSection">
        <h2 className="usageSectionTitle">API Activity</h2>
        <div className="usageStatsGrid">
          {apiStats.map((s) => (
            <div key={s.label} className="usageStatCard">
              <div className="usageStatIcon">{s.icon}</div>
              <div className="usageStatValue">{s.value}</div>
              <div className="usageStatLabel">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API Logs Table */}
      <div className="usageSection">
        <h2 className="usageSectionTitle">Recent API Calls</h2>
        {activity.logs.length > 0 ? (
          <div className="apiLogTableWrap">
            <table className="apiLogTable">
              <thead>
                <tr>
                  <th>Date</th>
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
                  <tr key={log.id} className={log.status === "error" ? "apiLogRowError" : ""}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>
                      <span className={`apiLogTypeBadge apiLogType-${log.type}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="apiLogModel">{shortenModel(log.model)}</td>
                    <td className="apiLogTokens">{formatNumber(log.promptTokens)}</td>
                    <td className="apiLogTokens">{formatNumber(log.outputTokens)}</td>
                    <td className="apiLogTokens">{formatNumber(log.totalTokens)}</td>
                    <td className="apiLogLatency">{log.latencyMs.toLocaleString()}ms</td>
                    <td>
                      <span className={`apiLogStatusBadge apiLogStatus-${log.status}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="apiLogEmpty">
            No API calls recorded yet. Generate an image to see activity here.
          </div>
        )}
      </div>
    </div>
  );
}
