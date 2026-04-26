# Changelog

All notable changes to condenser-plus.

## [Unreleased]

### Fixed
- **Steemit-Images proxy bypass:** image URLs in posts now load directly from their CDN instead of through `steemitimages.com/<size>/`. Resolves visibility issues when the proxy is slow or down. Avatars and the sanitiser allowlist are unchanged. See `docs/FIXES.md` for the full inventory and rationale.

### Added
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
- **CSP not relaxed for multi-server rotation.** Currently no impact: dev mode does not register the `helmet.contentSecurityPolicy` middleware, so all 10 rotator nodes are reachable. But the upstream CSP whitelist only allows `api.steemit.com` and `api.steemitdev.com` for `connectSrc` — switching to production-mode without first widening the allowlist would silently neutralise the rotator. See `docs/FIXES.md` §2 for verification and recommended pre-deploy fix.



