/* eslint-disable no-console */
//
// RotatorBootstrap.js — initialises the active Steem RPC node from the
// central api.steemapps.com monitor.
//
// Background: each browser used to perform its own healthchecks against
// every bootstrap server every five minutes. With many concurrent users
// that pattern is hostile to small witness API operators. The monitor
// already aggregates this data centrally; we now fetch it once per page
// load and cache it for the rest of the session.
//
// Failover chain:
//   1. https://api.steemapps.com/api/v1/status   (primary)
//   2. localStorage snapshot from previous session
//   3. FALLBACK_NODES — three robust servers as last resort
//
// Pointed out by witness moecki on Steem.
//
import { api } from '@steemit/steem-js';
import { changeRPCNodeToDefault, getUserPreferredRpc } from 'app/utils/RPCNode';

const MONITOR_URL = 'https://api.steemapps.com/api/v1/status';
const MONITOR_FETCH_TIMEOUT_MS = 5000;
const MONITOR_RETRY_DELAY_MS = 2000;
const SNAPSHOT_STORAGE_KEY = 'steemMonitorSnapshot';
// TTL für den localStorage-Snapshot. Ältere Caches könnten einen "DOWN"-
// Stand aus früheren Sessions zeigen, der den Nutzer ohne aktive Probe
// blockiert. Nach Ablauf wird Fallback genommen, bis der Async-Fetch
// frische Daten liefert.
const SNAPSHOT_STALE_AFTER_MS = 5 * 60 * 1000;

// Last-resort list used only when the monitor is unreachable AND no
// localStorage snapshot exists. Three servers verified as robust during
// the 2026-04-27 endpoint check.
const FALLBACK_NODES = [
    'https://api.steemit.com',
    'https://api.moecki.online',
    'https://api.steemyy.com',
];

// Internal state — array of node objects in monitor schema:
//   { url, region, status, score, latency_ms, block_lag, last_tick_ts, ... }
let _nodes = [];
let _activeNode = null;
let _snapshotGeneratedAt = null;
let _source = 'none'; // 'monitor' | 'cache' | 'fallback'
const _listeners = new Set();

function notify(eventName, info) {
    for (const l of _listeners) {
        try { l(eventName, info); } catch (e) { /* swallow */ }
    }
}

function applyNode(url) {
    if (!url || url === _activeNode) return;
    _activeNode = url;
    try {
        changeRPCNodeToDefault(url);
    } catch (e) {
        api.setOptions({ url });
    }
    if (typeof window !== 'undefined') {
        window.__activeSteemNode = url;
    }
    notify('node-active', { url });
    console.log('[Rotator] active node ->', url);
}

// Pick the best node from the current snapshot. User pin always wins.
// Otherwise: highest score among status==ok, then degraded, then first.
function pickActiveNode() {
    const pinned = getUserPreferredRpc();
    if (pinned) {
        applyNode(pinned);
        return;
    }
    if (!_nodes.length) return;

    const byScoreThenLatency = (a, b) => {
        const sa = a.score == null ? -1 : a.score;
        const sb = b.score == null ? -1 : b.score;
        if (sa !== sb) return sb - sa;
        const la = a.latency_ms == null ? Infinity : a.latency_ms;
        const lb = b.latency_ms == null ? Infinity : b.latency_ms;
        return la - lb;
    };

    const ok = _nodes.filter(n => n.status === 'ok').sort(byScoreThenLatency);
    if (ok.length) { applyNode(ok[0].url); return; }

    const degraded = _nodes.filter(n => n.status === 'degraded').sort(byScoreThenLatency);
    if (degraded.length) { applyNode(degraded[0].url); return; }

    applyNode(_nodes[0].url);
}

function readSnapshotFromStorage() {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.nodes) || !parsed.nodes.length) return null;
        return parsed;
    } catch (e) {
        return null;
    }
}

function writeSnapshotToStorage(snapshot) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) { /* quota etc. — ignore */ }
}

function fallbackNodes() {
    return FALLBACK_NODES.map(url => ({
        url,
        region: 'unknown',
        status: 'unknown',
        score: null,
        latency_ms: null,
        block_lag: null,
        last_tick_ts: null,
    }));
}

