"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getUser, setActiveProject, clearUser,
  saveProject, GithubProject, UserConfig,
  getProjects, removeProject,
} from "@/lib/client-config";
import {
  Plus, GitBranch, Clock, LogOut, Activity,
  Search, Lock, BookOpen, RefreshCw, ChevronRight,
} from "lucide-react";

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  private: boolean;
  description: string | null;
  updated_at: string;
  default_branch: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser]           = useState<UserConfig | null>(null);
  const [repos, setRepos]         = useState<GithubRepo[]>([]);
  const [pinned, setPinned]       = useState<GithubProject[]>([]);
  const [search, setSearch]       = useState("");
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [repoError, setRepoError]       = useState("");
  const [connecting, setConnecting]     = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
    setPinned(getProjects());

    // Fetch all repos from our local API using the HttpOnly token
    fetch("/api/repos")
      .then(r => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((data: GithubRepo[]) => setRepos(data))
      .catch(() => setRepoError("Could not load repositories. Your token may have expired."))
      .finally(() => setLoadingRepos(false));
  }, [router]);

  const handleSelectRepo = async (repo: GithubRepo) => {
    if (!user) return;
    setConnecting(repo.full_name);
    const projectId = repo.full_name;
    
    // Set active project on the server
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: repo.owner.login, repo: repo.name })
    });
    
    saveProject({ id: projectId, owner: repo.owner.login, repo: repo.name, addedAt: Date.now() });
    setActiveProject(projectId);
    router.push("/dashboard");
  };

  const handleUnpin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeProject(id);
    setPinned(prev => prev.filter(p => p.id !== id));
  };

  const handleLogout = () => { clearUser(); router.push("/"); };

  const filtered = repos.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid #1e293b", background: "#0f172a", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", borderRadius: 8, padding: 6, display: "flex" }}>
            <Activity size={16} color="#0f172a" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700 }}>CI Observer</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={user.avatar_url} alt={user.username} style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid #334155" }} />
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>@{user.username}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Disconnect GitHub account"
            style={{ background: "transparent", border: "1px solid #334155", borderRadius: 8, padding: "6px 10px", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", fontSize: 12 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            <LogOut size={13} /> Disconnect
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

        {/* ── Pinned / Previously Connected ── */}
        {pinned.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
              Previously Connected
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {pinned.map(p => (
                <button
                  key={p.id}
                  onClick={async () => { 
                    setActiveProject(p.id);
                    await fetch("/api/auth", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ owner: p.owner, repo: p.repo })
                    });
                    router.push("/dashboard"); 
                  }}
                  style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s", textAlign: "left", width: "100%", color: "#f1f5f9" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#818cf8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.id}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Added {new Date(p.addedAt).toLocaleDateString()}</div>
                  </div>
                  <ChevronRight size={14} color="#475569" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── All Repos header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            Choose a repository to monitor
          </h1>
          <span style={{ fontSize: 12, color: "#64748b" }}>{repos.length} repos loaded</span>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search size={14} color="#475569" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search by name or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", padding: "11px 12px 11px 34px", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = "#38bdf8"}
            onBlur={e => e.target.style.borderColor = "#334155"}
          />
        </div>

        {/* Repo list */}
        {loadingRepos && (
          <div style={{ textAlign: "center", padding: "64px 0", color: "#475569" }}>
            <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>Loading your repositories…</div>
          </div>
        )}

        {repoError && (
          <div style={{ background: "#450a0a", border: "1px solid #dc2626", borderRadius: 10, padding: "14px 18px", color: "#f87171", fontSize: 14, marginBottom: 16 }}>
            ⚠ {repoError} —{" "}
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", padding: 0, fontSize: 14 }}>
              Reconnect with a new token
            </button>
          </div>
        )}

        {!loadingRepos && !repoError && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 14 }}>
                No repositories match "{search}"
              </div>
            )}
            {filtered.map(repo => (
              <button
                key={repo.id}
                onClick={() => handleSelectRepo(repo)}
                disabled={!!connecting}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: connecting === repo.full_name ? "rgba(56,189,248,0.07)" : "#1e293b",
                  border: connecting === repo.full_name ? "1px solid #38bdf8" : "1px solid #334155",
                  borderRadius: 10, padding: "13px 16px",
                  cursor: connecting ? "default" : "pointer",
                  textAlign: "left", color: "#f1f5f9", width: "100%",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!connecting) { e.currentTarget.style.borderColor = "#818cf8"; e.currentTarget.style.background = "rgba(129,140,248,0.05)"; }}}
                onMouseLeave={e => { if (!connecting) { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.background = "#1e293b"; }}}
              >
                <div style={{ flexShrink: 0 }}>
                  {repo.private
                    ? <Lock size={16} color="#f59e0b" />
                    : <BookOpen size={16} color="#38bdf8" />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{repo.full_name}</span>
                    {repo.private && (
                      <span style={{ background: "#451a03", color: "#f59e0b", fontSize: 10, padding: "1px 6px", borderRadius: 999, fontWeight: 700 }}>
                        PRIVATE
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {repo.description}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                    <GitBranch size={10} /> {repo.default_branch}
                    <span style={{ margin: "0 4px" }}>·</span>
                    <Clock size={10} /> Updated {new Date(repo.updated_at).toLocaleDateString()}
                  </div>
                </div>
                {connecting === repo.full_name
                  ? <RefreshCw size={14} color="#38bdf8" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                  : <ChevronRight size={14} color="#475569" style={{ flexShrink: 0 }} />
                }
              </button>
            ))}
          </div>
        )}
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
