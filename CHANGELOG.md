# Changelog

All notable changes to condenser-plus.

## [Unreleased]

### Fixed
- **Steemit-Images proxy bypass:** image URLs in posts now load directly from their CDN instead of through `steemitimages.com/<size>/`. Resolves visibility issues when the proxy is slow or down. Avatars and the sanitiser allowlist are unchanged. See `docs/FIXES.md` for the full inventory and rationale.

### Added
- **GitHub Codespaces configuration** (`.devcontainer/devcontainer.json`): one-click browser-based development environment, no local setup required.
- README badge linking to Codespaces.
- `docs/FIXES.md`: central document for fixes applied to this fork (with three-class inventory of related-looking matches).
- Initial fork from steemit/condenser
- Integration of steem-node-rotator (v0.1.1) for multi-server API rotation
- Repository structure and documentation

### Known Issues
- Top navigation menu: needs visual polish (planned: enhanced menu)



