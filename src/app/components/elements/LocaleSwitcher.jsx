import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as appActions from 'app/redux/AppReducer';
import {
    LOCALE_NAMES,
    LOCALE_SHORT_LABELS,
} from 'app/utils/LocaleNames';

const styles = {
    container: {
        position: 'relative',
        display: 'inline-block',
        marginRight: 12,
        verticalAlign: 'middle',
    },
    button: {
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'inherit',
        textDecoration: 'none',
        padding: '4px 6px',
        borderRadius: 3,
        userSelect: 'none',
    },
    caret: {
        marginLeft: 3,
        fontSize: '0.7rem',
        opacity: 0.7,
    },
    menu: {
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 4,
        listStyle: 'none',
        padding: '4px 0',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        minWidth: 170,
        maxHeight: 360,
        overflowY: 'auto',
        zIndex: 1000,
    },
    item: {
        margin: 0,
        padding: 0,
    },
    itemLink: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        cursor: 'pointer',
        color: '#222',
        textDecoration: 'none',
        fontSize: '0.85rem',
    },
    itemLinkActive: {
        background: '#eef4fb',
        fontWeight: 600,
    },
    code: {
        display: 'inline-block',
        minWidth: 22,
        fontWeight: 600,
        opacity: 0.7,
    },
};

class LocaleSwitcher extends Component {
    static propTypes = {
        locale: PropTypes.string,
        user_preferences: PropTypes.object,
        setUserPreferences: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = { open: false };
        this.handleToggle = this.handleToggle.bind(this);
        this.handlePick = this.handlePick.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.setContainerEl = el => {
            this.containerEl = el;
        };
    }

    componentDidMount() {
        if (typeof document !== 'undefined') {
            document.addEventListener('mousedown', this.handleClickOutside);
        }
    }

    componentWillUnmount() {
        if (typeof document !== 'undefined') {
            document.removeEventListener('mousedown', this.handleClickOutside);
        }
    }

    handleClickOutside(e) {
        if (this.containerEl && !this.containerEl.contains(e.target)) {
            if (this.state.open) this.setState({ open: false });
        }
    }

    handleToggle(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ open: !this.state.open });
    }

    handlePick(code, e) {
        e.preventDefault();
        e.stopPropagation();
        const { user_preferences, setUserPreferences } = this.props;
        setUserPreferences({ ...user_preferences, locale: code });
        this.setState({ open: false });
    }

    render() {
        const { locale } = this.props;
        const { open } = this.state;
        const current =
            locale && LOCALE_SHORT_LABELS[locale] ? locale : 'en';
        const label = LOCALE_SHORT_LABELS[current] || 'EN';

        return (
            <span
                className="LocaleSwitcher"
                ref={this.setContainerEl}
                style={styles.container}
            >
                <a
                    className="LocaleSwitcher__button"
                    onClick={this.handleToggle}
                    title={LOCALE_NAMES[current] || 'Language'}
                    style={styles.button}
                >
                    {label}
                    <span style={styles.caret}>▾</span>
                </a>
                {open && (
                    <ul style={styles.menu}>
                        {Object.keys(LOCALE_NAMES).map(code => {
                            const itemStyle =
                                code === current
                                    ? {
                                          ...styles.itemLink,
                                          ...styles.itemLinkActive,
                                      }
                                    : styles.itemLink;
                            return (
                                <li key={code} style={styles.item}>
                                    <a
                                        onClick={e =>
                                            this.handlePick(code, e)
                                        }
                                        style={itemStyle}
                                    >
                                        <span style={styles.code}>
                                            {LOCALE_SHORT_LABELS[code]}
                                        </span>
                                        <span>{LOCALE_NAMES[code]}</span>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </span>
        );
    }
}

export default connect(
    state => ({
        locale: state.app.getIn(['user_preferences', 'locale']),
        user_preferences: state.app.get('user_preferences').toJS(),
    }),
    dispatch => ({
        setUserPreferences: payload => {
            dispatch(appActions.setUserPreferences(payload));
        },
    })
)(LocaleSwitcher);
