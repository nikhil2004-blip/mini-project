import { NextRequest, NextResponse } from "next/server";
import { getServerConfig } from "@/lib/server-config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { token } = await getServerConfig(req);
    
    if (!token) {
      return NextResponse.json({ error: "Missing GitHub credentials." }, { status: 401 });
    }

    const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `GitHub API error ${res.status}: ${text}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch repositories" }, { status: 500 });
  }
}
