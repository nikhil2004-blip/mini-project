"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Clock, User, ExternalLink, RefreshCw, GitCommit, Tag } from "lucide-react";
import { authHeaders } from "@/lib/client-config";

const STATUS_MAP: Record<string, { bg: string; color: string; dot: string }> = {
  passed:  { bg: "#14532d", color: "#22c55e", dot: "#22c55e" },
  failed:  { bg: "#450a0a", color: "#ef4444", dot: "#ef4444" },
  running: { bg: "#1e3a5f", color: "#38bdf8", dot: "#38bdf8" },
  skipped: { bg: "#1e293b", color: "#64748b", dot: "#64748b" },
};

export default function WorkflowPage() {
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
      <strong>GitHub API Error:</strong> {error}
      <p style={{ color: "#94a3b8", marginTop: 8, fontSize: 13 }}>
        Check your <code>.env.local</code> — make sure GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO are set correctly and the token has <code>repo</code> scope.
      </p>
    </div>
  );

  if (loading && !data) return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#64748b", paddingTop: 40 }}>
      <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      Fetching workflows from GitHub...
    </div>
  );

  const { runs, stats } = data;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 4 }}>Workflow Runs</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            <strong style={{ color: "#94a3b8" }}>{stats.repoInfo.owner}/{stats.repoInfo.repo}</strong> · last {runs.length} runs
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={load}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: "1px solid #334155",
              borderRadius: 8, color: "#94a3b8", padding: "8px 14px",
              cursor: "pointer", fontSize: 13,
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
          <a
            href={`https://github.com/${stats.repoInfo.owner}/${stats.repoInfo.repo}/actions`}
            target="_blank" rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 6, color: "#38bdf8",
              fontSize: 13, textDecoration: "none", padding: "8px 14px",
              border: "1px solid #334155", borderRadius: 8,
            }}
          >
            <ExternalLink size={13} /> View on GitHub
          </a>
        </div>
      </div>

      {/* Runs list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {runs.map((run: any) => {
          const st = STATUS_MAP[run.status] ?? STATUS_MAP.skipped;
          return (
            <Link key={run.id} href={`/workflow/${run.id}`} style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 12,
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  cursor: "pointer",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#38bdf8";
                  e.currentTarget.style.boxShadow = "0 0 0 1px #38bdf820";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#334155";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Status dot + badge */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 70 }}>
                  <span style={{
                    padding: "4px 0", borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: st.bg, color: st.color, width: "100%", textAlign: "center",
                  }}>{run.status}</span>
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 5, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    Run #{run.runNumber}
                    {run.flaky && (
                      <span style={{ fontSize: 10, color: "#fb923c", background: "#431407", padding: "2px 8px", borderRadius: 99 }}>
                        ⚡ FLAKY
                      </span>
                    )}
                    {run.anomalies?.length > 0 && (
                      <span style={{ fontSize: 10, color: "#f59e0b", background: "#451a03", padding: "2px 8px", borderRadius: 99 }}>
                        ⚠ {run.anomalies.length} anomaly
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, color: "#64748b" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <GitBranch size={11} /> {run.branch}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <GitCommit size={11} />
                      <code style={{ fontSize: 11 }}>{run.commitSha}</code>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <User size={11} /> {run.actor?.login}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Tag size={11} /> {run.event}
                    </span>
                  </div>
                </div>

                {/* Duration + date */}
                <div style={{ textAlign: "right", color: "#94a3b8", fontSize: 13, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginBottom: 3 }}>
                    <Clock size={12} />
                    <span>{run.totalDuration > 0 ? `${run.totalDuration}s` : "—"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#475569" }}>
                    {new Date(run.timestamp).toLocaleDateString()} {new Date(run.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}