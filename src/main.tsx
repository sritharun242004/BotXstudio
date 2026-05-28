import { StrictMode, useEffect, useState, lazy, Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ─── Host boundary ───────────────────────────────────────────────────────────
// Admin lives on its own subdomain so cookies, sessions, and any future XSS
// blast radius are isolated. Hostname-based gating below redirects users to
// the correct host. Localhost / preview builds skip the check.
const ADMIN_HOSTNAME = "admin.botzudio.com";
const MAIN_HOSTNAME = "botzudio.com";

function isAdminHost(): boolean {
  return window.location.hostname === ADMIN_HOSTNAME;
}
function isMainHost(): boolean {
  return window.location.hostname === MAIN_HOSTNAME;
}
function shouldEnforceHostBoundary(): boolean {
  return isAdminHost() || isMainHost();
}

function AdminOnlyHost({ children }: { children: ReactNode }) {
  if (shouldEnforceHostBoundary() && !isAdminHost()) {
    window.location.href = `https://${ADMIN_HOSTNAME}${window.location.pathname}${window.location.search}`;
    return <PageSpinner />;
  }
  return <>{children}</>;
}

function MainOnlyHost({ children }: { children: ReactNode }) {
  if (shouldEnforceHostBoundary() && isAdminHost()) {
    window.location.href = `https://${MAIN_HOSTNAME}${window.location.pathname}${window.location.search}`;
    return <PageSpinner />;
  }
  return <>{children}</>;
}

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
          {/* Main-only routes — redirect to botzudio.com if accessed via admin. */}
          <Route path="/"              element={<MainOnlyHost><LandingPage /></MainOnlyHost>} />
          <Route path="/blog"          element={<MainOnlyHost><BlogPage /></MainOnlyHost>} />
          <Route path="/compare"       element={<MainOnlyHost><ComparePage /></MainOnlyHost>} />
          <Route path="/compare/:slug" element={<MainOnlyHost><CompareDetailPage /></MainOnlyHost>} />
          <Route path="/terms"         element={<MainOnlyHost><TermsPage /></MainOnlyHost>} />
          <Route path="/app"           element={<MainOnlyHost><ProtectedApp /></MainOnlyHost>} />
          <Route path="/app/settings"       element={<MainOnlyHost><ProtectedSettings /></MainOnlyHost>} />
          <Route path="/app/documentation"  element={<MainOnlyHost><ProtectedDocs /></MainOnlyHost>} />
          <Route path="/r/:code"       element={<MainOnlyHost><ReferralPage /></MainOnlyHost>} />

          {/* Universal: login + callback work on both hosts so each domain has its own session. */}
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Admin-only routes — redirect to admin.botzudio.com if accessed via main. */}
          <Route path="/admin/login"   element={<AdminOnlyHost><AdminLogin /></AdminOnlyHost>} />
          <Route path="/admin"         element={<AdminOnlyHost><ProtectedAdmin /></AdminOnlyHost>} />

          {/* Catch-all: an unknown path (e.g. a stale bookmark like the
              pre-rebrand /ecommerce-scene-generator URL) used to render
              blank because no route matched. Send the user somewhere sensible
              depending on which host they're on. */}
          <Route path="*" element={
            <Navigate to={isAdminHost() ? "/admin" : "/"} replace />
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>
);
