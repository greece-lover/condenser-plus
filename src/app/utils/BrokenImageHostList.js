/**
 * BrokenImageHostList.js
 *
 * Liste von Bild-Hosts, die in condenser-plus als kaputt erkannt werden.
 * Bilder von diesen Hosts werden durch Platzhalter ersetzt.
 *
 * Pflege: Wenn neue tote Hosts entdeckt werden, hier ergänzen.
 * Mit jedem condenser-plus Update wird die Liste aktualisiert.
 *
 * Erstellt: 2026-04-27
 */

// Pauschal tote Hosts — alle Bilder von hier sind kaputt
export const BROKEN_IMAGE_HOSTS = [
    'ipfs.busy.org',                          // DNS NXDOMAIN, Service abgeschaltet
    'fastly.picsum.photos',                   // Pfad deprecated, alle URLs HTTP 400
    'steem-hive-bot-manager.herokuapp.com',   // Heroku Free-Tier Ende 2022 abgeschaltet
];

// Discord-Hosts — nur abgelaufene URLs als kaputt einstufen (ex-Parameter prüfen)
export const DISCORD_HOSTS = [
    'media.discordapp.net',
    'cdn.discordapp.com',
];

// Platzhalter-Bilder (auf steemitimages.com gehostet, dauerhaft erreichbar)
export const PLACEHOLDER_IMAGES = {
    large:  'https://cdn.steemitimages.com/DQmYLjVprALxu8XfiLBw2n234UKsBgTnGyMjVxSkToV7u9M/image.png',  // 1200x600
    medium: 'https://cdn.steemitimages.com/DQmckWJuL5jXUN9YXinr9XJNLPhnJEuD4NXdp5k9YXAfbiH/image.png',  // 600x400
    small:  'https://cdn.steemitimages.com/DQmPXCXgmrD6bKMyhZwfA6PGGdyaJ2XNkjrTD78rYc6psBX/image.png',  // 400x400
};

// Klick-Ziel: Steem-Beitrag der die Platzhalter erklärt
export const PLACEHOLDER_INFO_URL =
    'https://steemit.com/condenserplus/@greece-lover/condenser-plus-broken-images-explained';

/**
 * Prüft ob eine URL pauschal als kaputt gilt (Host in BROKEN_IMAGE_HOSTS).
 */
export function isBrokenHost(url) {
    try {
        const u = new URL(url);
        return BROKEN_IMAGE_HOSTS.indexOf(u.hostname) !== -1;
    } catch (e) {
        return false;
    }
}

/**
 * Prüft ob eine Discord-CDN-URL anhand des ex-Parameters bereits abgelaufen ist.
 */
export function isExpiredDiscordUrl(url) {
    try {
        const u = new URL(url);
        if (DISCORD_HOSTS.indexOf(u.hostname) === -1) return false;
        const ex = u.searchParams.get('ex');
        if (!ex) return false; // unsignierte URL — lieber durchlassen
        const expiresAt = parseInt(ex, 16);
        if (!Number.isFinite(expiresAt)) return false;
        return expiresAt < Math.floor(Date.now() / 1000);
    } catch (e) {
        return false;
    }
}

/**
 * Hauptfunktion: Ist diese URL ein bekannt-kaputtes Bild?
 */
export function isBrokenImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (isBrokenHost(url)) return true;
    if (isExpiredDiscordUrl(url)) return true;
    return false;
}

/**
 * Wählt die passende Platzhalter-URL basierend auf Bild-Dimensionen.
 */
export function getPlaceholderForSize(width, height) {
    if (!width || !height) return PLACEHOLDER_IMAGES.medium;
    if (width <= 250 && height <= 250) return PLACEHOLDER_IMAGES.small;
    const ratio = width / height;
    if (width >= 800 && ratio >= 1.6) return PLACEHOLDER_IMAGES.large;
    return PLACEHOLDER_IMAGES.medium;
}
