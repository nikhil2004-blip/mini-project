// app/api/ai-insights/route.ts
import { NextResponse } from "next/server";
import { groqChat, buildCISummaryPrompt } from "@/lib/groq";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { runs, stats } = body;

    if (!runs || !stats) {
      return NextResponse.json({ error: "Missing runs or stats in request body" }, { status: 400 });
    }

    const prompt = buildCISummaryPrompt(runs, stats);

    const raw = await groqChat([
      { role: "system", content: "You are a CI/CD pipeline health analyst. Always respond with valid JSON only." },
      { role: "user",   content: prompt },
    ], 600);

    // Parse the JSON from Groq's response
    let parsed: any;
    try {
      // Strip markdown code fences if Groq wraps in ```json ... ```
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Return raw text if JSON parse fails
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
