"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveProject, getUser } from "@/lib/client-config";

export default function ConfigGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 1. Ensure User is logged in
    const user = getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    // 2. Ensure an Active Project is selected
    const active = getActiveProject();
    if (!active) {
      router.replace("/projects");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) return null; // Avoid hydration flash
  return <>{children}</>;
}
