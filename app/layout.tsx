import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/ui/AppShell";

export const metadata: Metadata = {
  title: "CI Observability Dashboard",
  description: "Lightweight CI-Native Observability for GitHub Actions Runners",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9" }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}