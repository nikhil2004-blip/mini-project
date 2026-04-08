"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Dot } from "recharts";
import { authHeaders } from "@/lib/client-config";

const SEV_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f59e0b",
  medium:   "#38bdf8",
  low:      "#22c55e",
};

const SEV_BG: Record<string, string> = {
  critical: "#450a0a",
  high:     "#451a03",
  medium:   "#0c2a3b",
  low:      "#052e16",
};

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: SEV_BG[severity] ?? "#1e293b",
      color: SEV_COLOR[severity] ?? "#94a3b8",
      border: `1px solid ${SEV_COLOR[severity] ?? "#334155"}33`,
    }}>
      <AlertTriangle size={9} />
      {severity}
    </span>
  );
}

// Custom dot that shows red when anomalous
function AnomalyDot(props: any) {
  const { cx, cy, payload } = props;
  if (!payload) return null;
  return payload.hasAnomaly
    ? <circle cx={cx} cy={cy} r={7} fill="#ef4444" stroke="#0f172a" strokeWidth={2} />
    : <circle cx={cx} cy={cy} r={4} fill="#38bdf8" stroke="#0f172a" strokeWidth={1} />;
}

export default function AnomaliesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sevFilter, setSevFilter] = useState<string>("all");

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
      Loading anomaly data...
    </div>
  );

  const { runs } = data;
  const allAnomalies = runs.flatMap((r: any) =>
    r.anomalies.map((a: any) => ({ ...a, run: `#${r.runNumber}`, runId: r.id, branch: r.branch, timestamp: r.timestamp }))
  );

  const filteredAnomalies = sevFilter === "all"
    ? allAnomalies
    : allAnomalies.filter((a: any) => a.severity === sevFilter);

  // Duration trend for chart
  const durationTrend = [...runs]
    .filter((r: any) => r.totalDuration > 0)
    .reverse()
    .map((r: any) => ({
      run: `#${r.runNumber}`,
      duration: r.totalDuration,
      hasAnomaly: r.anomalies.length > 0,
    }));

  const avgDuration = Math.round(
    durationTrend.reduce((a: number, r: any) => a + r.duration, 0) / (durationTrend.length || 1)
  );

  // Severity counts
  const sevCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  allAnomalies.forEach((a: any) => { if (a.severity in sevCounts) sevCounts[a.severity as keyof typeof sevCounts]++; });

  return (
    <div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 4 }}>Anomaly & Regression Report</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            Detected using 15% deviation threshold from rolling baseline · {allAnomalies.length} total anomalies
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

      {/* Severity summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {(["critical", "high", "medium", "low"] as const).map(sev => (
          <div key={sev} style={{
            background: "#1e293b", border: `1px solid ${sevCounts[sev] > 0 ? SEV_COLOR[sev] + "44" : "#334155"}`,
            borderRadius: 10, padding: "14px 16px", cursor: "pointer",
            transition: "border-color 0.15s",
          }}
            onClick={() => setSevFilter(sevFilter === sev ? "all" : sev)}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: SEV_COLOR[sev], marginBottom: 4 }}>{sevCounts[sev]}</div>
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>{sev}</div>
            {sevFilter === sev && (
              <div style={{ fontSize: 10, color: SEV_COLOR[sev], marginTop: 4 }}>● Filtered</div>
            )}
          </div>
        ))}
      </div>

      {/* Duration trend chart */}
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#cbd5e1", marginBottom: 4 }}>Runtime Trend</h3>
            <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
              Baseline avg: <strong style={{ color: "#f59e0b" }}>{avgDuration}s</strong> · Red dots = anomalous runs
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11, color: "#64748b" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8", display: "inline-block" }} /> Normal
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} /> Anomaly
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={durationTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="run" stroke="#475569" fontSize={11} tick={{ fill: "#64748b" }} />
            <YAxis stroke="#475569" fontSize={11} unit="s" tick={{ fill: "#64748b" }} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
              formatter={(v: any) => [`${v}s`, "Duration"]}
            />
            <ReferenceLine
              y={avgDuration} stroke="#f59e0b" strokeDasharray="5 4"
              label={{ value: `baseline ${avgDuration}s`, fill: "#f59e0b", fontSize: 10, position: "insideTopRight" }}
            />
            <Line
              type="monotone" dataKey="duration" stroke="#38bdf8" strokeWidth={2.5}
              dot={<AnomalyDot />}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly Table */}
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>
            Flagged Anomalies ({filteredAnomalies.length}{sevFilter !== "all" ? ` · ${sevFilter}` : ""})
          </h3>
          {sevFilter !== "all" && (
            <button
              onClick={() => setSevFilter("all")}
              style={{ fontSize: 12, color: "#64748b", background: "transparent", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
            >
              Clear filter ×
            </button>
          )}
        </div>

        {filteredAnomalies.length === 0 ? (
          <div style={{ color: "#22c55e", fontSize: 14, padding: "24px 0", textAlign: "center" }}>
            ✓ No anomalies detected
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "#64748b", borderBottom: "1px solid #334155" }}>
                  {["Run", "Metric", "Flagged Value", "Baseline", "Deviation", "Severity"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", fontWeight: 500, fontSize: 12, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAnomalies.map((a: any, i: number) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid #0f172a", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#0f172a")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{a.run}</td>
                    <td style={{ padding: "10px 12px", color: "#94a3b8", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.metric}</td>
                    <td style={{ padding: "10px 12px", color: SEV_COLOR[a.severity], fontWeight: 600 }}>{a.flaggedValue}s</td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{a.baselineValue}s</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        color: a.deviationPct > 0 ? "#ef4444" : "#22c55e",
                        fontWeight: 600,
                        display: "flex", alignItems: "center", gap: 3,
                      }}>
                        <TrendingUp size={12} />
                        {a.deviationPct > 0 ? "+" : ""}{a.deviationPct}%
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <SeverityBadge severity={a.severity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}