# Architecture

## Origin

Forked from [steemit/condenser](https://github.com/steemit/condenser) at upstream commit `9991465` (`fix(images): proxy only first-party via /p (#3976)`).

condenser-plus does not preserve upstream git history — see `NOTICE` for full attribution. Diffs from upstream are tracked in `docs/DIFF_FROM_UPSTREAM.md`.

## Stack

| Component | Version | Notes |
|---|---|---|
| Node.js | 12 (in Docker) | Pinned to upstream's `node:12-bullseye-slim` (Alpine variants in upstream Dockerfile have EOL package mirrors) |
| yarn | 1.22 | upstream uses yarn over npm; `yarn.lock` is authoritative |
| React | 16 (via upstream deps) | upstream-pinned |
| Redux + Redux-Saga | as in upstream | server-side and client-side state |
| Webpack | 4 | upstream-configured; ES2017 max for vendor bundles |
| Babel | 6/7 mix | upstream presets (babel-preset-2017 era) |
| `@steemit/steem-js` | 0.7.9 | upstream RPC client; condenser-plus calls `api.setOptions({url})` on it from the rotator |
| `steem-node-rotator` | 0.1.1 | private package (greece-lover/steem-node-rotator), installed via `yarn add file:./local-deps/steem-node-rotator-0.1.1.tgz --ignore-engines` |
| `abort-controller` | 3.0 | shim for the failover demo script (Node 12 has no global AbortController) |

## Integration of steem-node-rotator

Three glue files were added; everything else in upstream Condenser stays untouched.

| File | Type | Purpose |
|---|---|---|
| `src/app/utils/RotatorBootstrap.js` | NEW | Initialises `SteemRotator` + `HealthCheckLoop` at app start. Hooks `onNodeFailure`/`onNodeRecovery` and updates `@steemit/steem-js` `api.setOptions({url})` whenever the active node changes. Default node list is hard-coded in this file (~10 public Steem RPC nodes). Uses `localStorage` to remember last known latencies between sessions. |
| `src/app/components/elements/RotatorStatus.jsx` | NEW | Floating status widget bottom-right. Shows the currently active node URL plus a green/red dot. Click expands a table of all configured nodes with health and latency. Demo-quality UI, not production-styled. |
| `src/app/Main.js` | PATCH | 5-line import block + 9-line `initRotator()` invocation and `ReactDOM.render(<RotatorStatus/>, ...)` after the existing `steem.api.setOptions(...)` block. |

## Build / runtime adaptations

These were necessary to make the upstream Dockerfile build inside the dev VM:

| File | Change | Reason |
|---|---|---|
| `Dockerfile.dev` | `node:12-alpine` → `node:12-bullseye-slim` with `apt` install of `python2 make g++ git` | Alpine 3.x EOL mirrors don't carry `python2` anymore (needed for `node-sass`) |
| `docker-compose.dev.yml` | `build.network: host`, runtime `dns: [8.8.8.8, 1.1.1.1]` | Docker bridge networking on this VM has broken DNS resolution from inside containers |

Original `Dockerfile.dev` is preserved as `Dockerfile.dev.bak` for reference.

## Runtime topology

Browser
  → app server (port 8080, Koa-based, server-side rendering)
  → `@steemit/steem-js` client (URL set by rotator via `api.setOptions`)
  → one of the configured Steem RPC nodes

The rotator's health check loop runs in the browser, probes each configured node every 5 minutes, and re-points `api.setOptions({url})` whenever the previous active node fails or a faster healthy node becomes available.

The Condenser server (`src/server/index.js`) makes its own RPC calls directly to `SDC_SERVER_STEEMD_URL` (currently `https://api.steemit.com`). **Server-side calls are not yet routed through the rotator** — see `docs/ROADMAP.md`.
