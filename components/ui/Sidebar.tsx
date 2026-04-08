"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, GitBranch, AlertTriangle, Zap, Activity, LogOut, ArrowLeftRight, X } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getActiveProject, removeProject, clearActiveProject, GithubProject } from "@/lib/client-config";

const links = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/workflow",  label: "Workflows",  icon: GitBranch },
  { href: "/anomalies", label: "Anomalies",  icon: AlertTriangle },
  { href: "/flakiness", label: "Flakiness",  icon: Zap },
];

export default function Sidebar() {
  const path   = usePathname();
  const router = useRouter();
  const [hovered, setHovered]           = useState<string | null>(null);
  const [project, setProject]           = useState<GithubProject | null>(null);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [mounted, setMounted]           = useState(false);

  useEffect(() => {
    setMounted(true);
    setProject(getActiveProject());
  }, [path]);

  const handleDisconnect = () => {
    if (project) {
      removeProject(project.id);
      setShowDisconnect(false);
      router.push("/projects");
    }
  };

  const handleSwitchProject = () => {
    clearActiveProject();
    router.push("/projects");
  };

  return (
    <>
      <aside style={{
        width: 220, minWidth: 220,
        background: "#1e293b",
        borderRight: "1px solid #334155",
        display: "flex", flexDirection: "column",
        padding: "1.25rem 0.875rem",
        height: "100vh", position: "sticky", top: 0,
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: "1.5rem", padding: "0 4px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
              borderRadius: 8, padding: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Activity size={16} color="#0f172a" />
            </div>
            <span style={{ fontSize: "1rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em" }}>
              CI Observer
            </span>
          </div>
        </div>

        {/* Nav Links — scrollable middle section */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0 }}>
          {links.map((link) => {
            const isActive  = path === link.href || path.startsWith(`${link.href}/`);
            const Icon      = link.icon;
            const isHovered = hovered === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHovered(link.href)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8,
                  textDecoration: "none", fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#38bdf8" : isHovered ? "#e2e8f0" : "#94a3b8",
                  background: isActive
                    ? "rgba(56,189,248,0.1)"
                    : isHovered ? "rgba(255,255,255,0.04)" : "transparent",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — active project + controls */}
        {project && (
          <div style={{
            flexShrink: 0,
            borderTop: "1px solid #334155",
            paddingTop: 14,
            marginTop: 12,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            {/* Active env badge */}
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 2, fontWeight: 700, padding: "0 2px" }}>
              Active Environment
            </div>
            <div style={{
              background: "#0f172a", border: "1px solid #334155",
              padding: "9px 10px", borderRadius: 8,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", flexShrink: 0, boxShadow: "0 0 6px rgba(16,185,129,0.5)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#f1f5f9", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {project.owner}/{project.repo}
                </div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Connected</div>
              </div>
            </div>

            {/* Action buttons — VERTICAL stack, no overlap */}
            <button
              onClick={handleSwitchProject}
              style={{
                background: "transparent", border: "1px solid #334155",
                color: "#cbd5e1", padding: "9px 10px", borderRadius: 8,
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "#475569"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#334155"; }}
            >
              <ArrowLeftRight size={13} />
              Switch Project
            </button>

            <button
              onClick={() => setShowDisconnect(true)}
              style={{
                background: "transparent", border: "1px solid #334155",
                color: "#ef4444", padding: "9px 10px", borderRadius: 8,
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.borderColor = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#334155"; }}
            >
              <LogOut size={13} />
              Remove Repo
            </button>
          </div>
        )}
      </aside>

      {/* ── Disconnect Modal — rendered in a Portal so it's NEVER clipped by the sidebar ── */}
      {mounted && showDisconnect && createPortal(
        <div
          onClick={() => setShowDisconnect(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#1e293b", border: "1px solid #334155",
              borderRadius: 16, padding: 28, width: 380,
              boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                Remove Repository
              </h3>
              <button
                onClick={() => setShowDisconnect(false)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: 4, borderRadius: 4, display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 24px", lineHeight: 1.6 }}>
              Remove <strong style={{ color: "#f1f5f9" }}>{project?.owner}/{project?.repo}</strong> from your dashboard? You can re-add it anytime from the Projects page.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowDisconnect(false)}
                style={{
                  flex: 1, padding: "12px", background: "transparent",
                  border: "1px solid #334155", borderRadius: 10,
                  color: "#cbd5e1", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                style={{
                  flex: 1, padding: "12px",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  border: "none", borderRadius: 10,
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Remove It
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}