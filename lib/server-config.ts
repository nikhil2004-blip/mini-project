// lib/server-config.ts
// Reads GitHub credentials from request headers first, then falls back to env vars

import { NextRequest } from "next/server";

export interface ServerConfig {
  token: string;
  owner: string;
  repo: string;
}

export function getServerConfig(req: NextRequest): ServerConfig {
  return {
    token: req.headers.get("x-github-token") ?? process.env.GITHUB_TOKEN ?? "",
    owner: req.headers.get("x-github-owner") ?? process.env.GITHUB_OWNER ?? "",
    repo:  req.headers.get("x-github-repo")  ?? process.env.GITHUB_REPO  ?? "",
  };
}
