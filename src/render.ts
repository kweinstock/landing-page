import type { Project } from "./types";

export const messages = {
  empty: "Nothing published yet. Check back soon.",
  error: "Project list is unavailable right now.",
} as const;

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!)
  );
}

/** Render a single informational row (empty state, load failure, etc.). */
export function renderMessage(list: HTMLElement, text: string): void {
  list.innerHTML = `<li><p class="project-title empty">${esc(text)}</p></li>`;
}

/** Link for a project: an explicit `url`, else a root-relative `/<path>/`. */
function href(p: Project): string {
  if (p.url) return p.url;
  if (!p.path) return "";
  return `/${p.path.replace(/^\/+|\/+$/g, "")}/`;
}

export function renderProjects(list: HTMLElement, items: Project[]): void {
  if (items.length === 0) {
    renderMessage(list, messages.empty);
    return;
  }

  list.innerHTML = items
    .map((p) => {
      const link = href(p);
      const title = link ? `<a href="${esc(link)}">${esc(p.name)}</a>` : esc(p.name);
      const note = p.note ? `<p class="project-note">${esc(p.note)}</p>` : "";
      return `<li><p class="project-title">${title}</p>${note}</li>`;
    })
    .join("");
}
