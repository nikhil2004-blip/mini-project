// lib/github.ts — credential-aware GitHub API helper

const BASE = "https://api.github.com";

// Credentials are passed per-call so any user can connect their own repo
export interface GithubCreds {
  token: string;
  owner: string;
  repo: string;
}

// Fallback to env vars for local/server-only deployments
export function envCreds(): GithubCreds {
  return {
    token: process.env.GITHUB_TOKEN ?? "",
    owner: process.env.GITHUB_OWNER ?? "",
    repo:  process.env.GITHUB_REPO  ?? "",
  };
}

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

function makeHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function ghFetch(path: string, creds: GithubCreds) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: makeHeaders(creds.token),
      next: { revalidate: 30 },
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API ${res.status}: ${text}`);
    }
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

// ─── Get recent workflow runs ────────────────────────────────────────────────

export async function getWorkflowRuns(perPage = 20, creds?: GithubCreds): Promise<GHRun[]> {
  const c = creds ?? envCreds();
  const data = await ghFetch(
    `/repos/${c.owner}/${c.repo}/actions/runs?per_page=${perPage}&exclude_pull_requests=false`,
    c
  );
  return data.workflow_runs ?? [];
}

// ─── Get jobs (with steps) for a single run ─────────────────────────────────

export async function getRunJobs(runId: number, creds?: GithubCreds): Promise<GHJob[]> {
  const c = creds ?? envCreds();
  const data = await ghFetch(
    `/repos/${c.owner}/${c.repo}/actions/runs/${runId}/jobs?per_page=30`,
    c
  );
  return data.jobs ?? [];
}

// ─── Duration helpers ────────────────────────────────────────────────────────

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

// ─── Map GitHub conclusion → our status ─────────────────────────────────────

export function mapStatus(status: string, conclusion: string | null): "passed" | "failed" | "running" | "skipped" {
  if (status === "in_progress" || status === "queued" || status === "waiting") return "running";
  if (conclusion === "success") return "passed";
  if (conclusion === "failure" || conclusion === "timed_out") return "failed";
  if (conclusion === "skipped" || conclusion === "cancelled") return "skipped";
  return "running";
}

// ─── Anomaly detection ────────────────────────────────────────────────────────

export interface Anomaly {
  metric: string;
  flaggedValue: number;
  baselineValue: number;
  deviationPct: number;
  severity: "critical" | "high" | "medium" | "low";
}

export function detectAnomalies(
  label: string,
  values: number[],
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

// ─── Flakiness detection ──────────────────────────────────────────────────────

export function isFlakyPattern(conclusions: (string | null)[]): boolean {
  // Only consider true pass/fail outcomes for flakiness
  const outcomes = conclusions
    .filter(c => c === "success" || c === "failure" || c === "timed_out")
    .slice(0, 30);
  
  if (outcomes.length < 3) return false;
  
  let switches = 0;
  for (let i = 1; i < outcomes.length; i++) {
    if (outcomes[i] !== outcomes[i - 1]) {
      switches++;
    }
  }
  return switches >= 2;
}