import { StrictMode, useEffect, useState, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSession, restoreSession } from "./lib/auth";
import "./styles.css";
import "./landing.css";
import "./auth.css";

const LandingPage    = lazy(() => import("./LandingPage"));
const LoginPage      = lazy(() => import("./components/LoginPage"));
const AuthCallbackPage = lazy(() => import("./components/AuthCallbackPage"));
const App            = lazy(() => import("./App"));
const AdminApp       = lazy(() => import("./admin/AdminApp"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    restoreSession()
      .then((session) => setAuthenticated(!!session))
      .catch(() => setAuthenticated(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    const cached = getSession();
    if (!cached) return <Navigate to="/login" replace />;
    return null;
  }

  if (!authenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const FALLBACK = <div style={{ minHeight: "100vh", background: "#080b12" }} />;

function ProtectedApp() {
  return <ProtectedRoute><Suspense fallback={FALLBACK}><App /></Suspense></ProtectedRoute>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/">
      <Suspense fallback={FALLBACK}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/app" element={<ProtectedApp />} />
          <Route path="/admin" element={<AdminApp />} />
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>
);
