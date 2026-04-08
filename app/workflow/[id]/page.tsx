"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ExternalLink, CheckCircle, XCircle, Clock,
  Loader, ChevronDown, ChevronRight, RefreshCw, GitBranch, GitCommit, User, Tag
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

function StatusIcon({ status }: { status: string }) {
  if (status === "passed") return <CheckCircle size={14} color="#22c55e" style={{ flexShrink: 0 }} />;
  if (status === "failed") return <XCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />;
  if (status === "skipped") return <span style={{ fontSize: 12, color: "#475569", flexShrink: 0 }}>—</span>;
  return <Loader size={14} color="#38bdf8" style={{ flexShrink: 0, animation: "spin 1s linear infinite" }} />;
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
    <span style={{ padding: "3px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function JobRow({ job }: { job: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
      {/* Job header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 18px",
          background: "#0f172a",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 0.1s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#162032")}
        onMouseLeave={e => (e.currentTarget.style.background = "#0f172a")}
      >
        {expanded
          ? <ChevronDown size={14} color="#64748b" style={{ flexShrink: 0 }} />
          : <ChevronRight size={14} color="#64748b" style={{ flexShrink: 0 }} />
        }
        <StatusIcon status={job.status} />
        <span style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", flex: 1 }}>{job.name}</span>
        {job.runner && (
          <span style={{ fontSize: 11, color: "#475569", marginRight: 12 }}>{job.runner}</span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#64748b", fontSize: 12 }}>
          <Clock size={11} /> {job.duration > 0 ? `${job.duration}s` : "—"}
        </span>
      </button>

      {/* Steps (expandable) */}
      {expanded && (
        <div style={{ background: "#111827" }}>
          {job.steps.length === 0 ? (
            <div style={{ padding: "12px 20px 12px 46px", color: "#475569", fontSize: 13 }}>No steps recorded</div>
          ) : (
            job.steps.map((step: any, si: number) => (
              <div
                key={si}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 20px 9px 46px",
                  borderTop: "1px solid #1e293b",
                  background: step.status === "failed" ? "#1a0707" : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <StatusIcon status={step.status} />
                <span style={{
                  flex: 1, fontSize: 13,
                  color: step.status === "failed" ? "#fca5a5" : step.status === "skipped" ? "#475569" : "#cbd5e1",
                  lineHeight: 1.4,
                }}>
                  {step.name}
                </span>
                <span style={{ fontSize: 12, color: "#475569", flexShrink: 0 }}>
                  {step.duration > 0 ? `${step.duration}s` : "—"}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/workflow/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setRun(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (error) return (
    <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: 12, padding: 20, color: "#ef4444" }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Error loading run</div>
      {error}
    </div>
  );

  if (loading || !run) return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#64748b", paddingTop: 40 }}>
      <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
      Loading run details...
    </div>
  );

  const stepChartData = run.jobs
    .flatMap((job: any) =>
      job.steps
        .filter((s: any) => s.duration > 0)
        .map((s: any) => ({
          name: s.name.length > 28 ? s.name.slice(0, 28) + "…" : s.name,
          duration: s.duration,
          status: s.status,
        }))
    )
    .sort((a: any, b: any) => b.duration - a.duration)
    .slice(0, 15); // top 15 slowest steps

  return (
    <div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <Link href="/workflow" style={{
          color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontSize: 13,
          padding: "6px 12px", border: "1px solid #334155", borderRadius: 8,
        }}>
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          Run #{run.runNumber}
          <code style={{ fontFamily: "monospace", fontSize: 13, color: "#64748b", fontWeight: 400, background: "#0f172a", padding: "2px 8px", borderRadius: 6 }}>
            {run.commitSha}
          </code>
        </h1>
        <StatusBadge status={run.status} />
        <a
          href={run.htmlUrl} target="_blank" rel="noreferrer"
          style={{ marginLeft: "auto", color: "#38bdf8", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: "1px solid #334155", borderRadius: 8 }}
        >
          <ExternalLink size={12} /> View on GitHub
        </a>
      </div>

      {/* Meta cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { icon: GitBranch, label: "Branch",   value: run.branch },
          { icon: Tag,       label: "Event",    value: run.event },
          { icon: User,      label: "Actor",    value: run.actor?.login },
          { icon: Clock,     label: "Duration", value: `${run.totalDuration}s` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{
            background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b", marginBottom: 6 }}>
              <Icon size={11} /> {label}
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Step duration chart (horizontal bar) */}
      {stepChartData.length > 0 && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>Slowest Steps</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "#475569" }}>Step duration breakdown (seconds)</p>
          <ResponsiveContainer width="100%" height={Math.max(200, stepChartData.length * 28)}>
            <BarChart data={stepChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#475569" fontSize={11} tick={{ fill: "#64748b" }} />
              <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} width={200} tick={{ fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`${v}s`, "Duration"]}
              />
              <Bar dataKey="duration" radius={[0, 4, 4, 0]}>
                {stepChartData.map((entry: any, i: number) => (
                  <Cell
                    key={i}
                    fill={entry.status === "failed" ? "#ef4444" : entry.status === "skipped" ? "#334155" : "#38bdf8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Jobs (expandable) */}
      <div>
        <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>
          Jobs ({run.jobs.length})
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {run.jobs.map((job: any) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}