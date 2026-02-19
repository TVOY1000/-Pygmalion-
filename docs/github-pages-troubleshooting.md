# GitHub Pages troubleshooting for `mvp/app`

If deployment is failing or the website serves source files instead of the Vite build, use this checklist.

## 1) Required repository settings

1. **Settings → Pages → Build and deployment → Source** must be **GitHub Actions**.
2. **Settings → Actions → General → Workflow permissions** must be **Read and write permissions**.

If Pages is set to **Deploy from a branch**, GitHub may serve repository files directly (for example `index.html` with `/src/main.jsx`) instead of the built `dist/` artifact.

## 2) Required workflow behavior

Workflow file: `.github/workflows/deploy.yml`

- Build must run from `mvp/app`.
- Deploy artifact path must be `mvp/app/dist`.
- Build must install dependencies via lockfile (`npm ci`).

## 3) Required Vite config for project pages

`mvp/app/vite.config.js` must include:

```js
base: '/-Pygmalion-/'
```

This is required because the site is hosted under a project subpath, not the domain root.

## 4) Quick local validation

```bash
cd mvp/app
npm ci
npm run build
```

Then ensure generated `dist/index.html` references built files in `dist/assets` and does not contain `/src/main.jsx`.
