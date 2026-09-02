import { defineConfig } from "vite";
import { readFile } from "node:fs/promises";

// Project root is the repo root (index.html lives here).
// Files in public/ are copied to dist/ verbatim (projects.json is fetched at /projects.json).
// dist/ is what wrangler deploys as static assets.
export default defineConfig({
  // Single static page, no client-side routing: don't fall back to index.html.
  // Unknown paths (e.g. a project route with no server here) 404 instead.
  appType: "mpa",
  plugins: [
    {
      // Dev only: serve the styled 404.html (with a 404 status) for any path
      // that matched no file. Production does the same via Cloudflare
      // (wrangler.jsonc `not_found_handling`); `vite preview` does not.
      name: "serve-404-in-dev",
      apply: "serve",
      configureServer(server) {
        // Post hook: runs after static/module/public handling and after Vite's
        // HTML fallback (which rewrites the URL to an existing *.html, or leaves
        // it alone). So anything here that isn't an .html request went unmatched.
        return () => {
          server.middlewares.use(async (req, res, next) => {
            const path = (req.url ?? "/").split("?")[0];
            if (path.endsWith(".html")) return next();
            res.statusCode = 404;
            try {
              const html = await readFile("404.html", "utf8");
              res.setHeader("Content-Type", "text/html");
              res.end(await server.transformIndexHtml(req.url ?? "/", html));
            } catch {
              res.end("404 Not Found");
            }
          });
        };
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Both HTML entries. 404.html is served by Cloudflare for unmatched paths
    // (see wrangler.jsonc `not_found_handling`).
    rollupOptions: {
      input: ["index.html", "404.html"],
    },
  },
});
