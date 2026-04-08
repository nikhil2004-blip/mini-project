import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/ui/AppShell";

export const metadata: Metadata = {
  title: "VoidWatch | Intelligent CI Observability",
  description: "Monitor, analyze, and optimize your GitHub Actions with real-time AI-driven insights and anomaly detection.",
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