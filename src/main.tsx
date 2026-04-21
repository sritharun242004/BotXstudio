import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import App from "./App";
import { getSession, restoreSession } from "./lib/auth";
import "./styles.css";
import "./landing.css";
import "./auth.css";

function ProtectedApp() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Try to restore session from refresh token cookie
    restoreSession().then((session) => {
      setAuthenticated(!!session);
      setChecking(false);
    });
  }, []);

  if (checking) {
    // Quick sync check while async restore runs
    const cached = getSession();
    if (!cached) return <Navigate to="/login" replace />;
    return null; // loading
  }

  if (!authenticated) return <Navigate to="/login" replace />;
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/ecommerce-scene-generator">
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/app"      element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
