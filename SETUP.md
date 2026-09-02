# Deploy and project workflow

Deploys run through Cloudflare Workers Builds. No API tokens, no GitHub secrets.
Each Worker has its own build connection that watches one branch and runs one
deploy command.

## Routing model

Projects are **path-based**. One hostname, split by URL path across independent
Workers:

```
kweinstock.dev/                    -> landing-page Worker (this repo)
kweinstock.dev/projects.json       -> landing-page Worker
kweinstock.dev/myproject/*         -> myproject Worker    (its own repo)
kweinstock.dev/*  (anything else)  -> landing-page Worker

testing.kweinstock.dev/            -> landing-page-testing Worker
testing.kweinstock.dev/myproject/* -> myproject-testing Worker
```

Cloudflare routes each request by URL before it reaches any Worker; the most
specific route pattern wins, so `/myproject/*` goes to that project and
everything else falls through to the landing page. A route on a subpath takes
precedence over the landing page's Custom Domain on the same hostname, so adding
projects needs no change to this repo.

## Branch model

Every project (and this repo) has two Workers built from the same repo:

| Branch    | Worker         | Deploy command                      | Serves                              |
| --------- | -------------- | ----------------------------------- | ----------------------------------- |
| `main`    | `name`         | `npx wrangler deploy`               | `kweinstock.dev/name/`              |
| `testing` | `name-testing` | `npx wrangler deploy --env testing` | `testing.kweinstock.dev/name/`      |

Worker names and route patterns come from `wrangler.jsonc`. The branch and the
deploy command are set in each Worker's Workers Builds settings.

## This repo

- `kweinstock.dev` is the `landing-page` Worker, built from `main`. It keeps a
  Custom Domain on the apex and serves everything not claimed by a project route.
- `testing.kweinstock.dev` is `landing-page-testing`, built from `testing`
  (the `env.testing` section in `wrangler.jsonc`).

The page is built with Vite (`npm run build`) to `dist/`, which is what wrangler
deploys. `index.html` and `src/` are the source; `public/` holds files copied
verbatim into the build (currently just `projects.json`).

Any path that isn't a file here and isn't claimed by a project route is served
`404.html` with a 404 status (`assets.not_found_handling` in `wrangler.jsonc`).

### Connect the builds (once per Worker)

For each of `landing-page` and `landing-page-testing`:

1. Cloudflare dashboard, Workers and Pages, open the Worker.
2. Settings, Builds, Connect to a Git repository, pick `kweinstock/landing-page`.
3. Set:
   - Build branch: `main` for `landing-page`, `testing` for `landing-page-testing`
   - Build command: `npm run build` (Vite emits `dist/`, which wrangler deploys)
   - Deploy command:
     - `landing-page`: `npx wrangler deploy`
     - `landing-page-testing`: `npx wrangler deploy --env testing`
   - Build variables: none.
4. Save.

After that, a push to `main` deploys the live site and a push to `testing`
deploys the testing site.

Create the testing branch once:

```
git branch testing
git push -u origin testing
```

## Adding a project

Each project is its own repo with two Workers, serving `kweinstock.dev/name/`
and `testing.kweinstock.dev/name/`.

### 1. wrangler.jsonc

```jsonc
{
  "name": "myproject",
  "compatibility_date": "2026-08-31",
  "assets": { "directory": "./dist" }, // build output (see step 2)
  "routes": [
    { "pattern": "kweinstock.dev/myproject/*", "zone_name": "kweinstock.dev" }
  ],
  "env": {
    "testing": {
      "name": "myproject-testing",
      "routes": [
        { "pattern": "testing.kweinstock.dev/myproject/*", "zone_name": "kweinstock.dev" }
      ]
    }
  }
}
```

Route patterns, not `custom_domain`. They attach to the existing
`kweinstock.dev` / `testing.kweinstock.dev` records — **no new DNS record or
certificate per project**.

Dynamic project: add a `main` entry pointing at the Worker script instead of (or
alongside) `assets`.

### 2. Build under the path prefix

The project must serve its assets from `/myproject/`, not `/`:

- Vite: `base: "/myproject/"` in `vite.config.ts`
- Other build tools: the equivalent public-path / base-href option
- Dynamic Worker: strip the `/myproject` prefix when routing

A client-side router needs the same base, and asset serving needs a not-found
fallback within the prefix (`/myproject/* -> /myproject/index.html`). With Vite's
static assets, set `"not_found_handling": "single-page-application"` under
`assets` in `wrangler.jsonc`.

### 3. Branches

```
git push -u origin main
git branch testing && git push -u origin testing
```

### 4. Connect Workers Builds twice

Create two Workers, `myproject` and `myproject-testing`, and connect each to the
repo: `myproject` watches `main` with `npx wrangler deploy`, `myproject-testing`
watches `testing` with `npx wrangler deploy --env testing`. Set the build command
if the project has a build step.

### 5. First deploy

`kweinstock.dev` and `testing.kweinstock.dev` are already proxied on Cloudflare
(this repo's Custom Domains), so a project's routes attach on the first deploy
with nothing to do by hand. If that first deploy fails on permissions, run it
once from your machine with `npx wrangler deploy` (or `--env testing`) while
logged in, then let Workers Builds take over.

### 6. List it on the landing page

Edit `public/projects.json` in this repo:

```json
{
  "name": "My Project",
  "path": "myproject",
  "note": "One line on what it is."
}
```

The landing page links to `/myproject/` — a root-relative URL, so it resolves the
same on production, testing, and local (`kweinstock.dev/myproject/`,
`testing.kweinstock.dev/myproject/`, `localhost:5173/myproject/`). For a link off
this site, use `"url": "https://…"` instead of `"path"`.

Push to `main`. The list updates on the next landing page deploy. Order in the
file is the display order. Remove an entry to delist.
