import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";

export const metadata: Metadata = {
  title: "CI Observability Dashboard",
  description: "Lightweight CI-Native Observability for GitHub Actions Runners",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: "flex", minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", overflow: "hidden" }}>
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
      </body>
    </html>
  );
}