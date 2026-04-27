import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

type UsageData = {
  user: { email: string; name: string; memberSince: string } | null;
  storyboards: number;
  images: number;
  assets: number;
  storageBytes: number;
  dailyImageCounts: Record<string, number>;
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
    { label: "Mood Boards", value: data.storyboards, icon: "📋" },
    { label: "Generated Images", value: data.images, icon: "🖼" },
    { label: "Uploaded Assets", value: data.assets, icon: "📁" },
    { label: "Storage Used", value: formatBytes(data.storageBytes), icon: "💾" },
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
    </div>
  );
}
