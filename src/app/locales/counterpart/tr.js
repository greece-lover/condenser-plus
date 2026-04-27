// Counterpart-Defaults für Türkisch.
// pluralizers/tr ist nicht verfügbar — Fallback auf en.

'use strict';

module.exports = {
    counterpart: {
        names: require('date-names/tr'),
        pluralize: require('pluralizers/en'),

        formats: {
            date: {
                default: '%a, %e %b %Y',
                long: '%A, %e %B %Y',
                short: '%e %b',
            },

            time: {
                default: '%H:%M',
                long: '%H:%M:%S %z',
                short: '%H:%M',
            },

            datetime: {
                default: '%a, %e %b %Y %H:%M',
                long: '%A, %e %B %Y %H:%M:%S %z',
                short: '%e %b %H:%M',
            },
        },
    },
};
