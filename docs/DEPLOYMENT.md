# Deployment

## Local development VM (current)

The demo runs in Holger's Ubuntu VM at:

- **Address (from VM):** <http://localhost:8080/>
- **Address (from Windows host):** <http://192.168.217.131:8080/>
- **Process:** Docker container `condenser-dev`, image `condenser-demo-condenser:latest`
- **Compose file:** `docker-compose.dev.yml` (in repo root)

### First-time setup

```bash
git clone https://github.com/greece-lover/condenser-plus.git
cd condenser-plus
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up -d
```

The build is slow (~3 minutes) on first run; the container then takes another minute or so to compile the dev bundle. App is ready when `docker logs condenser-dev` prints `Application started on port 8080`.

`steem-node-rotator` ships as a tarball in `local-deps/`; the Docker image installs it via the existing `yarn.lock`. When the rotator is updated, drop a new tarball into `local-deps/`, then inside the container:

```bash
docker exec condenser-dev sh -c "cd /app && yarn add file:./local-deps/steem-node-rotator-<new-version>.tgz --ignore-engines"
docker compose -f docker-compose.dev.yml restart condenser
```

### Stop / restart

```bash
# stop, keep image
docker compose -f docker-compose.dev.yml stop

# start again (no rebuild)
docker compose -f docker-compose.dev.yml start

# full restart (re-runs entrypoint)
docker compose -f docker-compose.dev.yml restart condenser

# stop and remove container (keeps image and volumes)
docker compose -f docker-compose.dev.yml down
```

### Failover smoke test

```bash
docker exec -it condenser-dev node /app/failover-demo.js
```

Expected: 3+ public nodes report `OK <latency> ms`, one or two intentionally bad nodes report `BAD ENOTFOUND`, a real RPC call returns the current `head_block_number`.

## Public deployment (planned)

TBD — see `docs/ROADMAP.md`. Open questions: subdomain, TLS termination, server-side rotator integration, branding.
