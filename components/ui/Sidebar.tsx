"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GitBranch, AlertTriangle, Zap, Activity } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workflow", label: "Workflows", icon: GitBranch },
  { href: "/anomalies", label: "Anomalies", icon: AlertTriangle },
  { href: "/flakiness", label: "Flakiness", icon: Zap },
];

export default function Sidebar() {
  const path = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <aside style={{
      width: 240,
      minWidth: 240,
      background: "#1e293b",
      borderRight: "1px solid #334155",
      display: "flex",
      flexDirection: "column",
      padding: "1.5rem 1rem",
      gap: 4,
      height: "100vh",
      position: "sticky",
      top: 0,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: "1.75rem", padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{
            background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
            borderRadius: 8,
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Activity size={16} color="#0f172a" />
          </div>
          <span style={{
            fontSize: 16,
            fontWeight: 700,
            background: "linear-gradient(135deg, #38bdf8, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.3px",
          }}>CI Observer</span>
        </div>
        <div style={{ fontSize: 11, color: "#475569", paddingLeft: 4 }}>MSRIT Mini Project</div>
      </div>

      {/* Nav links */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href);
          const isHovered = hovered === href;

          return (
            <Link
              key={href}
              href={href}
              onMouseEnter={() => setHovered(href)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                textDecoration: "none",
                background: active
                  ? "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(129,140,248,0.10))"
                  : isHovered
                    ? "rgba(255,255,255,0.04)"
                    : "transparent",
                color: active ? "#38bdf8" : isHovered ? "#cbd5e1" : "#94a3b8",
                fontWeight: active ? 600 : 400,
                fontSize: 13.5,
                borderLeft: active ? "2px solid #38bdf8" : "2px solid transparent",
                transition: "all 0.15s ease",
                position: "relative",
              }}
            >
              <Icon
                size={16}
                style={{
                  color: active ? "#38bdf8" : isHovered ? "#cbd5e1" : "#64748b",
                  transition: "color 0.15s",
                  flexShrink: 0,
                }}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #334155" }}>
        <div style={{ fontSize: 11, color: "#334155", textAlign: "center" }}>
          GitHub Actions API v2022-11-28
        </div>
      </div>
    </aside>
  );
}