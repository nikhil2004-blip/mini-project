"use client";
import { useEffect, useState } from "react";
import { Zap, RefreshCw, AlertTriangle, GitBranch, Calendar } from "lucide-react";
import Link from "next/link";
import { authHeaders } from "@/lib/client-config";

const STATUS_MAP: Record<string, { bg: string; color: string }> = {
  passed:  { bg: "#14532d", color: "#22c55e" },
  failed:  { bg: "#450a0a", color: "#ef4444" },
  running: { bg: "#1e3a5f", color: "#38bdf8" },
  skipped: { bg: "#1e293b", color: "#64748b" },
};

export default function FlakinessPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/runs", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (error) return (
    <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: 12, padding: 20, color: "#ef4444" }}>
      <strong>Error:</strong> {error}
    </div>
  );

  if (loading && !data) return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#64748b", paddingTop: 40 }}>
      <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      Loading flakiness data...
    </div>
  );

  const { runs, stats } = data;
  const flakyRuns = runs.filter((r: any) => r.flaky);
  const flakyJobNames: string[] = stats.flakyJobNames ?? [];
  const flakyRate = runs.length > 0 ? Math.round((flakyRuns.length / runs.length) * 100) : 0;

  return (
    <div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 4 }}>Flakiness Tracker</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            Jobs with 2+ pass/fail alternations in the last 6 runs are flagged as flaky
          </p>
        </div>
        <button
          onClick={load} disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent", border: "1px solid #334155",
            borderRadius: 8, color: "#94a3b8", padding: "8px 14px", cursor: "pointer", fontSize: 13,
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Flaky Runs",         value: flakyRuns.length, color: "#fb923c", note: `of ${runs.length} total` },
          { label: "Flaky Job Patterns", value: flakyJobNames.length, color: "#f59e0b", note: "unique job names" },
          { label: "Flakiness Rate",     value: `${flakyRate}%`, color: flakyRate > 30 ? "#ef4444" : flakyRate > 10 ? "#f59e0b" : "#22c55e", note: "of all runs" },
          { label: "Runs Analyzed",      value: runs.length, color: "#38bdf8", note: "most recent" },
        ].map(({ label, value, color, note }) => (
          <div key={label} style={{
            background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "18px 20px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, right: 0, width: 80, height: 80,
              background: `radial-gradient(circle at 80% 20%, ${color}15 0%, transparent 70%)`,
            }} />
            <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, color: "#475569" }}>{note}</div>
          </div>
        ))}
      </div>

      {/* Flaky job names */}
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>
          Flaky Job Patterns Detected
        </h3>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "#475569" }}>
          These job names have shown 2+ pass/fail alternations across recent runs
        </p>

        {flakyJobNames.length === 0 ? (
          <div style={{ color: "#22c55e", fontSize: 14, padding: "16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            ✓ No flaky job patterns detected
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {flakyJobNames.map((name: string) => (
              <span key={name} style={{
                padding: "7px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                background: "#431407", color: "#fb923c",
                border: "1px solid #7c2d12",
                display: "flex", alignItems: "center", gap: 7,
                transition: "transform 0.1s",
              }}>
                <Zap size={12} /> {name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Flaky runs list */}
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>
          Runs with Flaky Jobs ({flakyRuns.length})
        </h3>

        {flakyRuns.length === 0 ? (
          <div style={{ color: "#22c55e", fontSize: 14, padding: "24px 0", textAlign: "center" }}>
            ✓ No flaky jobs detected in recent runs
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 500 }}>
              <thead>
                <tr style={{ color: "#64748b", borderBottom: "1px solid #334155" }}>
                  {["Run", "Branch", "Status", "Date", "Anomalies", ""].map(h => (
                    <th key={h} style={{ padding: "8px 12px", fontWeight: 500, fontSize: 12, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flakyRuns.map((run: any) => {
                  const st = STATUS_MAP[run.status] ?? STATUS_MAP.skipped;
                  return (
                    <tr
                      key={run.id}
                      style={{ borderBottom: "1px solid #0f172a", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#0f172a")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                        #{run.runNumber}
                        <span style={{ marginLeft: 6, fontSize: 10, color: "#fb923c", background: "#431407", padding: "1px 6px", borderRadius: 99 }}>
                          ⚡ FLAKY
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#94a3b8" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <GitBranch size={11} /> {run.branch}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                          background: st.bg, color: st.color,
                        }}>{run.status}</span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={11} />
                          {new Date(run.timestamp).toLocaleDateString()} {new Date(run.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {run.anomalies?.length > 0 ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#f59e0b", fontSize: 12 }}>
                            <AlertTriangle size={11} /> {run.anomalies.length}
                          </span>
                        ) : (
                          <span style={{ color: "#334155" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <Link href={`/workflow/${run.id}`} style={{
                          color: "#38bdf8", fontSize: 12, textDecoration: "none",
                          padding: "4px 10px", border: "1px solid #334155", borderRadius: 6,
                        }}>
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}