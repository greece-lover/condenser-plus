// Counterpart-Defaults für Bengalisch.
// Weder pluralizers/bn noch date-names/bn vorhanden — Fallback auf en.

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
