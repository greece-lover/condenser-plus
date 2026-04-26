# Fixes applied to condenser-plus

This document tracks bugs fixed in this fork that were present in upstream Condenser. Each entry explains the problem, the fix, and how to verify.

## 1. Steemit-Images proxy bypass

**Date:** 2026-04-26
**File patched:** `src/app/utils/ProxifyUrl.js` (1 file, ~50 lines removed)

### Problem

Upstream Condenser routes inline image URLs through `https://steemitimages.com/<size>/<originalUrl>` (or the newer `<proxy>/p/<base58>?width=…` form). This proxy provides automatic resizing and caching — but when it experiences slowdowns or outages, all images on the page fail to load. Users see broken thumbnails across feed, trending, and post pages.

### Fix

The function `proxifyImageUrl(url, dimensions)` in `src/app/utils/ProxifyUrl.js` was simplified to do **only** the strip step (remove existing proxy wraps) and then return the original URL unchanged. The `dimensions` argument is accepted for call-site compatibility but ignored. All four call sites in `src/shared/HtmlReady.js` now receive the original CDN URL and embed it directly in `<img src=…>`.

### Tradeoff

Loses automatic image resizing (no `640x0/` etc.) and proxy-side caching. Bandwidth for users may be marginally higher if original images are large. In practice, modern CDNs handle sizing efficiently and the reliability gain outweighs the cost — this is the same conclusion that drove the identical fix in Welako (welako.app).

### Verification

Open any post in the demo (`http://192.168.217.131:8080/<tag>/@<author>/<permlink>`) and inspect image elements in browser DevTools. Image URLs should now point directly to `cdn.steemitimages.com/...` — never to `steemitimages.com/640x0/...` or `steemitimages.com/p/...`. Avatars are unaffected (they use a different code path; see Klasse 3 below).

### Inventory of `steemitimages.com` matches in the source

The grep over `src/` returned 47 hits in 12 files. They split cleanly into three classes — the fix touches only Klasse 1.

#### Klasse 1 — central wrapper, the only file patched

| File | What |
|---|---|
| `src/app/utils/ProxifyUrl.js` | The wrap function `proxifyImageUrl(url, dimensions)`. Single point where inline image URLs were being wrapped. Reduced to pure strip-then-return. |

#### Klasse 2 — call sites of the wrapper, fix without touching them

| File | Lines |
|---|---|
| `src/shared/HtmlReady.js` | 148, 263, 277, 288 — four calls to `proxifyImageUrl(...)` with various `dimensions` arguments |

These all now receive the original URL because Klasse 1 ignores `dimensions`.

#### Klasse 3 — DO NOT touch (matches that look similar but aren't proxy wraps)

A future contributor scanning for `steemitimages.com` will hit these too. Each one looks like it might want removing — none of them do. Leave them alone.

| File | What it is | Why **not** to touch |
|---|---|---|
| `src/app/components/elements/Userpic.jsx:18` | `imageProxy() + 'u/' + account + '/avatar' + size` | This builds the **direct Steemit avatar API URL** (`steemitimages.com/u/<user>/avatarmedium`). It is not a proxy wrap — it is the avatar source itself. Removing it kills all avatars in the UI. |
| `src/app/utils/SanitizeConfig.js:210-211` | `href.startsWith('https://steemitimages.com')` in an allowlist | HTML sanitiser whitelist for embedded image URLs in user content. Removing these entries makes the sanitiser **block** all Steemit-hosted images. |
| `src/server/app_render.jsx:125` | `image_host` default `'https://steemitimages.com/'` in initial state | Fallback when `img_proxy_prefix` config is unset; passed to the browser to construct avatar URLs. |
| `src/server/server.js:327` | Same `image_host` default in the `/avatar/:username` Koa route | Server-side avatar resolver. |
| `src/app/components/modules/PostTemplates.jsx` | many | **Static example URLs** in default post templates (e.g. `https://cdn.steemitimages.com/.../border_06.png`). These are direct CDN links already, no wrap involved. They are content, not infrastructure. |
| `src/shared/HtmlReady.test.js`, `src/app/utils/ProxifyUrl.test.js` | many | Tests. They include `steemitimages.com` strings as fixtures for the wrap/strip logic. After the fix, some assertions will fail — that's expected; the wrap behavior is gone. CI is not active in this fork's day-to-day. |
| `src/app/components/elements/Userpic.story.jsx:11` | `global.$STM_Config = { img_proxy_prefix: 'https://steemitimages.com/' }` | Storybook story setup. Not in production code path. |

**Rule of thumb:** if it builds a URL out of `imageProxy() + something`, or it's a sanitiser allowlist, or it's static content/test fixture — don't touch it. Only the wrap function in `ProxifyUrl.js` was the source of the bug.

### Origin of this fix

Same pattern as the fix Holger applied to [Welako](https://welako.app), where the identical proxy dependency caused identical visibility issues.

---

## Format for future entries

Every fix entry should answer: what was the bug, where was it (one or more files), what was the fix (in plain words plus diff stats), what's the tradeoff, and how does someone verify it works. Include any sibling matches that look related but should be left alone.
