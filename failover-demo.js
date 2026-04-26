// failover-demo.js — Demonstrates steem-node-rotator failover.
//
// Run inside the condenser-dev container:
//   docker exec -it condenser-dev node /app/failover-demo.js
//
// What it does:
// 1. Probes a list of real Steem nodes plus one deliberately broken URL.
// 2. Reports each node's health and measured latency.
// 3. Calls a real RPC method via the rotator — if the first node fails, the
//    rotator transparently falls over to the next one.
// 4. Forces all real nodes into cooldown to demonstrate AllNodesDownError.

/* eslint-disable no-console */

// Node 12 lacks both global fetch and global AbortController. Real browsers
// have both — this shim is only here because the dev container runs Node 12.
if (typeof globalThis.AbortController === 'undefined') {
    const ac = require('abort-controller');
    globalThis.AbortController = ac.AbortController || ac;
    globalThis.AbortSignal = ac.AbortSignal;
}
let fetchImpl;
try {
    fetchImpl = require('node-fetch');
} catch (e) {
    console.error('node-fetch not installed, run: yarn add node-fetch@2 inside container');
    process.exit(1);
}

const { SteemRotator, AllNodesDownError } = require('steem-node-rotator');

const NODES = [
    'https://broken.example.invalid',   // intentional bad node, fails first
    'https://api.steemit.com',
    'https://api.steemyy.com',
    'https://api.justyy.com',
    'https://steem.nirmaha.com',
];

const rotator = new SteemRotator({
    nodes: NODES,
    timeoutMs: 5000,
    cooldownMs: 30_000,
    fetchImpl,
    onNodeFailure: ({ url, reason }) =>
        console.log(`  [failover] ${url} -> ${reason}`),
    onNodeRecovery: ({ url, latencyMs }) =>
        console.log(`  [recovered] ${url} (${latencyMs} ms)`),
});

function table(label) {
    console.log(`\n=== ${label} ===`);
    for (const n of rotator.nodes()) {
        const status = n.isHealthy ? 'OK ' : 'BAD';
        const lat = n.latencyMs !== null ? `${n.latencyMs} ms`.padStart(7) : '   --  ';
        const reason = n.failureReason ? `  (${n.failureReason})` : '';
        console.log(`  ${status}  ${lat}  ${n.url}${reason}`);
    }
}

async function main() {
    console.log('Probing every node once...');
    for (const n of NODES) {
        await rotator.probeNode(n);
    }
    table('After initial probe round');

    console.log('\nMaking a real RPC call (rotator will skip the broken node)...');
    try {
        const props = await rotator.call('condenser_api.get_dynamic_global_properties', []);
        console.log(`  -> head_block_number = ${props.head_block_number}`);
    } catch (err) {
        console.log(`  -> failed: ${err.message}`);
    }
    table('After successful call');

    console.log('\nForcing every real node into cooldown to demonstrate AllNodesDownError...');
    for (const n of NODES) {
        rotator.registry.markUnhealthy(n, 'forced for demo');
    }
    try {
        await rotator.call('condenser_api.get_dynamic_global_properties', []);
        console.log('  -> unexpected success');
    } catch (err) {
        if (err instanceof AllNodesDownError) {
            console.log(`  -> AllNodesDownError caught (${err.attempts.length} attempts):`);
            err.attempts.forEach((a) => console.log(`     - ${a.url}: ${a.reason}`));
        } else {
            console.log(`  -> unexpected error: ${err.message}`);
        }
    }

    console.log('\nDone.');
}

main().catch((e) => {
    console.error('fatal', e);
    process.exit(1);
});
