import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export interface ServerConfig {
  token: string;
  owner: string;
  repo: string;
}

export async function getServerConfig(req?: NextRequest): Promise<ServerConfig> {
  const cookieStore = await cookies();
  
  return {
    token: (cookieStore.get("gh_token")?.value ?? process.env.GITHUB_TOKEN ?? "").trim(),
    owner: (cookieStore.get("gh_owner")?.value ?? process.env.GITHUB_OWNER ?? "").trim(),
    repo:  (cookieStore.get("gh_repo")?.value  ?? process.env.GITHUB_REPO  ?? "").trim(),
  };
}
