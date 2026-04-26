/* eslint-disable no-console */
//
// RotatorBootstrap.js — initialises steem-node-rotator and keeps the
// @steemit/steem-js global RPC URL pointed at the fastest healthy node.
//
// This file is added by the demo and is the only piece of glue between
// Condenser and the steem-node-rotator package. The rest of Condenser
// keeps using `api` from @steemit/steem-js as before.
//
import { SteemRotator, HealthCheckLoop } from 'steem-node-rotator';
import { api } from '@steemit/steem-js';
import { changeRPCNodeToDefault, getUserPreferredRpc } from 'app/utils/RPCNode';

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

let _rotator = null;
let _loop = null;
let _activeNode = null;
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
    console.log('[steem-rotator] active node ->', url);
}

function pickAndApplyFastest() {
    if (!_rotator) return;
    // User-pin overrides auto-pick. The pinned node is what the user chose
    // in Settings; we never override it from the rotator.
    const pinned = getUserPreferredRpc();
    if (pinned) {
        applyNode(pinned);
        return;
    }
    const nodes = _rotator.nodes();
    const healthy = nodes
        .filter(n => n.isHealthy && n.latencyMs !== null)
        .sort((a, b) => a.latencyMs - b.latencyMs);
    const winner = healthy[0] || nodes.find(n => n.isHealthy);
    if (winner) applyNode(winner.url);
}

export function initRotator(opts = {}) {
    if (_rotator) return _rotator;
    const nodes = opts.nodes && opts.nodes.length ? opts.nodes : DEFAULT_NODES;

    _rotator = new SteemRotator({
        nodes,
        timeoutMs: 6000,
        cooldownMs: 60000,
        storage: typeof window !== 'undefined' ? window.localStorage : null,
        onNodeFailure: (info) => {
            console.warn('[steem-rotator] node failed:', info.url, info.reason);
            notify('node-failure', info);
            // If a user has pinned a node, don't silently switch away — the
            // user wanted this specific node. If the pin happens to be the
            // failing node, the indicator's red status communicates the
            // problem; the user can pick another or switch back to auto.
            if (_activeNode === info.url && !getUserPreferredRpc()) {
                pickAndApplyFastest();
            }
        },
        onNodeRecovery: (info) => {
            console.info('[steem-rotator] node recovered:', info.url, info.latencyMs + ' ms');
            notify('node-recovery', info);
        },
    });

    _loop = new HealthCheckLoop(_rotator, {
        intervalMs: 5 * 60000,
        skipWhenHidden: true,
        runImmediately: true,
    });

    // Apply the first eligible node immediately so the very first call
    // already goes to a known node. If the user pinned one, that takes
    // precedence over the bootstrap-default order.
    const pinnedAtBoot = getUserPreferredRpc();
    if (pinnedAtBoot) {
        applyNode(pinnedAtBoot);
    } else {
        applyNode(_rotator.nodes()[0].url);
    }

    // After the first probe finishes, pick the fastest healthy one — but
    // pickAndApplyFastest also respects the user pin, so this is a no-op
    // when the user has chosen a specific server.
    setTimeout(pickAndApplyFastest, 8000);

    _loop.start();

    if (typeof window !== 'undefined') {
        window.__steemRotator = _rotator;
        window.__steemRotatorLoop = _loop;
        window.__getActiveSteemNode = () => _activeNode;
    }

    return _rotator;
}

export function getRotator() { return _rotator; }
export function getActiveNode() { return _activeNode; }
export function onRotatorEvent(fn) { _listeners.add(fn); return () => _listeners.delete(fn); }
export function getNodeHealth() {
    return _rotator ? _rotator.nodes() : [];
}

// Called by Settings when the user changes the pin. Forces an immediate
// apply so the next RPC call goes to the right node without waiting for
// the next probe tick.
export function applyUserPreferenceNow() {
    const pinned = getUserPreferredRpc();
    if (pinned) {
        applyNode(pinned);
    } else {
        // Pin was just cleared — go back to auto-mode by re-picking.
        pickAndApplyFastest();
    }
}
