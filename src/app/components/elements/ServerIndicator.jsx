import React, { Component } from 'react';
import {
    getActiveNode,
    getNodeHealth,
    onRotatorEvent,
} from 'app/utils/RotatorBootstrap';
import './ServerIndicator.scss';

function getActiveNodeRecord(activeUrl, nodes) {
    if (!activeUrl) return null;
    return nodes.find(n => n.url === activeUrl) || null;
}

// Map the monitor status to the existing CSS state names so the
// existing styling (--fast / --slow / --down / --unknown) keeps working.
function statusFromMonitor(node) {
    if (!node) return 'unknown';
    if (node.status === 'down') return 'down';
    if (node.status === 'degraded') return 'slow';
    if (node.status === 'ok') {
        if (node.latencyMs == null) return 'fast';
        return node.latencyMs < 500 ? 'fast' : 'slow';
    }
    return 'unknown';
}

class ServerIndicator extends Component {
    constructor(props) {
        super(props);
        this.state = {
            active: getActiveNode(),
            nodes: getNodeHealth(),
            open: false,
        };
        this.wrapRef = null;
        this.refresh = this.refresh.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.handleDocClick = this.handleDocClick.bind(this);
        this.stopPropagation = this.stopPropagation.bind(this);
        this.setWrap = this.setWrap.bind(this);
    }

    componentDidMount() {
        this.refresh();
        this.unsubscribe = onRotatorEvent(this.refresh);
        this.intervalId = setInterval(this.refresh, 5000);
        if (typeof document !== 'undefined') {
            document.addEventListener('click', this.handleDocClick);
        }
    }

    componentWillUnmount() {
        if (this.unsubscribe) this.unsubscribe();
        if (this.intervalId) clearInterval(this.intervalId);
        if (typeof document !== 'undefined') {
            document.removeEventListener('click', this.handleDocClick);
        }
    }

    refresh() {
        this.setState({
            active: getActiveNode(),
            nodes: getNodeHealth(),
        });
    }

    setWrap(el) {
        this.wrapRef = el;
    }

    handleDocClick(e) {
        if (!this.wrapRef) return;
        if (!this.wrapRef.contains(e.target)) {
            this.setState({ open: false });
        }
    }

    handleToggle() {
        this.setState(s => ({ open: !s.open }));
    }

    stopPropagation(e) {
        e.stopPropagation();
    }

    render() {
        const { active, nodes, open } = this.state;
        if (!active) return null;

        const activeRec = getActiveNodeRecord(active, nodes);
        const latency = activeRec ? activeRec.latencyMs : null;
        const status = statusFromMonitor(activeRec);
        const shortHost = active.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const ok = nodes.filter(n => n.status === 'ok').length;
        const total = nodes.length;
        const tooltipText = `${active} — ${
            latency != null ? `${latency} ms` : 'no probe yet'
        } (${ok}/${total} ok)`;

        const dotClass = nodeStatus => {
            if (nodeStatus === 'ok') return 'is-healthy';
            if (nodeStatus === 'degraded') return 'is-degraded';
            return 'is-down';
        };

        const className =
            'ServerIndicator ServerIndicator--' +
            status +
            (open ? ' ServerIndicator--open' : '');

        return (
            <div
                ref={this.setWrap}
                className={className}
                onClick={this.handleToggle}
                title={tooltipText}
            >
                <span className="ServerIndicator__dot" />
                <span className="ServerIndicator__host">{shortHost}</span>
                <span className="ServerIndicator__latency">
                    {latency != null ? `${latency} ms` : '—'}
                </span>
                {open && (
                    <div
                        className="ServerIndicator__panel"
                        onClick={this.stopPropagation}
                    >
                        <div className="ServerIndicator__panelHeader">
                            {ok} of {total} nodes ok
                        </div>
                        <table className="ServerIndicator__table">
                            <tbody>
                                {nodes.map(n => (
                                    <tr
                                        key={n.url}
                                        className={
                                            n.url === active ? 'is-active' : ''
                                        }
                                    >
                                        <td>
                                            <span
                                                className={
                                                    'ServerIndicator__nodedot ' +
                                                    dotClass(n.status)
                                                }
                                                title={n.status || 'unknown'}
                                            />
                                        </td>
                                        <td className="ServerIndicator__nodehost">
                                            {n.url.replace(/^https?:\/\//, '')}
                                        </td>
                                        <td className="ServerIndicator__nodelatency">
                                            {n.latencyMs != null
                                                ? `${n.latencyMs} ms`
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }
}

export default ServerIndicator;
