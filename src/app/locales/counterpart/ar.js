// Counterpart-Defaults für Arabisch.
// Weder pluralizers/ar noch date-names/ar vorhanden — Fallback auf en.
// (Arabisch braucht eigentlich 6 Plural-Formen — Phase 2.)

'use strict';

module.exports = {
    counterpart: {
        names: require('date-names/en'),
        pluralize: require('pluralizers/en'),

        formats: {
            date: {
                default: '%a, %e %b %Y',
                long: '%A, %B %o, %Y',
                short: '%e %b',
            },

            time: {
                default: '%H:%M',
                long: '%H:%M:%S %z',
                short: '%H:%M',
            },

            datetime: {
                default: '%a, %e %b %Y %H:%M',
                long: '%A, %B %o, %Y %H:%M:%S %z',
                short: '%e %b %H:%M',
            },
        },
    },
};
