# Differences from upstream Condenser

Tracks every divergence from `steemit/condenser`. The fork point is upstream commit `99914655` (`fix(images): proxy only first-party via /p (#3976)`); see `git log` for the exact branch history.

| Date | Component | Change | Reason |
|------|-----------|--------|--------|
| 2026-04-26 | `Dockerfile.dev` | base image `node:12-alpine` → `node:12-bullseye-slim` with apt | Alpine EOL mirrors don't carry python2 (needed for node-sass) |
| 2026-04-26 | `docker-compose.dev.yml` | added `build.network: host` and runtime `dns: [8.8.8.8, 1.1.1.1]` | Docker bridge DNS broken on dev VM |
| 2026-04-26 | `package.json` | added `steem-node-rotator` and `abort-controller` deps | rotator integration |
| 2026-04-26 | `src/app/Main.js` | imports + `initRotator()` + ReactDOM mount | rotator initialisation at app start |
| 2026-04-26 | `src/app/utils/RotatorBootstrap.js` | new file | rotator wrapper that bridges to `@steemit/steem-js` |
| 2026-04-26 | `src/app/components/elements/RotatorStatus.jsx` | new file | floating status widget for the demo |
| 2026-04-26 | `README.md` | replaced upstream README; original preserved as `README.upstream.md` | fork-specific landing page |
| 2026-04-26 | `LICENSE`, `NOTICE` | added Apache-2.0 LICENSE text and NOTICE attribution | upstream had no top-level LICENSE file |
