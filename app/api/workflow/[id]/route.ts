import { NextRequest, NextResponse } from "next/server";
import { getServerConfig } from "@/lib/server-config";
import {
  getRunJobs, jobDuration, stepDuration, mapStatus
} from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { token, owner, repo } = await getServerConfig(req);
    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: "Missing GitHub credentials. Please connect your GitHub account." },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Invalid workflow run ID format" }, { status: 400 });
    }

    const creds = { token, owner, repo };
    const jobs = await getRunJobs(Number(id), creds);

    const enrichedJobs = jobs.map(job => ({
      id: job.id,
      name: job.name,
      status: mapStatus(job.status, job.conclusion),
      duration: jobDuration(job),
      steps: (job.steps ?? []).map(s => ({
        name: s.name,
        status: mapStatus(s.status, s.conclusion),
        duration: stepDuration(s),
        conclusion: s.conclusion,
      })),
    }));

    return NextResponse.json({ jobs: enrichedJobs });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch workflow jobs" },
      { status: 500 }
    );
  }
}