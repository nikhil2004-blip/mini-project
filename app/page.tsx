import Link from "next/link";
import { Activity, GitBranch, Shield, Zap, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a", color: "#f1f5f9",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "'Inter', sans-serif",
      position: "relative", overflow: "hidden"
    }}>
      {/* Background glow effects */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 800, padding: "0 24px", textAlign: "center", position: "relative", zIndex: 10 }}>
        {/* Logo */}
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #38bdf8, #818cf8)", marginBottom: 32, boxShadow: "0 20px 40px rgba(56,189,248,0.2)" }}>
          <Activity size={36} color="#0f172a" />
        </div>

        <h1 style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 24px", lineHeight: 1.1 }}>
          Intelligent <span style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>CI Observability</span>
        </h1>
        
        <p style={{ fontSize: 20, color: "#94a3b8", margin: "0 auto 48px", maxWidth: 600, lineHeight: 1.6 }}>
          Monitor, analyze, and optimize your GitHub Actions workflows with real-time AI-driven insights and anomaly detection.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <Link href="/login" style={{
            background: "linear-gradient(135deg, #38bdf8, #818cf8)",
            color: "#0f172a", padding: "16px 32px", borderRadius: 12,
            fontSize: 16, fontWeight: 700, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 10px 25px rgba(56,189,248,0.3)",
            transition: "transform 0.2s"
          }}>
            <GitBranch size={20} />
            Connect GitHub
            <ChevronRight size={18} />
          </Link>
        </div>

        {/* Feature grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 80, textAlign: "left" }}>
          <div style={{ background: "rgba(30,41,59,0.5)", border: "1px solid #334155", padding: 24, borderRadius: 16 }}>
            <Zap size={24} color="#38bdf8" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "#f1f5f9" }}>Real-time Monitoring</h3>
            <p style={{ fontSize: 14, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>Track build durations, pinpoint bottlenecks, and view live pipeline health.</p>
          </div>
          <div style={{ background: "rgba(30,41,59,0.5)", border: "1px solid #334155", padding: 24, borderRadius: 16 }}>
            <Activity size={24} color="#818cf8" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "#f1f5f9" }}>AI Assistant Insights</h3>
            <p style={{ fontSize: 14, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>Get natural language summaries and actionable recommendations via Groq.</p>
          </div>
          <div style={{ background: "rgba(30,41,59,0.5)", border: "1px solid #334155", padding: 24, borderRadius: 16 }}>
            <Shield size={24} color="#a78bfa" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "#f1f5f9" }}>Flakiness Detection</h3>
            <p style={{ fontSize: 14, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>Automatically identify unstable jobs and prevent broken releases.</p>
          </div>
        </div>
      </div>
    </div>
  );
}