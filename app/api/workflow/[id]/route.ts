import { NextResponse } from "next/server";
import { getWorkflowRuns, getRunJobs, runDuration, jobDuration, stepDuration, mapStatus } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const runs = await getWorkflowRuns(20);
    const run = runs.find(r => String(r.id) === id);
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    const jobs = await getRunJobs(run.id);

    const enrichedJobs = jobs.map(job => ({
      id: job.id,
      name: job.name,
      status: mapStatus(job.status, job.conclusion),
      conclusion: job.conclusion,
      duration: jobDuration(job),
      runner: job.runner_name,
      steps: (job.steps ?? []).map(s => ({
        name: s.name,
        status: mapStatus(s.status, s.conclusion),
        conclusion: s.conclusion,
        duration: stepDuration(s),
        started_at: s.started_at,
        completed_at: s.completed_at,
      })),
    }));

    return NextResponse.json({
      id: String(run.id),
      runNumber: run.run_number,
      commitSha: run.head_sha.slice(0, 7),
      fullSha: run.head_sha,
      branch: run.head_branch,
      timestamp: run.created_at,
      status: mapStatus(run.status, run.conclusion),
      totalDuration: runDuration(run),
      htmlUrl: run.html_url,
      event: run.event,
      actor: run.actor,
      jobs: enrichedJobs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}