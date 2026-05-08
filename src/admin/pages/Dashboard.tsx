import { useEffect, useState } from "react";
import LogoLoader from "../../components/LogoLoader";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { adminApi } from "../api";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="adm-loading"><LogoLoader size={80} color="var(--adm-text)" label="Loading dashboard…" /></div>;
  if (!data) return <div className="adm-empty">Failed to load dashboard data.</div>;

  const { stats, modelUsage, dailyCalls } = data;

  return (
    <div className="adm-page">
      <div className="adm-stats-grid">
        <div className="adm-card adm-card-accent">
          <div className="adm-card-title">Total Users</div>
          <div className="adm-card-value">{stats.totalUsers.toLocaleString()}</div>
          <div className="adm-card-sub">{stats.activeUsers} active (30d)</div>
        </div>
        <div className="adm-card adm-card-success">
          <div className="adm-card-title">Images Generated</div>
          <div className="adm-card-value">{stats.totalImages.toLocaleString()}</div>
        </div>
        <div className="adm-card adm-card-warning">
          <div className="adm-card-title">API Calls Today</div>
          <div className="adm-card-value">{stats.apiCallsToday.toLocaleString()}</div>
          <div className="adm-card-sub">{stats.tokensToday.total.toLocaleString()} tokens</div>
        </div>
        <div className="adm-card adm-card-danger">
          <div className="adm-card-title">Est. Total Cost</div>
          <div className="adm-card-value">${stats.estimatedCostUsd}</div>
          <div className="adm-card-sub">All time</div>
        </div>
      </div>

      <div className="adm-chart-row">
        <div className="adm-chart-card">
          <h3>API Calls (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={[...dailyCalls].reverse()}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0f1420", border: "1px solid #1e2740", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area type="monotone" dataKey="calls" stroke="#6366f1" fill="url(#grad1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="adm-chart-card">
          <h3>Model Usage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={modelUsage}
                dataKey="calls"
                nameKey="model"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }: any) =>
                  `${name?.includes("flash") ? "Flash" : "Pro"} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {modelUsage.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any, n: any) => [v, n?.includes("flash") ? "Flash" : "Pro"]}
                contentStyle={{ background: "#0f1420", border: "1px solid #1e2740", borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="adm-chart-card">
        <h3>Tokens Used (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={[...dailyCalls].reverse()}>
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#0f1420", border: "1px solid #1e2740", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="tokens" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
