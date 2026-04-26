# condenser-plus

A fork of [steemit/condenser](https://github.com/steemit/condenser) with enhancements.

## Try it in your browser

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/greece-lover/condenser-plus)

Click the button above to launch a fully configured development environment in your browser. No local installation needed. (Requires GitHub account; free 60 hours/month included on personal accounts.)

## What's different

This fork integrates [steem-node-rotator](https://github.com/greece-lover/steem-node-rotator) — a multi-server rotation library that automatically picks the fastest available Steem API node from the user's location. Instead of being tied to a single API endpoint, this Condenser stays responsive even if individual servers go down or slow down.

Further enhancements are planned (see `docs/ROADMAP.md`).

## Status

🚧 **Work in progress.** Demo currently running in Holger's local development environment. Public deployment planned.

## Running locally

See `docs/DEPLOYMENT.md`.

## Documentation

- `docs/ARCHITECTURE.md` — how the rotator is integrated
- `docs/DEPLOYMENT.md` — how to run/deploy
- `docs/ROADMAP.md` — planned enhancements
- `docs/DIFF_FROM_UPSTREAM.md` — list of changes from steemit/condenser
- `docs/protokolle/` — daily session logs (German)
- `CHANGELOG.md` — chronological list of changes
- `README.upstream.md` — original Steemit Condenser README, preserved verbatim

## License

Apache 2.0 — same as upstream Condenser. See `LICENSE` and `NOTICE`.

## Acknowledgments

Forked from [steemit/condenser](https://github.com/steemit/condenser). Original copyright Steemit Inc. The fork point is upstream commit `99914655`.
