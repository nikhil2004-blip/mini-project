// lib/github.ts

const BASE = "https://api.github.com";
const OWNER = process.env.GITHUB_OWNER!;
const REPO  = process.env.GITHUB_REPO!;
const TOKEN = process.env.GITHUB_TOKEN!;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GHStep {
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface GHJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string | null;
  steps: GHStep[];
  runner_name: string | null;
}

export interface GHRun {
  id: number;
  name: string;
  run_number: number;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  event: string;
  actor: { login: string; avatar_url: string };
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────

async function ghFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers, next: { revalidate: 30 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Get recent workflow runs (last 20) ────────────────────────────────────

export async function getWorkflowRuns(perPage = 20): Promise<GHRun[]> {
  const data = await ghFetch(
    `/repos/${OWNER}/${REPO}/actions/runs?per_page=${perPage}&exclude_pull_requests=false`
  );
  return data.workflow_runs ?? [];
}

// ─── Get jobs (with steps) for a single run ────────────────────────────────

export async function getRunJobs(runId: number): Promise<GHJob[]> {
  const data = await ghFetch(
    `/repos/${OWNER}/${REPO}/actions/runs/${runId}/jobs?per_page=30`
  );
  return data.jobs ?? [];
}

// ─── Compute step duration in seconds from ISO timestamps ──────────────────

export function stepDuration(step: GHStep): number {
  if (!step.started_at || !step.completed_at) return 0;
  return Math.round(
    (new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()) / 1000
  );
}

export function jobDuration(job: GHJob): number {
  if (!job.started_at || !job.completed_at) return 0;
  return Math.round(
    (new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000
  );
}

export function runDuration(run: GHRun): number {
  if (!run.created_at || !run.updated_at) return 0;
  return Math.round(
    (new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()) / 1000
  );
}

// ─── Map GitHub conclusion → our status ────────────────────────────────────

export function mapStatus(status: string, conclusion: string | null): "passed" | "failed" | "running" | "skipped" {
  if (status === "in_progress" || status === "queued" || status === "waiting") return "running";
  if (conclusion === "success") return "passed";
  if (conclusion === "failure" || conclusion === "timed_out") return "failed";
  if (conclusion === "skipped" || conclusion === "cancelled") return "skipped";
  return "running";
}

// ─── Anomaly detection logic ───────────────────────────────────────────────
// Takes array of durations (oldest first), returns anomaly if last value
// deviates > threshold% from the rolling average of previous N runs.

export interface Anomaly {
  metric: string;
  flaggedValue: number;
  baselineValue: number;
  deviationPct: number;
  severity: "critical" | "high" | "medium" | "low";
}

export function detectAnomalies(
  label: string,
  values: number[], // oldest → newest, last element is current run
  threshold = 15
): Anomaly | null {
  if (values.length < 3) return null;
  const history = values.slice(0, -1);
  const current = values[values.length - 1];
  if (current === 0) return null;

  const baseline = Math.round(history.reduce((a, v) => a + v, 0) / history.length);
  if (baseline === 0) return null;

  const devPct = Math.round(((current - baseline) / baseline) * 100);
  if (Math.abs(devPct) < threshold) return null;

  const severity: Anomaly["severity"] =
    Math.abs(devPct) >= 50 ? "critical" :
    Math.abs(devPct) >= 30 ? "high" :
    Math.abs(devPct) >= 20 ? "medium" : "low";

  return { metric: label, flaggedValue: current, baselineValue: baseline, deviationPct: devPct, severity };
}

// ─── Flakiness detection ───────────────────────────────────────────────────
// A job is flaky if it alternates pass/fail across recent runs

export function isFlakyPattern(conclusions: (string | null)[]): boolean {
  // Need at least 4 data points
  if (conclusions.length < 4) return false;
  const recent = conclusions.slice(-6); // look at last 6
  let switches = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] !== recent[i - 1] && recent[i] !== null && recent[i - 1] !== null) {
      switches++;
    }
  }
  return switches >= 2; // 2+ alternations = flaky
}