# Architecture

## Origin

Forked from [steemit/condenser](https://github.com/steemit/condenser) at upstream commit `9991465` (`fix(images): proxy only first-party via /p (#3976)`).

condenser-plus does not preserve upstream git history — see `NOTICE` for full attribution. Diffs from upstream are tracked in `docs/DIFF_FROM_UPSTREAM.md`.

## Stack

| Component | Version | Notes |
|---|---|---|
| Node.js | 12 (in Docker) | Pinned to upstream's `node:12-bullseye-slim`. Stack-modernisation to Node 18+ is on the roadmap (medium term). |
| yarn | 1.22 | upstream uses yarn over npm; `yarn.lock` is authoritative |
| React | 15.6.2 | upstream-pinned. **No hooks** (`useState` etc. are not available); new components must be class components. |
| Redux + Redux-Saga | as in upstream | server-side and client-side state |
| Webpack | 4 | upstream-configured; ES2017 max for vendor bundles |
| Babel | 6/7 mix | upstream presets (babel-preset-2017 era) — no numeric separators, no `??`, no `?.` |
| `@steemit/steem-js` | 0.7.9 | upstream RPC client; condenser-plus calls `api.setOptions({url})` on it from the rotator |
| `steem-node-rotator` | 0.1.1 | private package, installed via `local-deps/*.tgz` (gitignored). Built with `target: es2017` to satisfy the legacy bundler. |
| `abort-controller` | 3.0 | shim for the failover demo script (Node 12 has no global AbortController) |

## Repository layout (relevant parts)

```
src/
  app/
    Main.js                                  — client bootstrap; calls initRotator() once
    components/
      modules/
        Header/index.jsx                     — top navigation; renders <ServerIndicator/>
      elements/
        ServerIndicator.jsx (NEW)            — visible status of the active API node
        ServerIndicator.scss (NEW)           — responsive styles
        Userpic.jsx                          — avatar component (uses imageProxy(), not the wrap)
    redux/                                   — Redux store, reducers, sagas (rotator does NOT use this)
    utils/
      RotatorBootstrap.js (NEW)              — sole bridge to steem-node-rotator
      ProxifyUrl.js (PATCHED)                — image proxy bypass (see docs/FIXES.md)
      RPCNode.js                             — manual node-switch UI helper
      ServerApiClient.js                     — site-internal /api endpoints
      steemApi.js                            — wraps condenser/bridge calls
  server/
    app_render.jsx                           — SSR entry
    server.js                                — Express/Koa server, /avatar/:username route
    api/general.js                           — site-internal API
  shared/
    HtmlReady.js                             — converts post HTML; calls proxifyImageUrl()
local-deps/
  steem-node-rotator-0.1.1.tgz               — gitignored tarball (file: dep in package.json)
docs/
  ARCHITECTURE.md                            — this file
  DEPLOYMENT.md, ROADMAP.md, FIXES.md
  DIFF_FROM_UPSTREAM.md                      — table of every divergence from upstream
  protokolle/                                — daily session logs (German)
```

## Rotator integration

### Where the rotator is initialised

File: `src/app/utils/RotatorBootstrap.js` (function `initRotator(opts)`, line 63).

The rotator is created once at client bootstrap time. The default node list (10 public Steem RPC nodes) is hard-coded near the top of the file. `initRotator` constructs a `SteemRotator` plus a `HealthCheckLoop`, persists last known latencies in `localStorage`, and hooks `onNodeFailure` / `onNodeRecovery` callbacks.

### How the API client uses it

File: `src/app/Main.js` (line ~120).

After upstream's `steem.api.setOptions(...)` block, we call `initRotator()`. The rotator listens for failures and successes, and updates `steem.api.url` whenever the active node changes — by calling `changeRPCNodeToDefault(url)` (or `api.setOptions({url})` as a fallback).

This means: every existing `steem.api.call(...)` and every `bridge.*` call inside Condenser keeps working unchanged. The rotator only changes which URL the global `steem.api` points at. No call site needs to know about it.

### Public API of `RotatorBootstrap.js`

```ts
initRotator(opts?)         // bootstrap; called once from Main.js
getRotator()               // → SteemRotator | null  (low-level access)
getActiveNode()            // → string | null  (current URL)
getNodeHealth()            // → NodeHealth[]  (snapshot of all nodes)
onRotatorEvent(fn)         // → unsub  (events: node-active, node-failure, node-recovery)
```

`window.__steemRotator`, `window.__steemRotatorLoop`, `window.__getActiveSteemNode` are also exposed for DevTools inspection.

### Why this approach

We deliberately do **not** add a Redux slice for rotator state. Reasons:
- Rotator state is fast-changing (latency every probe) and only one component cares about it.
- Coupling the rotator to Redux would mean wiring an extra reducer/saga and importing it from `RotatorBootstrap.js`, which has to stay framework-agnostic so it could be reused outside Condenser.
- The component-local subscription via `onRotatorEvent` + 5 s polling fallback is sufficient for live UI updates.

## Server-Indicator hook

File: `src/app/components/elements/ServerIndicator.jsx` (class component, React 15-compatible).

The indicator subscribes to the rotator's status via `onRotatorEvent` plus a 5-second polling fallback (because not every state change emits an event — e.g. latency updates on an already-healthy node). It renders the active node's hostname, current latency, and a status dot whose colour depends on latency:

- `< 500 ms` → fast (green, `#2A9D8F`)
- `500–1499 ms` → slow (amber, `#F4A261`)
- `≥ 1500 ms` → down (red, pulsing)
- no measurement yet → unknown (grey)

On click the indicator expands a panel showing all configured nodes with health and latency. Click outside or on the indicator again closes the panel.

Mobile (`max-width: 600px`): hostname collapses, only dot + latency are shown.

The indicator is rendered inside the existing `Header__buttons` column (`src/app/components/modules/Header/index.jsx`), placed before the search box.

## Data flow

```
1. Page load (browser)
   └─ Main.js bootstrap → initRotator() (creates SteemRotator + HealthCheckLoop,
                                         points steem.api.url at first eligible node)
2. React renders the Header
   └─ Header includes <ServerIndicator/>
       └─ subscribes onRotatorEvent + setInterval(5s) refresh

3. Any RPC call (a saga, a server.js route, a click handler)
   └─ steem.api.call(method, params)   [@steemit/steem-js]
       └─ POST to current steem.api.url
       └─ on success → SteemRotator.markHealthy(url, latencyMs)
       └─ on failure → SteemRotator.markUnhealthy(url, reason)
                       → onNodeFailure → notify('node-failure')
                       → if active node failed: pickAndApplyFastest()
                            → api.setOptions({url: newUrl})
                            → notify('node-active')

4. ServerIndicator hears 'node-active' / 'node-recovery' (or polls every 5s)
   └─ setState({ active, nodes }) → re-render
       └─ active hostname, latency, status colour update
```

## Configuration

The default node list is currently hard-coded in `RotatorBootstrap.js`:

```js
const DEFAULT_NODES = [
  'https://api.steemit.com',
  'https://api.steemyy.com',
  'https://api.justyy.com',
  'https://steem.nirmaha.com',
  'https://steemenginerpc.com',
  'https://api.moecki.online',
  'https://api.dlike.io',
  'https://steem.61bts.com',
  'https://steem.ecosynthesizer.com',
  'https://api.upvu.org',
];
```

Other options passed to `SteemRotator`:

| Option | Value | Notes |
|---|---|---|
| `timeoutMs` | 6000 | per-request timeout |
| `cooldownMs` | 60000 | how long an unhealthy node sits out before being retried |
| `storage` | `window.localStorage` | persists last known latencies between sessions |
| `pickStrategy` | (default `fastest-healthy`) | picks the lowest-latency healthy node |
| `HealthCheckLoop.intervalMs` | 5 × 60000 | background probe every 5 min |
| `HealthCheckLoop.skipWhenHidden` | `true` | don't probe in background tabs (saves battery) |

Future configurability — exposing the node list via a build-time constant or a runtime config endpoint — is a candidate for the medium-term roadmap.

## Server-side rotator (not yet)

`src/server/index.js` and `src/server/app_render.jsx` make their own RPC calls during SSR (special posts, market data, page render). **Those calls currently bypass the rotator** — they go directly to `SDC_SERVER_STEEMD_URL` (default `https://api.steemit.com`).

A second rotator instance for the SSR path is on the roadmap. The integration pattern would mirror the client-side one: a small `RotatorBootstrap.server.js` that initialises a `SteemRotator` once per server process and hooks `steem.api.setOptions({url})` on the server-side global.
