# Condenser-Demo mit steem-node-rotator

Lokale Demo: ein Condenser-Fork (offizielles `steemit/condenser`, Stand 2026-04-26) mit eingebautem Multi-Node-Failover via [steem-node-rotator](https://github.com/greece-lover/steem-node-rotator).

Dieses Verzeichnis ist nicht öffentlich. Nur die Library selbst ist (privat) auf GitHub.

## Was die Demo zeigt

1. Beim App-Start initialisiert der Rotator eine Liste von ~10 Steem-RPC-Nodes.
2. Der Rotator probet alle Nodes parallel und merkt sich die Latenzen.
3. Der schnellste healthy Node wird als aktive RPC-URL für `@steemit/steem-js` gesetzt — alle weiteren Condenser-Calls gehen über diesen Node.
4. Fällt der aktive Node aus, schaltet der Rotator innerhalb der nächsten 60 s auf den nächst-schnellsten healthy Node um.
5. Ein kleiner Status-Punkt unten rechts zeigt den aktuellen Node; Klick öffnet die volle Liste mit Latenzen.

## Wie starten

In der Ubuntu-VM:

```bash
cd ~/dev/condenser-demo
docker compose -f docker-compose.dev.yml up -d
```

Erste Compile dauert ~60 s (siehe `docker logs -f condenser-dev`).

Erreichbar:
- VM-intern: <http://localhost:8080/>
- Vom Windows-Host: <http://192.168.217.131:8080/>

Stop:
```bash
docker compose -f docker-compose.dev.yml down
```

## Was technisch geändert wurde

Drei Dateien wurden in den Condenser-Quellcode hineingelegt bzw. gepatcht:

| Datei | Art | Inhalt |
|---|---|---|
| `src/app/utils/RotatorBootstrap.js` | NEU | Initialisiert SteemRotator + HealthCheckLoop, hängt sich an `@steemit/steem-js` `api.setOptions({url})` und switcht den Node bei Failover/Recovery. |
| `src/app/components/elements/RotatorStatus.jsx` | NEU | Kleines Floating-Widget unten rechts mit aktuellem Node + ausklappbarer Tabelle aller Nodes mit Latenz/Health. |
| `src/app/Main.js` | PATCH | 5 Zeilen Import + 9 Zeilen `initRotator()` + ReactDOM-Mount nach dem bestehenden `steem.api.setOptions(...)`-Block. |

Plus: `package.json` bekam `steem-node-rotator: file:./local-deps/steem-node-rotator-0.1.1.tgz` als direkte Dependency.

Plus: Build-Anpassungen am Condenser-Repo (Demo-only, nicht für upstream-PR):
- `Dockerfile.dev`: von `node:12-alpine` auf `node:12-bullseye-slim` (alpine 3.x EOL hatte python2 nicht mehr)
- `docker-compose.dev.yml`: `build.network=host` und runtime `dns: [8.8.8.8, 1.1.1.1]` (Docker-Bridge-DNS in dieser VM funktionierte nicht)

## Wie ein User die Funktion live sieht

1. Seite öffnen → unten rechts ein dunkler Punkt mit `node: api.steemit.com` (oder welcher gerade gewählt wurde).
2. Browser-DevTools-Console öffnen → Logs:
   - `[steem-rotator] active node -> https://...`
   - bei Failover: `[steem-rotator] node failed: https://... <reason>`
   - bei Recovery: `[steem-rotator] node recovered: https://... <ms> ms`
3. Klick auf den Status-Punkt → Tabelle aller Nodes mit grün/rot-Indikator + Latenz.

Optional in der Console:
```js
window.__steemRotator.nodes()      // Snapshot aller Nodes mit Health
window.__steemRotator.call('condenser_api.get_dynamic_global_properties', [])
window.__getActiveSteemNode()      // aktuelle URL
```

## Failover-Test

Siehe `failover-demo.js` (per Hand mit Node 12+ in der VM, oder direkt im Container ausführbar):

```bash
docker exec -it condenser-dev node /app/failover-demo.js
```

Erwarteter Output: zeigt erst alle Nodes als healthy mit Latenzen, simuliert dann durch Hinzufügen eines kaputten Nodes (`https://broken.example.invalid`) den Ausfall, beobachtet die Failover-Reaktion.

## Bekannte Beschränkungen

- `dist/browser.js` (IIFE) im Paket ist nur für CDN-Nutzung gedacht und wird **nicht** durch Bundler eingebunden (das `"browser"`-Field in `package.json` wurde dafür entfernt).
- Rotator-ESM/CJS sind auf ES2017 transpiliert, damit ältere Bundler (Webpack 4 wie hier) das parsen können.
- `@steemit/steem-js` 0.7.9 cached die URL nicht aggressiv — `api.setOptions({url})` greift sofort beim nächsten Call. Verifiziert via Bundle-Inspection (Code ist drin) und Manual-Test im Browser-DevTools (siehe Logs).

## Was NICHT geändert ist

- Keine Änderungen am Condenser-Server-Code (`src/server/*`). Die Server-Side-Calls gehen weiterhin direkt gegen `SDC_SERVER_STEEMD_URL` (default `https://api.steemit.com`).
- Keine Änderungen am bestehenden RPC-Switch-UI im Condenser (`Settings.jsx`), das User-Auswahl überlässt — Rotator ergänzt, ersetzt nicht.
- Keine Branding-Änderungen, keine Welako-/Personenbezüge.

## Nächste sinnvolle Schritte

- Demo-Fix-Patches als Upstream-PR prüfen (Dockerfile + DNS-Fix) — aber nur wenn das wirklich Condenser-relevant ist.
- Server-Side-Integration: zweiter Rotator-Instanz im Condenser-Server (`src/server/index.js`), damit auch SSR-Calls Multi-Node-Failover bekommen.
- Performance-Vergleich: ohne Rotator vs. mit Rotator (Node-Down-Szenario) — Lighthouse oder einfache curl-Loops.
- Falls für Steem-Community-Beitrag: einen kurzen Screencast (10–20 s) der das Floating-Status-Widget + Console-Logs zeigt.
