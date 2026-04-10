"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from "recharts";
import { CheckCircle, XCircle, Clock, AlertTriangle, Zap, Activity, RefreshCw } from "lucide-react";
import Link from "next/link";
import AIInsightsPanel from "@/components/ui/AIInsightsPanel";
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: any; color: string;
}) {
  return (
    <div style={{
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: 12,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle at 80% 20%, ${color}18 0%, transparent 70%)`,
        borderRadius: 12,
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Icon size={18} color={color} style={{ flexShrink: 0 }} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    passed:  { bg: "#14532d", color: "#22c55e" },
    failed:  { bg: "#450a0a", color: "#ef4444" },
    running: { bg: "#1e3a5f", color: "#38bdf8" },
    skipped: { bg: "#1e293b", color: "#64748b" },
  };
  const s = map[status] ?? map.skipped;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, display: "inline-block",
    }}>{status}</span>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const load = () => {
    setError("");
    setLoading(true);
    fetch("/api/runs")
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else { setError(""); setData(d); setLastFetch(new Date()); }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Show error but still allow user to refresh
  const errorHeader = error ? (
    <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: 12, padding: 20, color: "#ef4444", marginBottom: 20 }}>
      <strong>API Error:</strong> {error}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
        <button onClick={load} style={{ background: "#ef4444", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          <RefreshCw size={14} /> Retry
        </button>
        <p style={{ color: "#94a3b8", margin: 0, fontSize: 13 }}>
          <Link href="/projects" style={{ color: "#38bdf8" }}>← Switch repository</Link>
        </p>
      </div>
    </div>
  ) : null;

  if (loading && !data) return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#64748b", paddingTop: 40 }}>
      <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      Fetching CI data from GitHub...
    </div>
  );

  if (!data) return (
    <div style={{ padding: 20 }}>
      {errorHeader}
    </div>
  );

  const { runs, stats } = data;
  const chartData = [...runs]
    .filter((r: any) => r.totalDuration > 0)
    .reverse()
    .slice(-10)
    .map((r: any) => ({
      run: `#${r.runNumber}`,
      duration: r.totalDuration,
      critical: r.findings.reduce((a: number, f: any) => a + f.critical, 0),
      high: r.findings.reduce((a: number, f: any) => a + f.high, 0),
      medium: r.findings.reduce((a: number, f: any) => a + f.medium, 0),
    }));

  return (
    <div>
      {errorHeader}
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 4 }}>Pipeline Dashboard</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: 13 }}>
            CI health for <strong style={{ color: "#94a3b8" }}>{stats.repoInfo.owner}/{stats.repoInfo.repo}</strong>
            {lastFetch && <span> · Updated {lastFetch.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent", border: "1px solid #334155",
            borderRadius: 8, color: "#94a3b8", padding: "8px 14px",
            cursor: "pointer", fontSize: 13, transition: "all 0.15s",
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 32 }}>
        <StatCard label="Total Runs"    value={stats.total}           icon={Activity}       color="#38bdf8" />
        <StatCard label="Passed"        value={stats.passed}          icon={CheckCircle}    color="#22c55e" />
        <StatCard label="Failed"        value={stats.failed}          icon={XCircle}        color="#ef4444" />
        <StatCard label="Avg Duration"  value={`${stats.avgDuration}s`} icon={Clock}        color="#a78bfa" />
        <StatCard label="Anomalies"     value={stats.anomalyCount}    icon={AlertTriangle}  color="#f59e0b" />
        <StatCard label="Flaky Runs"    value={stats.flaky}           icon={Zap}            color="#fb923c" />
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel runs={runs} stats={stats} />

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28 }}>
        {/* Build Duration Chart */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>Build Duration</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "#475569" }}>Last 10 runs (seconds)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="run" stroke="#475569" fontSize={11} tick={{ fill: "#64748b" }} />
              <YAxis stroke="#475569" fontSize={11} tick={{ fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`${v}s`, "Duration"]}
              />
              <Line
                type="monotone" dataKey="duration" stroke="#38bdf8" strokeWidth={2.5}
                dot={{ r: 4, fill: "#38bdf8", stroke: "#0f172a", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Vulnerability Findings Chart */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>Security Findings</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "#475569" }}>Critical / High / Medium per build</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="run" stroke="#475569" fontSize={11} tick={{ fill: "#64748b" }} />
              <YAxis stroke="#475569" fontSize={11} tick={{ fill: "#64748b" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
              <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
              <Bar dataKey="high"     stackId="a" fill="#f59e0b" name="High" />
              <Bar dataKey="medium"   stackId="a" fill="#38bdf8" name="Medium" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Runs Table */}
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>Recent Runs</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 600 }}>
            <thead>
              <tr style={{ color: "#64748b", textAlign: "left", borderBottom: "1px solid #334155" }}>
                {["Run", "Branch", "Commit", "Actor", "Status", "Duration", "Anomalies", ""].map(h => (
                  <th key={h} style={{ padding: "8px 12px", fontWeight: 500, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((run: any) => (
                <tr
                  key={run.id}
                  style={{ borderBottom: "1px solid #0f172a", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#0f172a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#f1f5f9" }}>
                    #{run.runNumber}
                    {run.flaky && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: "#fb923c", background: "#431407", padding: "1px 6px", borderRadius: 99 }}>
                        FLAKY
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#94a3b8", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {run.branch}
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#64748b", fontSize: 12 }}>{run.commitSha}</td>
                  <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 12 }}>{run.actor?.login}</td>
                  <td style={{ padding: "10px 12px" }}><StatusBadge status={run.status} /></td>
                  <td style={{ padding: "10px 12px", color: "#94a3b8" }}>
                    {run.totalDuration > 0 ? `${run.totalDuration}s` : "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {run.anomalies?.length > 0 ? (
                      <span style={{ color: "#f59e0b", fontSize: 12 }}>⚠ {run.anomalies.length}</span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}