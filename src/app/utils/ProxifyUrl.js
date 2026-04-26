/*global $STM_Config:false*/
import base58 from 'bs58';

/**
 * this regular expression should capture all possible proxy domains
 * Possible URL schemes are:
 * <proxy>/<file url>
 * <proxy>/{int}x{int}/<external domain and file url>
 * <proxy>/{int}x{int}/[...<proxy>/{int}x{int}/]<external domain and file url>
 * <proxy>/{int}x{int}/[<proxy>/{int}x{int}/]<proxy>/<file url>
 * @type {RegExp}
 */
const rProxyDomain = /^http(s)?:\/\/steemit(dev|stage)?images.com\//g;
const rProxyDomainsDimensions = /http(s)?:\/\/steemit(dev|stage)?images.com\/([0-9]+x[0-9]+)\//g;
const NATURAL_SIZE = '0x0/';
const CAPPED_SIZE = '640x0/';
const DOUBLE_CAPPED_SIZE = '1280x0/';

export const imageProxy = () => $STM_Config.img_proxy_prefix;
export const defaultSrcSet = url => {
    // Back-compat: legacy path-based sizing
    if (typeof url === 'string' && url.includes(CAPPED_SIZE)) {
        return `${url} 1x, ${url.replace(CAPPED_SIZE, DOUBLE_CAPPED_SIZE)} 2x`;
    }
    // New: /p/:base58url?width=640 => 2x is width=1280
    try {
        const u = new URL(url);
        const width = Number.parseInt(u.searchParams.get('width'), 10);
        if (!Number.isFinite(width) || width <= 0) return `${url} 1x`;
        u.searchParams.set('width', String(width * 2));
        return `${url} 1x, ${u.toString()} 2x`;
    } catch (e) {
        return `${url} 1x`;
    }
};
export const isDefaultImageSize = url => {
    // Back-compat: legacy path-based sizing
    if (url && url.startsWith(`${imageProxy()}${CAPPED_SIZE}`)) return true;
    try {
        const u = new URL(url);
        return (
            u.pathname.includes('/p/') &&
            u.searchParams.get('width') === String(defaultWidth())
        );
    } catch (e) {
        return false;
    }
};
export const defaultWidth = () => Number.parseInt(CAPPED_SIZE.split('x')[0]);

function ensureTrailingSlash(s) {
    return typeof s === 'string' && s.endsWith('/') ? s : `${s}/`;
}

function registrableDomain(hostname) {
    if (!hostname) return '';
    const parts = hostname
        .toLowerCase()
        .split('.')
        .filter(Boolean);
    if (parts.length <= 2) return parts.join('.');
    // Good enough for our current configs (e.g. steemitimages.com).
    return parts.slice(-2).join('.');
}

function isFirstPartyImageHost(hostname) {
    try {
        const proxyHost = new URL(imageProxy()).hostname;
        const base = registrableDomain(proxyHost);
        const h = (hostname || '').toLowerCase();
        return h === base || h.endsWith(`.${base}`);
    } catch (e) {
        return false;
    }
}

/**
 * Strips all proxy domains from the beginning of the url, returning the
 * original CDN URL unchanged. The `dimensions` argument is accepted for
 * call-site compatibility but ignored — image URLs are no longer wrapped
 * through a proxy.
 *
 * Rationale: outages and slowdowns of the Steemit-Images proxy used to
 * make all images on the page fail to load. Direct CDN loading is more
 * reliable; modern browsers/CDNs handle sizing and caching adequately.
 *
 * @param {string} url
 * @param {string|boolean} dimensions - ignored, kept for backward compatibility
 * @returns string
 */
export function proxifyImageUrl(url, dimensions = false) {
    // eslint-disable-next-line no-unused-vars
    const _ignoredDimensions = dimensions;
    const proxyList = url.match(rProxyDomainsDimensions);
    let respUrl = url;
    if (proxyList) {
        const lastProxy = proxyList[proxyList.length - 1];
        respUrl = url.substring(url.lastIndexOf(lastProxy) + lastProxy.length);
    }
    return respUrl;
}
