# Deploy and project workflow

Deploys run through Cloudflare Workers Builds. No API tokens, no GitHub secrets.
Each Worker has its own build connection that watches one branch and runs one
deploy command.

## Branch model

Every project has two Workers built from the same repo:

| Branch    | Worker              | Deploy command                 | Domain                          |
| --------- | ------------------- | ------------------------------ | ------------------------------- |
| `main`    | `name`              | `npx wrangler deploy`          | `name.kweinstock.dev`           |
| `testing` | `name-testing`      | `npx wrangler deploy --env testing` | `testing.name.kweinstock.dev` |

The two domains and Worker names come from `wrangler.jsonc`. The branch and the
deploy command are set in each Worker's Workers Builds settings.

## This repo

- `kweinstock.dev` is the `landing-page` Worker, built from `main`.
- `testing.kweinstock.dev` is `landing-page-testing`, built from `testing`
  (the `env.testing` section in `wrangler.jsonc`).

Static files live in `public/`.

### Connect the builds (once per Worker)

For each of `landing-page` and `landing-page-testing`:

1. Cloudflare dashboard, Workers and Pages, open the Worker.
2. Settings, Builds, Connect to a Git repository, pick `kweinstock/landing-page`.
3. Set:
   - Build branch: `main` for `landing-page`, `testing` for `landing-page-testing`
   - Build command: leave empty
   - Deploy command:
     - `landing-page`: `npx wrangler deploy`
     - `landing-page-testing`: `npx wrangler deploy --env testing`
4. Save.

After that, a push to `main` deploys the live site and a push to `testing`
deploys the testing site.

Create the testing branch once:

```
git branch testing
git push -u origin testing
```

## Adding a project

Each project is its own repo with two Workers, on `name.kweinstock.dev` and
`testing.name.kweinstock.dev`.

### 1. wrangler.jsonc

```jsonc
{
  "name": "myproject",
  "compatibility_date": "2026-08-31",
  "assets": { "directory": "./public" }, // or a build output dir
  "routes": [
    { "pattern": "myproject.kweinstock.dev", "custom_domain": true }
  ],
  "env": {
    "testing": {
      "name": "myproject-testing",
      "routes": [
        { "pattern": "testing.myproject.kweinstock.dev", "custom_domain": true }
      ]
    }
  }
}
```

Static project: point `assets.directory` at the build output and set the build
command in Workers Builds (for example `npm run build`).
Dynamic project: add a `main` entry pointing at the Worker script.

### 2. Branches

```
git push -u origin main
git branch testing && git push -u origin testing
```

### 3. Connect Workers Builds twice

Create two Workers, `myproject` and `myproject-testing`, and connect each to the
repo as described above: `myproject` watches `main` with `npx wrangler deploy`,
`myproject-testing` watches `testing` with `npx wrangler deploy --env testing`.

### 4. DNS and certificates

`custom_domain: true` makes Cloudflare create the DNS record and provision a
certificate on the first successful deploy of each Worker, including for the two
label `testing.myproject` host. Nothing to do by hand while `kweinstock.dev` is
on the same account.

If a Workers Builds deploy is the very first time a custom domain is created and
it fails on permissions, run that first deploy once from your machine with
`npx wrangler deploy` (or `--env testing`) while logged in, then let Workers
Builds take over.

### 5. List it on the landing page

Edit `public/projects.json` in this repo:

```json
{
  "name": "My Project",
  "url": "https://myproject.kweinstock.dev",
  "note": "One line on what it is."
}
```

Always use the production URL. The Testing toggle on the landing page rewrites
every link by prefixing the host with `testing.`, so `myproject.kweinstock.dev`
becomes `testing.myproject.kweinstock.dev`. The toggle choice is remembered, and
`testing.kweinstock.dev` defaults to Testing.

Push to `main`. The list updates on the next landing page deploy. Order in the
file is the display order. Remove an entry to delist.
