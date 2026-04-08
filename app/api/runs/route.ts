import { NextRequest, NextResponse } from "next/server";
import { getServerConfig } from "@/lib/server-config";
import {
  getWorkflowRuns, getRunJobs,
  runDuration, jobDuration, stepDuration,
  mapStatus, detectAnomalies, isFlakyPattern, Anomaly
} from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { token, owner, repo } = getServerConfig(req);
    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: "Missing GitHub credentials. Please connect your GitHub account on the setup page." },
        { status: 401 }
      );
    }

    const creds = { token, owner, repo };
    // Fetch up to 30 most recent runs for good anomaly baseline
    const ghRuns = await getWorkflowRuns(30, creds);

    // Fetch jobs for each run in parallel
    const jobsPerRun = await Promise.all(
      ghRuns.map(run => getRunJobs(run.id, creds).catch(() => []))
    );

    // Build duration history per job name for anomaly detection
    const jobDurationHistory: Record<string, number[]> = {};

    const enrichedRuns = ghRuns.map((run, idx) => {
      const jobs = jobsPerRun[idx];
      const totalDur = runDuration(run);

      jobs.forEach(job => {
        const dur = jobDuration(job);
        if (!jobDurationHistory[job.name]) jobDurationHistory[job.name] = [];
        jobDurationHistory[job.name].push(dur);
      });

      const scannerKeywords = ["semgrep", "trivy", "gitleaks", "sast", "sca", "secret", "container"];
      const findings = jobs
        .filter(j => scannerKeywords.some(k => j.name.toLowerCase().includes(k)))
        .map(j => ({
          scanner: j.name,
          critical: 0, high: 0, medium: 0, low: 0,
          status: mapStatus(j.status, j.conclusion),
        }));

      const steps = jobs.flatMap(job =>
        (job.steps ?? []).map(s => ({
          name: s.name,
          jobName: job.name,
          duration: stepDuration(s),
          status: mapStatus(s.status, s.conclusion),
          conclusion: s.conclusion,
        }))
      );

      return {
        id: String(run.id),
        runNumber: run.run_number,
        commitSha: run.head_sha.slice(0, 7),
        branch: run.head_branch,
        timestamp: run.created_at,
        status: mapStatus(run.status, run.conclusion),
        totalDuration: totalDur,
        htmlUrl: run.html_url,
        actor: run.actor,
        event: run.event,
        jobCount: jobs.length,
        steps,
        findings,
        anomalies: [] as Anomaly[],
        flaky: false,
      };
    });

    // Compute anomalies
    enrichedRuns.forEach((run, idx) => {
      const jobs = jobsPerRun[idx];
      const anomalies: Anomaly[] = [];

      jobs.forEach(job => {
        const history = jobDurationHistory[job.name];
        if (history && history.length > 1) {
          const a = detectAnomalies(`${job.name} duration`, history.slice(0, idx + 1));
          if (a) anomalies.push(a);
        }
      });

      const runDurs = enrichedRuns.slice(0, idx + 1).map(r => r.totalDuration).filter(d => d > 0);
      const runAnomaly = detectAnomalies("Total run duration", runDurs);
      if (runAnomaly) anomalies.push(runAnomaly);

      run.anomalies = anomalies;
    });

    // Compute flakiness
    const jobConclusions: Record<string, (string | null)[]> = {};
    jobsPerRun.forEach(jobs => {
      jobs.forEach(job => {
        if (!jobConclusions[job.name]) jobConclusions[job.name] = [];
        jobConclusions[job.name].push(job.conclusion);
      });
    });

    const flakyJobNames = new Set(
      Object.entries(jobConclusions)
        .filter(([, conclusions]) => isFlakyPattern(conclusions))
        .map(([name]) => name)
    );

    enrichedRuns.forEach((run, idx) => {
      const jobs = jobsPerRun[idx];
      run.flaky = jobs.some(j => flakyJobNames.has(j.name));
    });

    const stats = {
      total: enrichedRuns.length,
      passed: enrichedRuns.filter(r => r.status === "passed").length,
      failed: enrichedRuns.filter(r => r.status === "failed").length,
      running: enrichedRuns.filter(r => r.status === "running").length,
      flaky: enrichedRuns.filter(r => r.flaky).length,
      avgDuration: Math.round(
        enrichedRuns.filter(r => r.totalDuration > 0)
          .reduce((a, r) => a + r.totalDuration, 0) /
        (enrichedRuns.filter(r => r.totalDuration > 0).length || 1)
      ),
      anomalyCount: enrichedRuns.reduce((a, r) => a + r.anomalies.length, 0),
      flakyJobNames: Array.from(flakyJobNames),
      repoInfo: { owner, repo },
    };

    return NextResponse.json({ runs: enrichedRuns, stats });
  } catch (err: any) {
    console.error("GitHub API error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to fetch from GitHub" },
      { status: 500 }
    );
  }
}