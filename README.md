# kweinstock.dev landing page

Static landing page for `kweinstock.dev`. Vite + TypeScript + SCSS, deployed to
Cloudflare Workers static assets.

## Layout

| Path                | Purpose                                                        |
| ------------------- | ------------------------------------------------------------- |
| `index.html`        | Page shell (Vite entry)                                        |
| `404.html`          | Shown for any unmatched path (Vite entry; shares the stylesheet) |
| `src/`              | TypeScript modules and SCSS                                    |
| `public/`           | Copied to `dist/` verbatim; holds `projects.json`              |
| `dist/`             | Build output; what wrangler deploys (git-ignored)              |
| `wrangler.jsonc`    | Worker + custom domain config (`production` and `testing` env) |

`src/` separation:

- `projects.ts` — data fetch only
- `render.ts` — DOM rendering (builds each `/<path>/` link)
- `main.ts` — wiring

## Project links

Projects are **path-based**: `kweinstock.dev/chatbot/` is served by its own
Cloudflare Worker in its own repo (see [SETUP.md](SETUP.md)). This page only
renders the link.

Each `public/projects.json` entry is `{ "name", "path", "note" }`. The link is
just `/<path>/` — a root-relative URL, so it resolves against whatever host the
page is on with no configuration:

| Page served from | `example` link resolves to |
| --- | --- |
| `localhost:5173` | `localhost:5173/example/` |
| `testing.kweinstock.dev` | `testing.kweinstock.dev/example/` |
| `kweinstock.dev` | `kweinstock.dev/example/` |

Use `"url"` instead of `"path"` for a link off this site (e.g. a GitHub repo).

A path with nothing serving it returns a styled 404 (`404.html`) with a 404
status — in production via Cloudflare (`not_found_handling` in `wrangler.jsonc`),
and in `npm run dev` via a small plugin in `vite.config.ts`. `vite preview` is
the exception: it gives a bare 404.

## Scripts

```bash
npm run dev        # Vite dev server (HMR)
npm run build      # build to dist/
npm run preview    # serve dist/ locally
npm run typecheck  # tsc, no emit
npm run lint       # eslint + stylelint
npm run lint:fix   # eslint --fix + stylelint --fix
npm run deploy     # build + wrangler deploy (production)
```

## Deploy

Deploys run through Cloudflare Workers Builds. See [SETUP.md](SETUP.md). Set the
Workers Builds **build command** to `npm run build` and the **deploy command** to
`npx wrangler deploy` (production) or `npx wrangler deploy --env testing`.

## Adding a project

Run `../new-project/New Project.vbs` (see `../new-project/README.md`). Its GUI
scaffolds a sibling repo from the template, pushes to the GitHub repo you point
it at, and does the first deploy of both Workers. Afterwards, list it in
[public/projects.json](public/projects.json) and connect Workers Builds in the
Cloudflare dashboard. [SETUP.md](SETUP.md) explains the routing model behind it.
