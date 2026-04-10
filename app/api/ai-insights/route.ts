import { NextRequest, NextResponse } from "next/server";
import { getServerConfig } from "@/lib/server-config";
import { groqChat, buildCISummaryPrompt } from "@/lib/groq";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token } = await getServerConfig(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { runs, stats } = body;

    if (!runs || !stats) {
      return NextResponse.json({ error: "Missing runs or stats in request body" }, { status: 400 });
    }

    const prompt = buildCISummaryPrompt(runs, stats);
    if (prompt.length > 50000) {
      return NextResponse.json({ error: "Payload too large to analyze" }, { status: 413 });
    }

    const raw = await groqChat([
      { role: "system", content: "You are a CI/CD pipeline health analyst. Always respond with valid JSON only." },
      { role: "user",   content: prompt },
    ], 600);

    let parsed: any;
    try {
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        healthScore: null,
        status: "Unknown",
        summary: raw,
        topIssue: null,
        recommendations: [],
        raw,
      });
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
