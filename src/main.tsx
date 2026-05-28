import { StrictMode, useEffect, useState, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const LandingPage    = lazy(() => import("./LandingPage"));
const BlogPage       = lazy(() => import("./lp/BlogPage"));
const ComparePage       = lazy(() => import("./lp/ComparePage"));
const CompareDetailPage = lazy(() => import("./lp/CompareDetailPage"));
const TermsPage      = lazy(() => import("./TermsPage"));
const LoginPage      = lazy(() => import("./components/LoginPage"));
const AuthCallbackPage = lazy(() => import("./components/AuthCallbackPage"));
const App            = lazy(() => import("./App"));
const AdminLogin     = lazy(() => import("./components/AdminLogin"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const ReferralPage   = lazy(() => import("./components/ReferralPage"));
const SettingsPage   = lazy(() => import("./components/SettingsPage"));
const DocumentsTab   = lazy(() => import("./components/DocumentsTab"));

function PageSpinner() {
  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg, #F5F3FF)",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "4px solid #EDE9FE",
        borderTopColor: "#8B5CF6",
        animation: "bz-spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes bz-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
import { getSession, restoreSession } from "./lib/auth";
import { getAdminSession } from "./lib/adminAuth"; // used in ProtectedAdmin
import { CreditsProvider } from "./context/CreditsContext";
import "./styles.css";
import "./landing.css";
import "./auth.css";
import "./admin.css";
import "./lp/theme.css";

function ProtectedApp() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    restoreSession()
      .then((session) => {
        setAuthenticated(!!session);
      })
      .catch(() => {
        setAuthenticated(false);
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  if (checking) {
    const cached = getSession();
    if (!cached) return <Navigate to="/login" replace />;
    return <PageSpinner />;
  }

  if (!authenticated) return <Navigate to="/login" replace />;
  return (
    <CreditsProvider>
      <App />
    </CreditsProvider>
  );
}

function ProtectedAdmin() {
  const session = getAdminSession();
  if (!session) return <Navigate to="/admin/login" replace />;
  return <AdminDashboard />;
}

function ProtectedSettings() {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  return (
    <CreditsProvider>
      <SettingsPage />
    </CreditsProvider>
  );
}

function ProtectedDocs() {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  return (
    <CreditsProvider>
      <DocumentsTab />
    </CreditsProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/">
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/"              element={<LandingPage />} />
          <Route path="/blog"          element={<BlogPage />} />
          <Route path="/compare"       element={<ComparePage />} />
          <Route path="/compare/:slug" element={<CompareDetailPage />} />
          <Route path="/terms"         element={<TermsPage />} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/app"           element={<ProtectedApp />} />
          <Route path="/app/settings"       element={<ProtectedSettings />} />
          <Route path="/app/documentation"  element={<ProtectedDocs />} />
          <Route path="/r/:code"       element={<ReferralPage />} />
          <Route path="/admin/login"   element={<AdminLogin />} />
          <Route path="/admin"         element={<ProtectedAdmin />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>
);
