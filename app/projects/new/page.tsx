"use client";
// /projects/new is now just for connecting a SECOND GitHub account with a different PAT.
// The primary flow is: /login (enter PAT) → /projects (pick repo).
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Just go back to projects — the repo picker is there
    router.replace("/projects");
  }, [router]);
  return null;
}
