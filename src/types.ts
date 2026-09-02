export interface Project {
  name: string;
  /** Path under the site root: "chatbot" links to /chatbot/ (its own Worker). */
  path?: string;
  /** Explicit URL. Overrides `path`; use for links off this site (repos, etc.). */
  url?: string;
  note?: string;
}
