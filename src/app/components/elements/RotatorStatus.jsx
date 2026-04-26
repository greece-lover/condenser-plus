import React, { useEffect, useState } from 'react';
import {
    getActiveNode,
    onRotatorEvent,
    getNodeHealth,
} from 'app/utils/RotatorBootstrap';

// Small visual indicator showing which Steem RPC node is currently in use.
// Click to expand and see all configured nodes with their last known latency.
const styles = {
    wrap: {
        position: 'fixed',
        bottom: '8px',
        right: '8px',
        zIndex: 9999,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        background: 'rgba(20,20,20,0.85)',
        color: '#e8e8e8',
        padding: '6px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        userSelect: 'none',
        maxWidth: '320px',
    },
    dot: (ok) => ({
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: ok ? '#3fb950' : '#f85149',
        marginRight: '6px',
        verticalAlign: 'middle',
    }),
    table: {
        marginTop: '8px',
        borderCollapse: 'collapse',
        width: '100%',
    },
    cell: { padding: '2px 6px 2px 0', fontVariantNumeric: 'tabular-nums' },
};

export default function RotatorStatus() {
    const [active, setActive] = useState(getActiveNode());
    const [open, setOpen] = useState(false);
    const [nodes, setNodes] = useState(getNodeHealth());

    useEffect(() => {
        const unsub = onRotatorEvent(() => {
            setActive(getActiveNode());
            setNodes(getNodeHealth());
        });
        const t = setInterval(() => setNodes(getNodeHealth()), 5000);
        return () => { unsub(); clearInterval(t); };
    }, []);

    if (!active) return null;
    const short = active.replace(/^https?:\/\//, '');

    return (
        <div style={styles.wrap} onClick={() => setOpen(o => !o)} title="steem-node-rotator demo — click to expand">
            <span style={styles.dot(true)} />
            <strong>node:</strong> {short}
            {open && (
                <table style={styles.table}>
                    <tbody>
                        {nodes.map(n => (
                            <tr key={n.url}>
                                <td style={styles.cell}><span style={styles.dot(n.isHealthy)} /></td>
                                <td style={styles.cell}>{n.url.replace(/^https?:\/\//, '')}</td>
                                <td style={{ ...styles.cell, textAlign: 'right' }}>
                                    {n.latencyMs !== null ? n.latencyMs + ' ms' : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
