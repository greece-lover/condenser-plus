import { api } from '@steemit/steem-js';

// Currently active RPC node — written by the rotator on every auto-switch
// AND by the manual node selector. Reading this gives "what is api pointed
// at right now". This is volatile from the user's perspective.
export const LOCALSTORAGE_RPC_NODE_KEY = 'steemSelectedRpc';

// User-pinned RPC node — set by the user in Settings, never written by the
// rotator. When this is non-empty, the rotator should respect it and stop
// auto-switching. When empty, the rotator runs in auto-mode.
export const LOCALSTORAGE_USER_PREFERRED_RPC_KEY = 'userPreferredRpc';

export function changeRPCNodeToDefault(
    rpcNode = $STM_Config.steemd_connection_client
) {
    console.log(`>> RPC Node changed to ${rpcNode}`);

    localStorage.setItem(LOCALSTORAGE_RPC_NODE_KEY, rpcNode);

    api.setOptions({
        url: rpcNode,
    });
}

export function getCurrentRPCNode() {
    return localStorage.getItem(LOCALSTORAGE_RPC_NODE_KEY);
}

// === user pin ===

export function getUserPreferredRpc() {
    if (typeof localStorage === 'undefined') return null;
    const v = localStorage.getItem(LOCALSTORAGE_USER_PREFERRED_RPC_KEY);
    return v && v.length > 0 ? v : null;
}

export function setUserPreferredRpc(url) {
    if (typeof localStorage === 'undefined') return;
    if (url) {
        localStorage.setItem(LOCALSTORAGE_USER_PREFERRED_RPC_KEY, url);
    } else {
        localStorage.removeItem(LOCALSTORAGE_USER_PREFERRED_RPC_KEY);
    }
}

export function clearUserPreferredRpc() {
    setUserPreferredRpc(null);
}
