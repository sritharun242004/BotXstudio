import { useState, useEffect, Component } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./admin.css";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import ApiUsage from "./pages/ApiUsage";
import Costs from "./pages/Costs";
import ApiKey from "./pages/ApiKey";
import Templates from "./pages/Templates";
import ImageControl from "./pages/ImageControl";
import Moderation from "./pages/Moderation";
import SystemLogs from "./pages/SystemLogs";
import Settings from "./pages/Settings";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div style={{
          minHeight: "100vh", background: "#080b12", color: "#f87171",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", padding: 24, gap: 12, fontFamily: "monospace",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>Admin Panel Error</div>
          <div style={{ fontSize: 13, maxWidth: 600, textAlign: "center" }}>
            {(error as Error).message}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 8, padding: "8px 20px", background: "#6366f1",
              color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type Page =
  | "dashboard" | "users" | "api-usage" | "costs"
  | "api-key" | "templates" | "image-control"
  | "moderation" | "system-logs" | "settings";

const NAV: { key: Page; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "users", label: "Users", icon: "👥" },
  { key: "api-usage", label: "API Usage", icon: "📈" },
  { key: "costs", label: "Billing / Costs", icon: "💰" },
  { key: "image-control", label: "Image Generation", icon: "🎨" },
  { key: "templates", label: "Templates", icon: "🗂️" },
  { key: "api-key", label: "API Key", icon: "🔑" },
  { key: "moderation", label: "Moderation", icon: "🛡️" },
  { key: "system-logs", label: "System Logs", icon: "📜" },
  { key: "settings", label: "Settings", icon: "⚙️" },
];

const PAGE_TITLES: Record<Page, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "Platform overview and key metrics" },
  users: { title: "Users", sub: "Manage user accounts and admin roles" },
  "api-usage": { title: "API Usage", sub: "All API calls and token consumption" },
  costs: { title: "Billing & Costs", sub: "Cost breakdown by model and user" },
  "api-key": { title: "API Key", sub: "Manage the Gemini API key" },
  templates: { title: "Templates", sub: "Manage model, pose, and background templates" },
  "image-control": { title: "Image Generation", sub: "Control models, features, and limits" },
  moderation: { title: "Moderation", sub: "Review and remove generated images" },
  "system-logs": { title: "System Logs", sub: "API errors and admin audit trail" },
  settings: { title: "Settings", sub: "App limits, rate limits, and feature flags" },
};

export default function AdminApp() {
  const [page, setPage] = useState<Page>("dashboard");

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "#080b12";
    return () => { document.body.style.background = prev; };
  }, []);

  const info = PAGE_TITLES[page];

  function renderPage() {
    switch (page) {
      case "dashboard":     return <Dashboard />;
      case "users":         return <Users isSuperAdmin={true} />;
      case "api-usage":     return <ApiUsage />;
      case "costs":         return <Costs />;
      case "api-key":       return <ApiKey />;
      case "templates":     return <Templates />;
      case "image-control": return <ImageControl />;
      case "moderation":    return <Moderation />;
      case "system-logs":   return <SystemLogs />;
      case "settings":      return <Settings />;
    }
  }

  return (
    <div className="adm-root">
      {/* Sidebar */}
      <nav className="adm-sidebar">
        <div className="adm-sidebar-logo">
          <h1>Botzudio</h1>
          <span>Admin Panel</span>
        </div>

        <div className="adm-sidebar-nav">
          <div className="adm-nav-section">Main</div>
          {NAV.slice(0, 4).map((n) => (
            <button key={n.key} className={`adm-nav-item ${page === n.key ? "active" : ""}`}
              onClick={() => setPage(n.key)}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          <div className="adm-nav-section" style={{ marginTop: 8 }}>Management</div>
          {NAV.slice(4).map((n) => (
            <button key={n.key} className={`adm-nav-item ${page === n.key ? "active" : ""}`}
              onClick={() => setPage(n.key)}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>

        <div className="adm-sidebar-footer">
          <div className="adm-sidebar-user">
            <div className="adm-sidebar-avatar">S</div>
            <div className="adm-sidebar-user-info">
              <strong>Super Admin</strong>
              <span>Super Admin</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="adm-back-btn" onClick={() => window.location.href = "/app"}>
              ← Back to App
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="adm-main">
        <div className="adm-header">
          <div>
            <h2>{info.title}</h2>
            <div className="adm-header-sub">{info.sub}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="adm-badge adm-badge-accent">Super Admin</span>
          </div>
        </div>

        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
    </div>
  );
}
