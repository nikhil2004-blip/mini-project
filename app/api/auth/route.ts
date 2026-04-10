import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    
    if (body.token) {
      // Validate token using GitHub user endpoint to ensure it's functional
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${body.token.trim()}`,
          Accept: "application/vnd.github+json",
        },
      });
      
      if (!res.ok) {
        return NextResponse.json({ error: "Invalid token or unauthorized." }, { status: 401 });
      }
      
      const userData = await res.json();
      
      cookieStore.set("gh_token", body.token.trim(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      
      // We can optionally pass back GitHub user details to sync with UI state
      if (!body.owner && !body.repo) {
        return NextResponse.json({ success: true, user: userData });
      }
    }

    if (body.owner && body.repo) {
      cookieStore.set("gh_owner", body.owner, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      cookieStore.set("gh_repo", body.repo, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to authenticate" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("gh_token");
  cookieStore.delete("gh_owner");
  cookieStore.delete("gh_repo");
  return NextResponse.json({ success: true });
}
