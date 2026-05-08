import { useEffect, useState } from "react";
import LogoLoader from "../../components/LogoLoader";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { adminApi } from "../api";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b"];

export default function Costs() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getCosts()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="adm-loading"><LogoLoader size={80} color="var(--adm-text)" label="Loading cost data…" /></div>;
  if (!data) return <div className="adm-empty">Failed to load cost data.</div>;

  return (
    <div className="adm-page">
      <div className="adm-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="adm-card adm-card-danger">
          <div className="adm-card-title">Total Cost (All Time)</div>
          <div className="adm-card-value">${data.totalCost}</div>
          <div className="adm-card-sub">USD estimate</div>
        </div>
        {data.byModel.map((m: any) => (
          <div key={m.model} className="adm-card adm-card-accent">
            <div className="adm-card-title">{m.model} Cost</div>
            <div className="adm-card-value">${m.cost}</div>
          </div>
        ))}
      </div>

      <div className="adm-chart-row">
        <div className="adm-chart-card">
          <h3>Daily Cost (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.dailyData}>
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v: any) => [`$${v}`, "Cost"]}
                contentStyle={{ background: "#0f1420", border: "1px solid #1e2740", borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="adm-chart-card">
          <h3>Cost by Model</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.byModel} dataKey="cost" nameKey="model" cx="50%" cy="50%" outerRadius={80}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.byModel.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [`$${v}`, "Cost"]}
                contentStyle={{ background: "#0f1420", border: "1px solid #1e2740", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="adm-table-wrap">
        <div className="adm-table-header"><h3>Top Users by Cost</h3></div>
        <table className="adm-table">
          <thead>
            <tr><th>#</th><th>User</th><th>Estimated Cost (USD)</th></tr>
          </thead>
          <tbody>
            {data.topUsers.map((u: any, i: number) => (
              <tr key={u.userId}>
                <td>{i + 1}</td>
                <td><strong>{u.email}</strong></td>
                <td>${u.cost}</td>
              </tr>
            ))}
            {data.topUsers.length === 0 && (
              <tr><td colSpan={3}><div className="adm-empty">No cost data yet</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
