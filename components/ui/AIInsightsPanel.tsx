"use client";
// components/ui/AIInsightsPanel.tsx
// Reusable AI health analysis widget powered by Groq

import { useState } from "react";
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle, XCircle, Lightbulb } from "lucide-react";

interface AIInsight {
  healthScore: number | null;
  status: "Healthy" | "Warning" | "Critical" | "Unknown";
  summary: string;
  topIssue: string | null;
  recommendations: string[];
}

const STATUS_CONFIG = {
  Healthy:  { color: "#22c55e", bg: "#052e16", border: "#166534", icon: CheckCircle },
  Warning:  { color: "#f59e0b", bg: "#451a03", border: "#92400e", icon: AlertTriangle },
  Critical: { color: "#ef4444", bg: "#450a0a", border: "#991b1b", icon: XCircle },
  Unknown:  { color: "#94a3b8", bg: "#1e293b", border: "#334155", icon: AlertTriangle },
};

function HealthScoreRing({ score }: { score: number }) {
  const radius = 30;
  const circ   = 2 * Math.PI * radius;
  const filled = (score / 100) * circ;
  const color  = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        {/* Track */}
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#334155" strokeWidth="7" />
        {/* Filled arc */}
        <circle
          cx="40" cy="40" r={radius} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>/ 100</span>
      </div>
    </div>
  );
}

export default function AIInsightsPanel({ runs, stats }: { runs: any[]; stats: any }) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const analyze = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runs, stats }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setInsight(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const cfg = insight ? STATUS_CONFIG[insight.status] ?? STATUS_CONFIG.Unknown : null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #1e293b 0%, #162032 100%)",
      border: "1px solid #334155",
      borderRadius: 14,
      padding: 24,
      marginBottom: 28,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative glow */}
      <div style={{
        position: "absolute", top: -40, right: -40, width: 180, height: 180,
        background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color="#38bdf8" />
          <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>AI Pipeline Analysis</span>
          <span style={{
            fontSize: 10, color: "#38bdf8", background: "rgba(56,189,248,0.12)",
            padding: "2px 8px", borderRadius: 99, fontWeight: 600,
          }}>Powered by Groq · Llama 3</span>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: loading ? "#0f172a" : "linear-gradient(135deg, #38bdf8, #818cf8)",
            border: "none", borderRadius: 8, color: loading ? "#64748b" : "#0f172a",
            padding: "8px 16px", cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: 13,
            transition: "opacity 0.2s",
          }}
        >
          {loading
            ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Analyzing...</>
            : <><Sparkles size={13} /> {insight ? "Re-analyze" : "Analyze Now"}</>
          }
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {/* Empty / prompt state */}
      {!insight && !loading && !error && (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#475569", fontSize: 13 }}>
          <Sparkles size={28} color="#334155" style={{ marginBottom: 8 }} />
          <p style={{ margin: 0 }}>Click <strong style={{ color: "#94a3b8" }}>Analyze Now</strong> to get an AI-powered health summary<br />of your CI pipeline using Groq's Llama 3 model.</p>
        </div>
      )}

      {/* Loading shimmer */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
          {[80, 60, 100, 70].map((w, i) => (
            <div key={i} style={{
              height: 12, borderRadius: 6, background: "#334155",
              width: `${w}%`, animation: `shimmer 1.5s ease-in-out ${i * 0.1}s infinite`,
            }} />
          ))}
          <style>{`
            @keyframes shimmer {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.8; }
            }
          `}</style>
        </div>
      )}

      {/* Results */}
      {insight && cfg && !loading && (
        <div>
          {/* Status banner */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 10, padding: "14px 18px", marginBottom: 18,
          }}>
            <HealthScoreRing score={insight.healthScore ?? 0} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <cfg.icon size={14} color={cfg.color} />
                <span style={{ fontWeight: 700, fontSize: 15, color: cfg.color }}>
                  {insight.status}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: "#cbd5e1", lineHeight: 1.6 }}>
                {insight.summary}
              </p>
            </div>
          </div>

          {/* Top issue */}
          {insight.topIssue && insight.topIssue !== "None" && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              background: "#1a1a2e", border: "1px solid #3f3f5f",
              borderRadius: 8, padding: "12px 14px", marginBottom: 14,
            }}>
              <AlertTriangle size={14} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3, fontWeight: 600 }}>TOP PRIORITY</div>
                <div style={{ fontSize: 13, color: "#fde68a" }}>{insight.topIssue}</div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {insight.recommendations?.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Lightbulb size={13} color="#a78bfa" />
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Recommendations
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {insight.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{
                      flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                      background: "rgba(167,139,250,0.15)", color: "#a78bfa",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
