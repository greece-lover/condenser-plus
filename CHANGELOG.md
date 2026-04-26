# Changelog

All notable changes to condenser-plus.

## [Unreleased]

### Fixed
- **Steemit-Images proxy bypass:** image URLs in posts now load directly from their CDN instead of through `steemitimages.com/<size>/`. Resolves visibility issues when the proxy is slow or down. Avatars and the sanitiser allowlist are unchanged. See `docs/FIXES.md` for the full inventory and rationale.

### Added
- `docs/FIXES.md`: central document for fixes applied to this fork (with three-class inventory of related-looking matches).
- Initial fork from steemit/condenser
- Integration of steem-node-rotator (v0.1.1) for multi-server API rotation
- Repository structure and documentation

### Reverted
- Codespaces support reverted — requires stack modernization first. The `.devcontainer/devcontainer.json` and the `local-deps/*.tgz` tarball that were briefly added are now removed; the README Codespaces badge is gone too. Reason: the deprecated `mcr.microsoft.com/devcontainers/javascript-node:0-12-bullseye` image was no longer resolvable at boot time, and the 2018-era Node-12-only build stack (node-sass v4, legacy babel-loader) won't survive a switch to a newer Node default. See `docs/ROADMAP.md` (medium term) for the planned stack-modernisation step.

### Known Issues
- Top navigation menu: needs visual polish (planned: enhanced menu)



