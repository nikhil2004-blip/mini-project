"use client";
// components/ui/AppShell.tsx
// Decides whether to show the Sidebar+guard or just the plain children based on the route

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import ConfigGuard from "./ConfigGuard";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Pages that don't need the sidebar or active project wrapper
  const noSidebarRoutes = ["/", "/login", "/projects", "/projects/new"];
  const isNoSidebar = noSidebarRoutes.includes(pathname);

  // No sidebar wrapper needed, just raw page
  if (isNoSidebar) {
    return <>{children}</>;
  }

  // Main app — sidebar + content, guarded by active project validation
  return (
    <ConfigGuard>
      <div style={{ display: "flex", minHeight: "100vh", overflow: "hidden" }}>
        <Sidebar />
        <main style={{
          flex: 1,
          padding: "2rem 2.5rem",
          overflowY: "auto",
          height: "100vh",
          background: "#0f172a",
        }}>
          {children}
        </main>
      </div>
    </ConfigGuard>
  );
}