// Single fetch attempt with timeout. Returns parsed payload on success
// or { __error } on any failure (network, timeout, non-2xx, malformed).
async function fetchMonitorOnce() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MONITOR_FETCH_TIMEOUT_MS);
    try {
        const resp = await fetch(MONITOR_URL, {
            method: 'GET',
            credentials: 'omit',
            signal: controller.signal,
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (!data || !Array.isArray(data.nodes) || !data.nodes.length) {
            throw new Error('empty or malformed payload');
        }
        return data;
    } catch (err) {
        return { __error: err && err.message ? err.message : String(err) };
    } finally {
        clearTimeout(timer);
    }
}

// Page-load failover counter: one initial attempt plus one retry.
async function fetchFromMonitor() {
    const first = await fetchMonitorOnce();
    if (!first.__error) {
        console.log(`[Rotator] Fetched ${first.nodes.length} nodes from monitor`);
        return first;
    }
    console.warn(`[Rotator] Monitor fetch failed (1/2): ${first.__error}`);
    await new Promise(r => setTimeout(r, MONITOR_RETRY_DELAY_MS));
    const second = await fetchMonitorOnce();
    if (!second.__error) {
        console.log(`[Rotator] Fetched ${second.nodes.length} nodes from monitor (retry)`);
        return second;
    }
    console.warn(`[Rotator] Monitor unreachable, using fallback: ${second.__error}`);
    return null;
}

let _initStarted = false;
export function initRotator() {
    if (_initStarted) return;
    _initStarted = true;

    // Step 1 — synchronous bootstrap so api.url has a target immediately.
    // Snapshots älter als SNAPSHOT_STALE_AFTER_MS werden ignoriert, damit
    // alte DOWN-Markierungen nicht hängen bleiben bis der Async-Fetch durch ist.
    const cached = readSnapshotFromStorage();
    const cacheAgeMs = cached && cached.generated_at
        ? Date.now() - new Date(cached.generated_at).getTime()
        : Infinity;
    if (
        cached &&
        Array.isArray(cached.nodes) &&
        cached.nodes.length &&
        cacheAgeMs < SNAPSHOT_STALE_AFTER_MS
    ) {
        _nodes = cached.nodes;
        _snapshotGeneratedAt = cached.generated_at || null;
        _source = 'cache';
    } else {
        _nodes = fallbackNodes();
        _source = 'fallback';
    }
    pickActiveNode();
    notify('nodes-loaded', { source: _source, count: _nodes.length });

    // Step 2 — asynchronous monitor fetch. On success, replace the cache
    // bootstrap with fresh data and re-pick. The retry inside
    // fetchFromMonitor IS the page-load failover counter.
    fetchFromMonitor().then(snapshot => {
        if (snapshot) {
            _nodes = snapshot.nodes;
            _snapshotGeneratedAt = snapshot.generated_at || null;
            _source = 'monitor';
            writeSnapshotToStorage({
                generated_at: snapshot.generated_at,
                nodes: snapshot.nodes,
            });
            pickActiveNode();
            notify('nodes-loaded', { source: _source, count: _nodes.length });
        }
    });

    if (typeof window !== 'undefined') {
        window.__steemRotator = {
            getNodes: () => _nodes,
            getActive: () => _activeNode,
            getSource: () => _source,
            getGeneratedAt: () => _snapshotGeneratedAt,
        };
        window.__getActiveSteemNode = () => _activeNode;
    }
}

export function getActiveNode() { return _activeNode; }

export function onRotatorEvent(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
}

// Map internal monitor schema to the legacy UI shape so existing
// consumers (ServerIndicator, Settings) keep working. `status` is
// added on top for the new badges. `isHealthy` is true only for
// status 'ok' — degraded and down both render as not-healthy.
export function getNodeHealth() {
    return _nodes.map(n => ({
        url: n.url,
        latencyMs: n.latency_ms == null ? null : n.latency_ms,
        isHealthy: n.status === 'ok',
        status: n.status || 'unknown',
        score: n.score == null ? null : n.score,
        region: n.region || 'unknown',
    }));
}

export function getSnapshotSource() {
    return { source: _source, generatedAt: _snapshotGeneratedAt };
}

export function applyUserPreferenceNow() {
    const pinned = getUserPreferredRpc();
    if (pinned) {
        applyNode(pinned);
    } else {
        pickActiveNode();
    }
}

// Backward-compat shim — returns the debug façade exposed on window.
export function getRotator() {
    return typeof window !== 'undefined' ? window.__steemRotator || null : null;
}
