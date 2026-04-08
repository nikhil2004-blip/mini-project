// lib/groq.ts — Groq API helper for AI-powered CI analysis

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama3-8b-8192"; // fast, free-tier friendly

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function groqChat(messages: GroqMessage[], maxTokens = 512): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set in environment");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.3, // low temp = factual, consistent
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "No response from AI.";
}

// ─── Build a structured CI summary for the AI prompt ─────────────────────────

export function buildCISummaryPrompt(runs: any[], stats: any): string {
  const anomalyCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  runs.forEach(r => r.anomalies?.forEach((a: any) => {
    if (a.severity in anomalyCounts) anomalyCounts[a.severity as keyof typeof anomalyCounts]++;
  }));

  const flakyJobNames: string[] = stats.flakyJobNames ?? [];
  const recentStatusPattern = runs.slice(0, 5).map((r: any) => r.status).join(", ");

  return `You are a CI/CD observability expert. Analyze this GitHub Actions pipeline data and give a concise, actionable health report.

PIPELINE: ${stats.repoInfo?.owner}/${stats.repoInfo?.repo}
RUNS ANALYZED: ${stats.total}
PASS RATE: ${stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}% (${stats.passed} passed, ${stats.failed} failed)
AVG DURATION: ${stats.avgDuration}s
RECENT STATUS PATTERN (newest first): [${recentStatusPattern}]

ANOMALIES DETECTED: ${stats.anomalyCount} total
  - Critical: ${anomalyCounts.critical}
  - High: ${anomalyCounts.high}
  - Medium: ${anomalyCounts.medium}
  - Low: ${anomalyCounts.low}

FLAKY JOBS: ${flakyJobNames.length > 0 ? flakyJobNames.join(", ") : "None detected"}
FLAKY RUNS: ${stats.flaky} of ${stats.total}

Respond in this exact JSON format (no markdown, no explanation outside JSON):
{
  "healthScore": <number 0-100>,
  "status": "<Healthy|Warning|Critical>",
  "summary": "<2 sentence plain English summary of CI health>",
  "topIssue": "<single most urgent thing to fix, or 'None' if healthy>",
  "recommendations": ["<action 1>", "<action 2>", "<action 3>"]
}`;
}
