// Counterpart-Defaults für Portugiesisch (pt-br als Basis).

'use strict';

module.exports = {
    counterpart: {
        names: require('date-names/pt-br'),
        pluralize: require('pluralizers/pt-br'),

        formats: {
            date: {
                default: '%a, %e %b %Y',
                long: '%A, %e de %B de %Y',
                short: '%e %b',
            },

            time: {
                default: '%H:%M',
                long: '%H:%M:%S %z',
                short: '%H:%M',
            },

            datetime: {
                default: '%a, %e %b %Y %H:%M',
                long: '%A, %e de %B de %Y %H:%M:%S %z',
                short: '%e %b %H:%M',
            },
        },
    },
};
