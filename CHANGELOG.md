# Changelog

All notable changes to condenser-plus.

## [Unreleased]

### Changed
- **Rotator now fetches node health centrally from `api.steemapps.com` instead of having each browser ping all servers individually.** The previous per-client `HealthCheckLoop` is gone; one fetch on page load replaces N pings every five minutes. Reduces load on small witness API operators significantly and gives every client the same view of node health. Failover chain: monitor → `localStorage` snapshot → three-server emergency list. User-pinned servers continue to override the rotator. The production CSP `connect-src` allowlist gained `https://api.steemapps.com` plus the three monitor-only nodes (`steem.senior.workers.dev`, `steemd.steemworld.org`, `steemd.blazeapps.org`). See `docs/FIXES.md` §4. Pointed out by witness moecki on Steem.

### Fixed
- **Steemit-Images proxy bypass:** image URLs in posts now load directly from their CDN instead of through `steemitimages.com/<size>/`. Resolves visibility issues when the proxy is slow or down. Avatars and the sanitiser allowlist are unchanged. See `docs/FIXES.md` for the full inventory and rationale.

### Added
- **Manual RPC node selection in Settings, with the rotator actually respecting it.** Users can now pin a specific Steem API server through `/@<user>/settings`: an Auto/Manual radio toggle, a dropdown of all configured nodes with their live latency (the active one marked `✓`, known-down ones marked `(down)`), an HTTPS-validated custom-URL input, and a Save button with a "✓ Saved" flash. The choice is persisted in a new localStorage key `userPreferredRpc` (separate from the rotator's volatile `steemSelectedRpc` cache). When the pin is set, `RotatorBootstrap` skips auto-switching and keeps the user's chosen server. Verified end-to-end: the Network tab shows requests actually going to the pinned server, not to api.steemit.com. See `docs/FIXES.md` §3.
- **Server indicator in the header.** A small status pill on the right side of the top navigation shows the currently active Steem RPC node, its measured latency, and a colour-coded status dot (green / amber / red / grey). Click expands a panel listing all configured nodes with their individual health and latency. On screens narrower than 600 px the hostname collapses and only the dot + latency are shown.
- `docs/ARCHITECTURE.md` filled out: stack table, repository layout, where the rotator is initialised and how it hooks `@steemit/steem-js`, public API of `RotatorBootstrap.js`, full data-flow diagram, configuration options, and notes on the still-bypassed SSR path.
- `docs/FIXES.md`: central document for fixes applied to this fork (with three-class inventory of related-looking matches).
- Initial fork from steemit/condenser
- Integration of steem-node-rotator (v0.1.1) for multi-server API rotation
- Repository structure and documentation

### Removed
- `RotatorStatus` floating widget at the bottom-right corner. Replaced by the new header-integrated `ServerIndicator` which provides the same expandable per-node detail view plus inline latency display. No functionality is lost; the new placement is more discoverable and behaves better on narrow screens.

### Reverted
- Codespaces support reverted — requires stack modernization first. The `.devcontainer/devcontainer.json` and the `local-deps/*.tgz` tarball that were briefly added are now removed; the README Codespaces badge is gone too. Reason: the deprecated `mcr.microsoft.com/devcontainers/javascript-node:0-12-bullseye` image was no longer resolvable at boot time, and the 2018-era Node-12-only build stack (node-sass v4, legacy babel-loader) won't survive a switch to a newer Node default. See `docs/ROADMAP.md` (medium term) for the planned stack-modernisation step.

### Known Issues
- Top navigation menu: needs visual polish (planned: enhanced menu)
- **`config/*.json` `rpc_list` is no longer read by any UI code** but still ships in the config files. Harmless dead config; will be cleaned up in a follow-up session.



