# Differences from upstream Condenser

Tracks every divergence from `steemit/condenser`. The fork point is upstream commit `99914655` (`fix(images): proxy only first-party via /p (#3976)`); see `git log` for the exact branch history.

| Date | Component | Change | Reason |
|------|-----------|--------|--------|
| 2026-04-26 | `Dockerfile.dev` | base image `node:12-alpine` → `node:12-bullseye-slim` with apt | Alpine EOL mirrors don't carry python2 (needed for node-sass) |
| 2026-04-26 | `docker-compose.dev.yml` | added `build.network: host` and runtime `dns: [8.8.8.8, 1.1.1.1]` | Docker bridge DNS broken on dev VM |
| 2026-04-26 | `package.json` | added `steem-node-rotator` and `abort-controller` deps | rotator integration |
| 2026-04-26 | `src/app/Main.js` | imports + `initRotator()` + ReactDOM mount | rotator initialisation at app start |
| 2026-04-26 | `src/app/utils/RotatorBootstrap.js` | new file | rotator wrapper that bridges to `@steemit/steem-js` |
| 2026-04-26 | `src/app/components/elements/RotatorStatus.jsx` | floating status widget removed, replaced by header-integrated `ServerIndicator` with expandable tooltip | unify rotator-status UI in one place; cleaner mobile behaviour |
| 2026-04-26 | `README.md` | replaced upstream README; original preserved as `README.upstream.md` | fork-specific landing page |
| 2026-04-26 | `LICENSE`, `NOTICE` | added Apache-2.0 LICENSE text and NOTICE attribution | upstream had no top-level LICENSE file |
| 2026-04-26 | `src/app/utils/ProxifyUrl.js` | `proxifyImageUrl()` reduced to pure strip-then-return; no more proxy wrapping | Reliability — Steemit-Images proxy outages used to break all images. See `docs/FIXES.md`. |
| 2026-04-26 | `.devcontainer/devcontainer.json` | new file | GitHub Codespaces config for one-click browser-based dev environment |
| 2026-04-26 | `README.md` | added Codespaces badge | low-friction "try it" entry point |
| 2026-04-26 | `.devcontainer/devcontainer.json`, README badge, `local-deps/*.tgz` | reverted Codespaces support | deprecated `0-12-bullseye` image was no longer resolvable; re-add after Node 18 stack-modernisation |
| 2026-04-26 | `src/app/components/elements/ServerIndicator.{jsx,scss}` | new files | visible status of the active API node in the top navigation (replaces floating widget) |
| 2026-04-26 | `src/app/components/modules/Header/index.jsx` | added `<ServerIndicator/>` at the start of `Header__buttons` | place the server indicator in the header, before the search box |
| 2026-04-26 | `src/app/utils/RPCNode.js` | added `getUserPreferredRpc`/`setUserPreferredRpc`/`clearUserPreferredRpc` and `LOCALSTORAGE_USER_PREFERRED_RPC_KEY` | separate the user pin from the rotator's volatile cache |
| 2026-04-26 | `src/app/utils/RotatorBootstrap.js` | `pickAndApplyFastest` and `onNodeFailure` now respect `getUserPreferredRpc()`; new `applyUserPreferenceNow()` export | rotator stops auto-switching when the user pinned a node |
| 2026-04-26 | `src/app/components/modules/Settings.jsx` | replaced `<input list>` with Auto/Manual radio toggle, real `<select>` with live latencies, custom-URL input with HTTPS validation, Save button with feedback | manual node choice that the rotator actually respects, with discoverable UI |
| 2026-04-26 | `src/app/components/modules/Settings.scss` | new layout block for `.Settings__rpc*` | styling for the new RPC settings UI |
| 2026-04-26 | `src/app/locales/en.json` | new i18n keys under `settings_jsx`: rpc_intro, rpc_auto_label/hint, rpc_manual_label/hint/tooltip, rpc_select_placeholder, rpc_custom_url_*, rpc_save, rpc_saved, rpc_no_probe_yet, rpc_currently_active, rpc_summary_auto/manual | English UI text for the new RPC settings UI |
