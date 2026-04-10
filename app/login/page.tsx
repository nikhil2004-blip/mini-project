"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveUser } from "@/lib/client-config";
import { Key, ArrowRight, Activity, Eye, EyeOff, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken]         = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError("");

    try {
      // Authenticate via our server API which sets the secure HttpOnly cookie
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setError(errorData.error || "Invalid token. Make sure it has the 'repo' scope and hasn't expired.");
        } else {
          setError(`Server error ${res.status}. Check your connection and try again.`);
        }
        setLoading(false);
        return;
      }

      const { user: ghUser } = await res.json();

      // Save user profile without the sensitive token
      saveUser({
        username:   ghUser.login,
        name:       ghUser.name || ghUser.login,
        avatar_url: ghUser.avatar_url,
      });

      router.push("/projects");
    } catch {
      setError("Network error. Please check your internet connection.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a", color: "#f1f5f9",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "'Inter', sans-serif",
      padding: "24px",
    }}>
      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #38bdf8, #818cf8)", marginBottom: 16, boxShadow: "0 12px 30px rgba(56,189,248,0.25)" }}>
            <Activity size={28} color="#0f172a" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Connect GitHub
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Paste your Personal Access Token to authenticate and load your repositories.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 20, padding: 32, boxShadow: "0 25px 50px rgba(0,0,0,0.4)" }}>
          <form onSubmit={handleConnect}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Personal Access Token
            </label>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <Key size={14} color="#475569" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
              <input
                type={showToken ? "text" : "password"}
                required
                autoFocus
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={e => setToken(e.target.value)}
                style={{
                  width: "100%", background: "#0f172a",
                  border: "1px solid #334155", borderRadius: 10,
                  padding: "13px 40px 13px 36px",
                  color: "#f1f5f9", fontSize: 14,
                  outline: "none", boxSizing: "border-box",
                  fontFamily: "monospace", letterSpacing: showToken ? "normal" : "0.06em",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#38bdf8"}
                onBlur={e => e.target.style.borderColor = "#334155"}
              />
              <button
                type="button"
                onClick={() => setShowToken(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 0 }}
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <p style={{ fontSize: 12, color: "#475569", margin: "0 0 24px", lineHeight: 1.6 }}>
              Needs <code style={{ background: "#0f172a", padding: "1px 5px", borderRadius: 4, color: "#94a3b8", fontSize: 11 }}>repo</code> scope.{" "}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=CI+Observer"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#38bdf8", textDecoration: "none" }}
              >
                Generate a new token →
              </a>
            </p>

            {error && (
              <div style={{ background: "#450a0a", border: "1px solid #dc2626", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token.trim()}
              style={{
                width: "100%",
                background: loading || !token.trim() ? "transparent" : "linear-gradient(135deg, #38bdf8, #818cf8)",
                border: loading || !token.trim() ? "1px solid #334155" : "none",
                borderRadius: 10, color: loading || !token.trim() ? "#475569" : "#0f172a",
                padding: "14px", fontSize: 15, fontWeight: 700,
                cursor: loading || !token.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              {loading
                ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Verifying with GitHub…</>
                : <>Authenticate <ArrowRight size={16} /></>
              }
            </button>
          </form>

          {/* Security note */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 20, padding: "12px", background: "rgba(56,189,248,0.04)", borderRadius: 8, border: "1px solid rgba(56,189,248,0.08)" }}>
            <ShieldCheck size={14} color="#38bdf8" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
              Your token is stored <strong style={{ color: "#64748b" }}>only in this browser's localStorage</strong> and is never sent to any server other than the GitHub API directly.
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#334155" }}>
          <Link href="/" style={{ color: "#475569", textDecoration: "none" }}>← Back to home</Link>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
