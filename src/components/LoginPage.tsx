import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  CognitoUser,
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle2, Mail, Lock, ShieldCheck } from "lucide-react";
import { redirectToLogin } from "../lib/auth";
import { apiPost } from "../lib/api";
import type { Session } from "../lib/auth";

const BASE = import.meta.env.BASE_URL;
const SESSION_KEY  = "bsx_session_v1";
const TOKENS_KEY   = "bsx_cognito_tokens";
const POOL_ID      = "us-east-1_buvSaDGX7";
const CLIENT_ID    = import.meta.env.VITE_COGNITO_CLIENT_ID as string;

let _userPool: CognitoUserPool | null = null;
function getUserPool() {
  if (!_userPool) _userPool = new CognitoUserPool({ UserPoolId: POOL_ID, ClientId: CLIENT_ID });
  return _userPool;
}

type Stage = "email" | "signin" | "signup" | "verify" | "forgot_sent";

function decodeJwt(token: string): Record<string, string> {
  try {
    const p = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(p + "=".repeat((4 - p.length % 4) % 4)));
  } catch { return {}; }
}

const FV: Variants = {
  hidden: { opacity: 0, x: 18 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as any } },
  exit:   { opacity: 0, x: -18, transition: { duration: 0.2 } },
};

// ── Reusable input ────────────────────────────────────────────────────────────
function AuthInput({
  type, value, onChange, placeholder, icon: Icon, right,
}: {
  type: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ElementType; right?: React.ReactNode;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center",
      border: `2px solid ${focus ? "#8B5CF6" : "#E2E8F0"}`,
      borderRadius: 12,
      background: "#FFFDF5",
      boxShadow: focus ? "0 0 0 3px rgba(139,92,246,0.12)" : "none",
      transition: "border-color .15s, box-shadow .15s",
      overflow: "hidden",
    }}>
      <Icon size={16} style={{ margin: "0 12px", color: focus ? "#8B5CF6" : "#94A3B8", flexShrink: 0, transition: "color .15s" }} />
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1, border: "none", outline: "none", background: "transparent",
          fontSize: 14, fontWeight: 500, color: "#1E293B", padding: "13px 0",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      />
      {right && <div style={{ marginRight: 10 }}>{right}</div>}
    </div>
  );
}

// ── Google icon ───────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.253 17.64 11.945 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ── Primary button ────────────────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, loading, disabled, style }: {
  children: React.ReactNode; onClick?: () => void;
  loading?: boolean; disabled?: boolean; style?: React.CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", padding: "14px 20px",
        background: disabled || loading
          ? "#C4B5FD"
          : "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
        color: "#fff",
        border: "2px solid #1E293B",
        borderRadius: 12,
        fontSize: 15, fontWeight: 800,
        fontFamily: "'Outfit', sans-serif",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        boxShadow: hover && !disabled && !loading ? "4px 4px 0 #1E293B" : "2px 2px 0 #1E293B",
        transform: hover && !disabled && !loading ? "translate(-2px,-2px)" : "translate(0,0)",
        transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        ...style,
      }}
    >
      {loading ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ animation: "spin 0.7s linear infinite" }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : children}
    </button>
  );
}

// ── Ghost button ──────────────────────────────────────────────────────────────
function GhostBtn({ children, onClick, icon: Icon }: {
  children: React.ReactNode; onClick: () => void; icon?: React.ElementType;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", padding: "13px 20px",
        background: hover ? "#F8F5FF" : "#fff",
        color: "#1E293B",
        border: "2px solid #1E293B",
        borderRadius: 12,
        fontSize: 14, fontWeight: 700,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        cursor: "pointer",
        boxShadow: hover ? "4px 4px 0 #1E293B" : "2px 2px 0 #1E293B",
        transform: hover ? "translate(-2px,-2px)" : "translate(0,0)",
        transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, background .15s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".12em" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
    </div>
  );
}

