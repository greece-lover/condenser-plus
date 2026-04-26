import React, { Component } from 'react';
import {
    getActiveNode,
    getNodeHealth,
    onRotatorEvent,
} from 'app/utils/RotatorBootstrap';
import './ServerIndicator.scss';

function getActiveLatency(activeUrl, nodes) {
    if (!activeUrl) return null;
    const node = nodes.find(n => n.url === activeUrl);
    return node ? node.latencyMs : null;
}

function statusFromLatency(ms) {
    if (ms == null) return 'unknown';
    if (ms < 500) return 'fast';
    if (ms < 1500) return 'slow';
    return 'down';
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

        const latency = getActiveLatency(active, nodes);
        const status = statusFromLatency(latency);
        const shortHost = active.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const healthy = nodes.filter(n => n.isHealthy).length;
        const total = nodes.length;
        const tooltipText = `${active} — ${
            latency != null ? `${latency} ms` : 'no probe yet'
        } (${healthy}/${total} healthy)`;

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
                            {healthy} of {total} nodes healthy
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
                                                    'ServerIndicator__nodedot is-' +
                                                    (n.isHealthy ? 'healthy' : 'down')
                                                }
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
