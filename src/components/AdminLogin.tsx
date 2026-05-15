import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin, getAdminSession } from "../lib/adminAuth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (getAdminSession()) navigate("/admin", { replace: true });
  }, [navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (adminLogin(email, password)) {
        navigate("/admin", { replace: true });
      } else {
        setError("Invalid email or password.");
      }
      setLoading(false);
    }, 350);
  }

  return (
    <div className="adlRoot">
      <div className="adlCard">
        {/* Brand */}
        <div className="adlBrand">
          <div className="adlLogoWrap">
            <img src={`${BASE}/logo.png`} alt="Botzudio" />
          </div>
          <div>
            <div className="adlBrandEye">The Bot Company</div>
            <div className="adlBrandName">Admin Panel</div>
          </div>
        </div>

        <h2 className="adlHeading">Sign in to continue</h2>

        <form onSubmit={handleSubmit} className="adlForm">
          <div className="adlField">
            <label className="adlLabel">Email</label>
            <input
              className="adlInput"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@thebotcompany.in"
              required
              autoComplete="email"
            />
          </div>
          <div className="adlField">
            <label className="adlLabel">Password</label>
            <div className="adlInputWrap">
              <input
                className="adlInput"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button type="button" className="adlPwToggle" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <div className="adlError">{error}</div>}

          <button type="submit" className="adlSubmit" disabled={loading}>
            {loading ? <span className="adlSpinner" /> : null}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="adlFootnote">Restricted access · Botzudio Admin</p>
      </div>
    </div>
  );
}
