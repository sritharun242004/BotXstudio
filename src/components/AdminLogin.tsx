import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../lib/auth";
import { isAdminEmail } from "../lib/adminAuth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AdminLogin() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "needs-login" | "not-authorized">("checking");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setStatus("needs-login");
      return;
    }
    if (isAdminEmail(session.email)) {
      navigate("/admin", { replace: true });
      return;
    }
    setStatus("not-authorized");
  }, [navigate]);

  return (
    <div className="adlRoot">
      <div className="adlCard">
        <div className="adlBrand">
          <div className="adlLogoWrap">
            <img src={`${BASE}/logo.png`} alt="Botzudio" />
          </div>
          <div>
            <div className="adlBrandEye">The Bot Company</div>
            <div className="adlBrandName">Admin Panel</div>
          </div>
        </div>

        {status === "checking" && (
          <h2 className="adlHeading">Checking access…</h2>
        )}

        {status === "needs-login" && (
          <>
            <h2 className="adlHeading">Sign in to continue</h2>
            <p className="adlFootnote" style={{ marginBottom: 16 }}>
              Admin access uses your regular account. Sign in, then return here.
            </p>
            <button
              type="button"
              className="adlSubmit"
              onClick={() => navigate("/login")}
            >
              Go to sign in
            </button>
          </>
        )}

        {status === "not-authorized" && (
          <>
            <h2 className="adlHeading">Not authorized</h2>
            <p className="adlFootnote" style={{ marginBottom: 16 }}>
              Your account does not have admin privileges. Contact the team if you
              believe this is a mistake.
            </p>
            <button
              type="button"
              className="adlSubmit"
              onClick={() => navigate("/app")}
            >
              Back to app
            </button>
          </>
        )}

        <p className="adlFootnote" style={{ marginTop: 24 }}>Restricted access · Botzudio Admin</p>
      </div>
    </div>
  );
}
