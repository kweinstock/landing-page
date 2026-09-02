import type { Project } from "./types";

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/projects.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}