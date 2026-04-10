// lib/client-config.ts
// Manages GitHub sessions and project configs in localStorage

export interface UserConfig {
  username: string;   // GitHub login
  name: string;       // Display name
  avatar_url: string; // GitHub avatar
}

export interface GithubProject {
  id: string;         // owner/repo
  owner: string;
  repo: string;
  addedAt: number;
}

const USER_KEY           = "ci_observer_user";
const PROJECTS_KEY       = "ci_observer_projects";
const ACTIVE_PROJECT_KEY = "ci_observer_active_project";

// ─── User ────────────────────────────────────────────────────────────────────

export function getUser(): UserConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveUser(user: UserConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(ACTIVE_PROJECT_KEY);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function getProjects(): GithubProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveProject(project: GithubProject): void {
  if (typeof window === "undefined") return;
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx >= 0) projects[idx] = project;
  else projects.push(project);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function removeProject(id: string): void {
  if (typeof window === "undefined") return;
  const projects = getProjects().filter(p => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  if (localStorage.getItem(ACTIVE_PROJECT_KEY) === id) {
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }
}

// ─── Active Project ───────────────────────────────────────────────────────────

export function getActiveProject(): GithubProject | null {
  if (typeof window === "undefined") return null;
  const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
  if (!activeId) return null;
  return getProjects().find(p => p.id === activeId) || null;
}

export function setActiveProject(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function clearActiveProject(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_PROJECT_KEY);
}