// ── Error box ─────────────────────────────────────────────────────────────────
function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null;
  const isInfo = msg.toLowerCase().includes("verified") || msg.toLowerCase().includes("sent");
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 10,
      background: isInfo ? "#F0FDF4" : "#FEF2F2",
      border: `2px solid ${isInfo ? "#86EFAC" : "#FECACA"}`,
      color: isInfo ? "#15803D" : "#DC2626",
      fontSize: 13, fontWeight: 600, lineHeight: 1.5,
    }}>
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate  = useNavigate();
  const [stage,      setStage]      = useState<Stage>("email");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [code,       setCode]       = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [showCpw,    setShowCpw]    = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [pendingUser,setPendingUser] = useState<CognitoUser | null>(null);
  const [isSignup,   setIsSignup]   = useState(false);

  const err = (msg: string) => { setError(msg); setLoading(false); };

  // ── After successful Cognito auth, sync with backend ──────────────────────
  const syncSession = async (
    accessToken: string, idToken: string, refreshToken: string
  ) => {
    const expires = Date.now() + 3600 * 1000;
    localStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken, idToken, refreshToken, expiresAt: expires }));

    const payload = decodeJwt(idToken);
    const userEmail = payload.email || email;
    const name      = payload.name  || payload["cognito:username"] || userEmail.split("@")[0];

    const data = await apiPost<{ user?: Session; needsEmail?: boolean }>("/api/auth/me", { email: userEmail, name });
    if (data.user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
    }
    navigate("/app");
  };

  // ── Stage: email → next ───────────────────────────────────────────────────
  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return err("Please enter a valid email address.");
    setError("");
    setStage(isSignup ? "signup" : "signin");
  };

  // ── Stage: sign in ────────────────────────────────────────────────────────
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return err("Please enter your password.");
    setLoading(true); setError("");

    const user = new CognitoUser({ Username: email, Pool: getUserPool() });
    const auth = new AuthenticationDetails({ Username: email, Password: password });

    user.authenticateUser(auth, {
      onSuccess: async (result) => {
        try {
          await syncSession(
            result.getAccessToken().getJwtToken(),
            result.getIdToken().getJwtToken(),
            result.getRefreshToken().getToken()
          );
        } catch (e: any) { err(e?.message || "Failed to connect. Please try again."); }
      },
      onFailure: (e) => {
        if (e.code === "UserNotConfirmedException") {
          const u = new CognitoUser({ Username: email, Pool: getUserPool() });
          setPendingUser(u);
          u.resendConfirmationCode(() => {});
          setStage("verify");
          err("Please verify your email — we've resent the code.");
        } else if (e.code === "NotAuthorizedException" || e.code === "UserNotFoundException") {
          err("Incorrect email or password.");
        } else {
          err(e.message || "Sign in failed.");
        }
      },
      newPasswordRequired: () => err("A password reset is required. Please contact support."),
    });
  };

  // ── Stage: sign up ────────────────────────────────────────────────────────
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return err("Password must be at least 8 characters.");
    if (!/[A-Z]/.test(password)) return err("Password must contain at least one uppercase letter.");
    if (!/[0-9]/.test(password)) return err("Password must contain at least one number.");
    if (password !== confirmPw)  return err("Passwords do not match.");
    setLoading(true); setError("");

    getUserPool().signUp(email, password, [
      new CognitoUserAttribute({ Name: "email", Value: email }),
    ], [], (e, result) => {
      if (e) {
        const code = (e as any).code as string | undefined;
        if (code === "UsernameExistsException") err("An account with this email already exists.");
        else err(e.message || "Sign up failed.");
        return;
      }
      setPendingUser(result!.user);
      setStage("verify");
      setLoading(false);
    });
  };

  // ── Stage: verify code ────────────────────────────────────────────────────
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return err("Please enter the verification code.");
    setLoading(true); setError("");

    const user = pendingUser ?? new CognitoUser({ Username: email, Pool: getUserPool() });
    user.confirmRegistration(code, true, (e) => {
      if (e) { err(e.message || "Invalid code."); return; }
      setStage("signin");
      setLoading(false);
      setError("Email verified! You can now sign in.");
    });
  };

  const resendCode = () => {
    const user = pendingUser ?? new CognitoUser({ Username: email, Pool: getUserPool() });
    user.resendConfirmationCode((e) => {
      if (e) setError("Could not resend code.");
      else   setError("Code resent — check your inbox.");
    });
  };

  // ── Left panel features ───────────────────────────────────────────────────
  const features = [
    { icon: "✦", label: "Studio-quality images in 60 seconds"   },
    { icon: "✦", label: "Zero photography budget needed"         },
    { icon: "✦", label: "Any garment — flat lay or hanger shot"  },
    { icon: "✦", label: "Front, side, back & detail — all views" },
  ];

  // ── Stage titles / subtitles ──────────────────────────────────────────────
  const meta: Record<Stage, { title: string; sub: string }> = {
    email:       { title: "Welcome back",        sub: "Sign in or create an account to continue."     },
    signin:      { title: "Enter your password", sub: `Signing in as ${email}`                        },
    signup:      { title: "Create your account", sub: `Setting up account for ${email}`               },
    verify:      { title: "Check your inbox",    sub: `We sent a 6-digit code to ${email}`            },
    forgot_sent: { title: "Email sent!",         sub: "Check your inbox for the password reset link." },
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes lp-float {
          0%,100% { transform: translateY(0);    }
          50%      { transform: translateY(-8px); }
        }
        .auth-feature-chip:hover { background: rgba(255,255,255,0.12) !important; }
      `}</style>

      {/* ── Page background ────────────────────────────────────────────── */}
      <div style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#FFFDF5",
        backgroundImage: [
          "radial-gradient(ellipse 55% 45% at 10% 15%, rgba(139,92,246,0.12) 0%, transparent 60%)",
          "radial-gradient(ellipse 45% 40% at 90% 85%, rgba(244,114,182,0.10) 0%, transparent 60%)",
          "radial-gradient(circle, rgba(139,92,246,0.04) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "100% 100%, 100% 100%, 28px 28px",
        padding: "24px 16px",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>

        {/* ── Card wrapper ─────────────────────────────────────────────── */}
        <div style={{
          width: "100%", maxWidth: 920,
          display: "grid", gridTemplateColumns: "1fr 1fr",
          border: "2.5px solid #1E293B",
          borderRadius: 20,
          boxShadow: "8px 8px 0 #1E293B",
          overflow: "hidden",
        }} className="auth-split">

          {/* ── LEFT: dark brand panel ─────────────────────────────────── */}
          <div style={{
            background: "#1E293B",
            padding: "52px 40px",
            display: "flex", flexDirection: "column",
            justifyContent: "space-between",
            position: "relative", overflow: "hidden",
          }}>
            {/* aurora blobs */}
            <div style={{ position:"absolute", top:"10%", left:"20%", width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", bottom:"15%", right:"5%",  width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle, rgba(244,114,182,0.18) 0%, transparent 70%)", pointerEvents:"none" }} />

            {/* Brand */}
            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:40 }}>
                <div style={{
                  width:42, height:42, borderRadius:10,
                  background:"#8B5CF6",
                  border:"2px solid rgba(255,255,255,0.3)",
                  boxShadow:"3px 3px 0 rgba(255,255,255,0.15)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:14, color:"#fff",
                }}>BZ</div>
                <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:18, color:"#fff" }}>Botzudio</span>
              </div>

              <h2 style={{
                fontFamily:"'Outfit',sans-serif", fontWeight:900,
                fontSize:"clamp(24px,3.5vw,34px)", letterSpacing:"-1px",
                color:"#fff", lineHeight:1.1, marginBottom:14,
              }}>
                AI-powered fashion<br />photography.
              </h2>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.55)", lineHeight:1.65, marginBottom:36, maxWidth:280 }}>
                Professional catalog images from a flat lay. No photographer. No studio. No delays.
              </p>

              {/* Features */}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {features.map(({ icon, label }) => (
                  <div key={label} className="auth-feature-chip" style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"10px 14px", borderRadius:10,
                    background:"rgba(255,255,255,0.07)",
                    border:"1px solid rgba(255,255,255,0.1)",
                    transition:"background .15s",
                  }}>
                    <span style={{ color:"#FBBF24", fontSize:10 }}>{icon}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.80)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom stat */}
            <div style={{ position:"relative", zIndex:1, marginTop:32, paddingTop:24, borderTop:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display:"flex", gap:28 }}>
                {[["10k+","Images generated"],["90%","Cost savings"],["60s","Per image"]].map(([val, lbl]) => (
                  <div key={lbl}>
                    <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:22, color:"#8B5CF6", letterSpacing:"-0.5px" }}>{val}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:600, textTransform:"uppercase", letterSpacing:".1em" }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: form panel ──────────────────────────────────────── */}
          <div style={{ background:"#fff", padding:"52px 40px", display:"flex", flexDirection:"column", justifyContent:"center" }}>

            <AnimatePresence mode="wait">
              <motion.div
                key={stage}
                variants={FV}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                {/* Back button */}
                {stage !== "email" && stage !== "forgot_sent" && (
                  <button
                    type="button"
                    onClick={() => { setError(""); setStage("email"); setPassword(""); setCode(""); }}
                    style={{
                      display:"inline-flex", alignItems:"center", gap:6,
                      marginBottom:24, border:"none", background:"none",
                      cursor:"pointer", fontSize:13, fontWeight:700,
                      color:"#64748B", padding:0,
                      transition:"color .15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#8B5CF6")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}
                  >
                    <ArrowLeft size={14} strokeWidth={2.5} /> Back
                  </button>
                )}

                {/* Title */}
                <div style={{ marginBottom:28 }}>
                  <h1 style={{
                    fontFamily:"'Outfit',sans-serif", fontWeight:900,
                    fontSize:26, letterSpacing:"-0.5px", color:"#1E293B",
                    margin:"0 0 6px",
                  }}>
                    {meta[stage].title}
                  </h1>
                  <p style={{ fontSize:14, color:"#64748B", margin:0, lineHeight:1.5 }}>
                    {meta[stage].sub}
                  </p>
                </div>

                {/* ── EMAIL stage ─────────────────────────────────────── */}
                {stage === "email" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {/* Google */}
                    <GhostBtn onClick={() => redirectToLogin("Google")} icon={GoogleIcon}>
                      Continue with Google
                    </GhostBtn>

                    <Divider label="or continue with email" />

                    <form onSubmit={handleEmailNext} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      <AuthInput type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} />
                      <ErrorBox msg={error} />
                      <PrimaryBtn>
                        Continue <ArrowRight size={15} strokeWidth={2.5} />
                      </PrimaryBtn>
                    </form>

                    <p style={{ textAlign:"center", fontSize:13, color:"#64748B", marginTop:4 }}>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => { setIsSignup(true); if (email) setStage("signup"); }}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"#8B5CF6", fontWeight:700, fontSize:13, padding:0, fontFamily:"inherit" }}
                      >
                        Create one
                      </button>
                    </p>
                  </div>
                )}

                {/* ── SIGN IN stage ────────────────────────────────────── */}
                {stage === "signin" && (
                  <form onSubmit={handleSignIn} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <AuthInput
                      type={showPw ? "text" : "password"}
                      value={password} onChange={setPassword}
                      placeholder="Your password" icon={Lock}
                      right={
                        <button type="button" onClick={() => setShowPw(p => !p)}
                          style={{ background:"none", border:"none", cursor:"pointer", color:"#94A3B8", padding:4, display:"flex" }}>
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />
                    <ErrorBox msg={error} />
                    <PrimaryBtn loading={loading}>Sign In</PrimaryBtn>

                    <p style={{ textAlign:"center", fontSize:12, color:"#94A3B8", marginTop:2 }}>
                      Don't have an account?{" "}
                      <button type="button" onClick={() => { setStage("signup"); setError(""); }}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"#8B5CF6", fontWeight:700, fontSize:12, padding:0, fontFamily:"inherit" }}>
                        Create one
                      </button>
                    </p>
                  </form>
                )}

                {/* ── SIGN UP stage ────────────────────────────────────── */}
                {stage === "signup" && (
                  <form onSubmit={handleSignUp} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <AuthInput
                      type={showPw ? "text" : "password"}
                      value={password} onChange={setPassword}
                      placeholder="Choose a password" icon={Lock}
                      right={
                        <button type="button" onClick={() => setShowPw(p => !p)}
                          style={{ background:"none", border:"none", cursor:"pointer", color:"#94A3B8", padding:4, display:"flex" }}>
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />
                    <AuthInput
                      type={showCpw ? "text" : "password"}
                      value={confirmPw} onChange={setConfirmPw}
                      placeholder="Confirm password" icon={ShieldCheck}
                      right={
                        <button type="button" onClick={() => setShowCpw(p => !p)}
                          style={{ background:"none", border:"none", cursor:"pointer", color:"#94A3B8", padding:4, display:"flex" }}>
                          {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />
                    <p style={{ fontSize:11, color:"#94A3B8", margin:"2px 0 0", lineHeight:1.6 }}>
                      Min. 8 characters · 1 uppercase · 1 number
                    </p>
                    <ErrorBox msg={error} />
                    <PrimaryBtn loading={loading}>Create Account</PrimaryBtn>

                    <p style={{ textAlign:"center", fontSize:12, color:"#94A3B8", marginTop:2 }}>
                      Already have an account?{" "}
                      <button type="button" onClick={() => { setStage("signin"); setIsSignup(false); setError(""); }}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"#8B5CF6", fontWeight:700, fontSize:12, padding:0, fontFamily:"inherit" }}>
                        Sign in
                      </button>
                    </p>
                  </form>
                )}

                {/* ── VERIFY stage ─────────────────────────────────────── */}
                {stage === "verify" && (
                  <form onSubmit={handleVerify} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <div style={{
                      padding:"16px", borderRadius:12, background:"#F0FDF4",
                      border:"2px solid #86EFAC", display:"flex", gap:10, alignItems:"flex-start",
                    }}>
                      <CheckCircle2 size={18} style={{ color:"#16A34A", flexShrink:0, marginTop:1 }} />
                      <p style={{ fontSize:13, fontWeight:600, color:"#15803D", margin:0, lineHeight:1.5 }}>
                        We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
                      </p>
                    </div>
                    <AuthInput type="text" value={code} onChange={setCode} placeholder="123456" icon={Mail} />
                    <ErrorBox msg={error} />
                    <PrimaryBtn loading={loading}>Verify Email</PrimaryBtn>
                    <p style={{ textAlign:"center", fontSize:12, color:"#94A3B8" }}>
                      Didn't receive it?{" "}
                      <button type="button" onClick={resendCode}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"#8B5CF6", fontWeight:700, fontSize:12, padding:0, fontFamily:"inherit" }}>
                        Resend code
                      </button>
                    </p>
                  </form>
                )}

                {/* ── FORGOT SENT ──────────────────────────────────────── */}
                {stage === "forgot_sent" && (
                  <div style={{ textAlign:"center", display:"flex", flexDirection:"column", gap:16 }}>
                    <div style={{ fontSize:48 }}>📬</div>
                    <p style={{ fontSize:14, color:"#64748B", lineHeight:1.65 }}>
                      Check your inbox at <strong style={{ color:"#1E293B" }}>{email}</strong> for a password reset link.
                    </p>
                    <PrimaryBtn onClick={() => { setStage("signin"); setError(""); }}>
                      Back to Sign In
                    </PrimaryBtn>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Admin link */}
            <div style={{ marginTop:36, paddingTop:18, borderTop:"1px solid #F1F5F9", textAlign:"center" }}>
              <button
                type="button"
                onClick={() => navigate("/admin/login")}
                style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"7px 16px", borderRadius:9999,
                  border:"1.5px solid #E2E8F0", background:"transparent",
                  color:"#94A3B8", fontSize:12, fontWeight:600,
                  cursor:"pointer", transition:"all .15s", fontFamily:"inherit",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#8B5CF6"; e.currentTarget.style.color="#8B5CF6"; e.currentTarget.style.background="rgba(139,92,246,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#E2E8F0"; e.currentTarget.style.color="#94A3B8"; e.currentTarget.style.background="transparent"; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Admin Panel
              </button>
            </div>
          </div>
        </div>

        {/* ── Responsive collapse (mobile: single col) ─────────────────── */}
        <style>{`
          @media (max-width: 700px) {
            .auth-split { grid-template-columns: 1fr !important; }
            .auth-split > div:first-child { display: none !important; }
          }
        `}</style>
      </div>
    </>
  );
}
