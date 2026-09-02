# Deploy and project workflow

Deploys run from GitHub Actions using `cloudflare/wrangler-action`. Two branches
are wired in `.github/workflows/deploy.yml`:

- `main` runs `wrangler deploy` (production)
- `testing` runs `wrangler deploy --env testing` (testing)

## One time GitHub setup

Set these as GitHub organization secrets so every project repo inherits them.
Org settings, Secrets and variables, Actions, New organization secret. Give both
access to all repositories (or the repos you choose).

- `CLOUDFLARE_API_TOKEN` — a token with the "Edit Cloudflare Workers" template
  scope, plus Zone DNS Edit on the `kweinstock.dev` zone so custom domains can be
  created.
- `CLOUDFLARE_ACCOUNT_ID` — from any Workers page in the dashboard.

Nothing per repo after this. Copy the workflow file into each project and it
works.

## This repo

`kweinstock.dev` is the `landing-page` Worker, `testing.kweinstock.dev` is
`landing-page-testing` (the `testing` env in `wrangler.jsonc`). Static files
live in `public/`.

- Push to `main` deploys the live site.
- Push to `testing` deploys the testing site.

Create the testing branch once:

```
git branch testing
git push -u origin testing
```

## Adding a project

Each project is its own repo and its own Worker, on `name.kweinstock.dev` with a
`testing.name.kweinstock.dev` counterpart.

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

Static project: point `assets.directory` at the build output and add
`- run: npm run build` in the workflow.
Dynamic project: add a `main` entry for the Worker script.

### 2. Workflow

Copy `.github/workflows/deploy.yml` from this repo into the project. It already
handles both branches. The org secrets cover auth.

### 3. DNS and certificates

`custom_domain: true` makes Cloudflare create the DNS record and provision a
certificate on first deploy, including for the two label `testing.myproject`
host. Nothing to do by hand while `kweinstock.dev` is on the same account.

### 4. Branches

```
git push -u origin main
git branch testing && git push -u origin testing
```

### 5. List it on the landing page

Edit `public/projects.json` in this repo:

```json
{
  "name": "My Project",
  "url": "https://myproject.kweinstock.dev",
  "note": "One line on what it is."
}
```

Always use the production URL here. The Testing toggle on the landing page
rewrites every link by prefixing the host with `testing.`, so
`myproject.kweinstock.dev` becomes `testing.myproject.kweinstock.dev`. The
toggle choice is remembered, and `testing.kweinstock.dev` defaults to Testing.

Push to `main`. The list updates on the next landing page deploy. Order in the
file is the display order. Remove an entry to delist.
