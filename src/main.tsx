import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import LoginPage from "./components/LoginPage";
import AuthCallbackPage from "./components/AuthCallbackPage";
import App from "./App";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import { getSession, restoreSession } from "./lib/auth";
import { getAdminSession } from "./lib/adminAuth"; // used in ProtectedAdmin
import { CreditsProvider } from "./context/CreditsContext";
import "./styles.css";
import "./landing.css";
import "./auth.css";
import "./admin.css";

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
    return null; // loading
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/"              element={<LandingPage />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/app"           element={<ProtectedApp />} />
        <Route path="/admin/login"   element={<AdminLogin />} />
        <Route path="/admin"         element={<ProtectedAdmin />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
