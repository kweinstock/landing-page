# Deploy and project workflow

## This repo

`kweinstock.dev` is served by the `landing-page` Worker. Static files live in `public/`.

Auto deploy is handled by Cloudflare Workers Builds:

1. Cloudflare dashboard, Workers and Pages, `landing-page`, Settings, Builds.
2. Connect to Git, pick `kweinstock/landing-page`.
3. Production branch `main`, no build command, deploy command `npx wrangler deploy`.

After that, any push to `main` (direct or merged PR) deploys.

## Adding a project

Each project is its own repo and its own Worker on a subdomain.

### 1. New repo from the template

Create the project repo. In its `wrangler.jsonc` set the name and the custom domain:

```jsonc
{
  "name": "myproject",
  "compatibility_date": "2026-08-31",
  "assets": { "directory": "./public" }, // or a build output dir
  "routes": [
    { "pattern": "myproject.kweinstock.dev", "custom_domain": true }
  ]
}
```

Static project: point `assets.directory` at the output folder and set the build command in Workers Builds (for example `npm run build`).
Dynamic project: add a `main` entry pointing at the Worker script, keep or drop `assets` as needed.

### 2. DNS

The `custom_domain: true` route makes Cloudflare create the `myproject.kweinstock.dev` DNS record on first deploy. Nothing to do by hand as long as `kweinstock.dev` is on the same Cloudflare account.

### 3. Connect Workers Builds

Same steps as the landing page, against the new repo. From then on the project self deploys on push.

### 4. List it on the landing page

Edit `public/projects.json` in this repo and add an entry:

```json
{
  "name": "My Project",
  "url": "https://myproject.kweinstock.dev",
  "note": "One line on what it is."
}
```

Push to `main`. The landing page reads this file at load time, so the list updates on the next deploy. Order in the file is the order shown. Remove an entry to delist a project.
