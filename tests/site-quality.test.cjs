const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const applePodcasts = 'https://podcasts.apple.com/us/podcast/the-lion-company-podcast/id1783214612';
const spotify = 'https://open.spotify.com/show/2zvyq6wVX8sAf7qXd9KQg5';

function read(file) {
    return fs.readFileSync(path.join(root, file), 'utf8');
}

// The homepage and media library keep their links in shared scripts, so their checks read the page and those scripts together.
function readPage(file) {
    if (file !== 'index.html' && file !== 'media.html') return read(file);
    return [read(file), read('assets/common.js'), read('assets/pod/podcast.js')].join('\n');
}

test('homepage and media library expose the official podcast platforms', () => {
    for (const file of ['index.html', 'media.html']) {
        const page = readPage(file);
        assert.match(page, new RegExp(applePodcasts.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        assert.match(page, new RegExp(spotify.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        assert.match(page, /https:\/\/thelioncompany\.podbean\.com\//);
        if (file === 'media.html') {
            assert.match(page, /data-platform="apple-podcasts"/);
            assert.match(page, /data-platform="spotify"/);
        }
    }
});

test('all public site pages use the active Instagram profile', () => {
    for (const file of ['index.html', 'media.html']) {
        const page = readPage(file);
        assert.doesNotMatch(page, /instagram\.com\/thelioncompanytx/);
        assert.match(page, /instagram\.com\/thelioncompanyglobal\//);
    }
});

test('search discovery files and canonical URLs are present', () => {
    const canonicalByFile = {
        'index.html': 'https://www.thelioncompany.org/',
        'media.html': 'https://www.thelioncompany.org/media',
        'privacy.html': 'https://www.thelioncompany.org/privacy',
        'terms.html': 'https://www.thelioncompany.org/terms'
    };

    for (const [file, canonical] of Object.entries(canonicalByFile)) {
        assert.match(read(file), new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
    }

    assert.match(read('robots.txt'), /Sitemap: https:\/\/www\.thelioncompany\.org\/sitemap\.xml/);
    const sitemap = read('sitemap.xml');
    for (const url of Object.values(canonicalByFile)) assert.ok(sitemap.includes(`<loc>${url}</loc>`));
});

test('homepage structured data describes the organization and podcast', () => {
    const index = read('index.html');
    const block = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(block, 'homepage JSON-LD should exist');
    const data = JSON.parse(block[1]);
    const types = data['@graph'].flatMap(item => item['@type']);
    assert.ok(types.includes('Organization'));
    assert.ok(types.includes('PodcastSeries'));
    const podcast = data['@graph'].find(item => item['@type'] === 'PodcastSeries');
    assert.ok(podcast.sameAs.includes(applePodcasts));
    assert.ok(podcast.sameAs.includes(spotify));
});

test('media library has searchable categories, unique cards, and direct YouTube fallbacks', () => {
    const media = read('media.html');
    assert.match(media, /id="media-search"/);
    for (const category of ['podcast', 'teaching', 'series', 'conversation', 'relationships']) {
        assert.match(media, new RegExp(`data-media-category="${category}"`));
        assert.match(media, new RegExp(`data-media-filter="${category}"`));
    }

    const ids = [...media.matchAll(/data-video-id="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, 'media cards should not be duplicated');
    assert.ok(ids.length >= 20, 'the media archive should remain populated');
    for (const id of ids) {
        assert.ok(media.includes(`href="https://www.youtube.com/watch?v=${id}"`));
        assert.ok(media.includes(`data-bg-image="https://img.youtube.com/vi/${id}/hqdefault.jpg"`));
    }
});

test('accessibility and performance enhancements remain wired', () => {
    for (const file of ['media.html', 'privacy.html', 'terms.html']) {
        const page = read(file);
        assert.match(page, /class="skip-link" href="#main"/);
        assert.match(page, /<main id="main"/);
        assert.match(page, /aria-expanded="false"/);
        assert.match(page, /aria-controls="menusheet"/);
        assert.match(page, /assets\/media\.js/);
        assert.doesNotMatch(page, /styles\.css|Cinzel/);
    }
    const mediaScript = read('assets/media.js');
    assert.match(mediaScript, /data-bg-image/);
    assert.match(mediaScript, /youtube-nocookie\.com\/embed/);
    assert.match(read('assets/media.css'), /prefers-reduced-motion:reduce/);
    const home = read('index.html');
    assert.match(home, /class="skip-link" href="#main"/);
    assert.match(home, /<main id="main"/);
    assert.match(home, /aria-controls="menusheet"/);
    assert.match(home, /prefers-reduced-motion: reduce/);

    const app = read('app.js');
    assert.match(app, /initLazyMediaImages\(\)/);
    assert.match(app, /initMediaLibrary\(\)/);
    assert.match(app, /podcast_platform_click/);
    assert.match(app, /youtube-nocookie\.com\/embed/);
    const styles = read('styles.css');
    assert.match(styles, /prefers-reduced-motion: reduce/);
    assert.match(styles, /\.video-container\s*{[^}]*position:\s*relative/s);
});

test('production config includes narrow security headers', () => {
    const config = JSON.parse(read('vercel.json'));
    const headers = Object.fromEntries(config.headers[0].headers.map(item => [item.key, item.value]));
    assert.equal(headers['X-Content-Type-Options'], 'nosniff');
    assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
    assert.match(headers['Permissions-Policy'], /camera=\(\)/);
});

test('homepage keeps every Phase 1 connection', () => {
    const page = readPage('index.html');
    for (const url of [
        'https://secure.subsplash.com/ui/access/RM87PQ/',
        'https://the-lion-company.printify.me/',
        'https://www.tiktok.com/@thelioncompanytx',
        'https://www.facebook.com/lioncompanytx',
        'https://www.youtube.com/channel/UCEy6IknxFCGag4UBVGn4wWg',
        'G-MNK2G065ES'
    ]) assert.ok(page.includes(url), `${url} should be on the homepage`);
    assert.match(page, /fetch\('\/api\/forms'/);
    for (const kind of ['prayer', 'contact', 'newsletter']) assert.match(page, new RegExp(`data-form="${kind}"`));
    assert.doesNotMatch(page, /Preview only/);
    assert.doesNotMatch(page, /id="mvt"|motion=full/);
});

test('homepage fonts are self-hosted and every preloaded font exists', () => {
    const home = read('index.html');
    assert.doesNotMatch(home, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
    const preloads = [...home.matchAll(/<link rel="preload" as="font" type="font\/woff2" href="([^"]+)" crossorigin>/g)].map(match => match[1]);
    assert.equal(preloads.length, 3);
    const faces = [...home.matchAll(/@font-face\{[^}]*src:url\(([^)]+)\)/g)].map(match => match[1]);
    assert.equal(faces.length, 6);
    for (const href of [...preloads, ...faces]) {
        assert.ok(href.startsWith('/assets/fonts/'), `${href} should be self-hosted`);
        assert.ok(fs.existsSync(path.join(root, href)), `${href} should exist on disk`);
    }
    for (const href of preloads) assert.ok(faces.includes(href), `${href} should be used by an @font-face rule`);
});

test('images and fonts are cached for a day while pages keep revalidating', () => {
    const config = JSON.parse(read('vercel.json'));
    const first = Object.fromEntries(config.headers[0].headers.map(item => [item.key, item.value]));
    assert.equal(config.headers[0].source, '/(.*)');
    assert.equal(first['X-Content-Type-Options'], 'nosniff');
    const rule = config.headers.find(entry => entry.source === '/assets/(.*)\\.(webp|jpg|png|svg|woff2)');
    assert.ok(rule, 'the asset image and font cache rule should exist');
    assert.deepEqual(rule.headers, [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }]);
    const icons = config.headers.find(entry => entry.source.includes('og-image-1200x630'));
    assert.ok(icons, 'the root image cache rule should exist');
    for (const file of ['lion_bg.jpg', 'og-image-1200x630.jpg', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon-512.png']) {
        assert.ok(new RegExp(`^${icons.source}$`).test(`/${file}`), `${file} should be cached`);
        assert.ok(fs.existsSync(path.join(root, file)), `${file} should exist`);
    }
    for (const page of ['/', '/index.html', '/assets/common.js', '/assets/pod/podcast.css']) {
        assert.ok(!config.headers.slice(1).some(entry => new RegExp(`^${entry.source}$`).test(page)), `${page} should not get a long cache`);
    }
    assert.ok(new RegExp(`^${rule.source}$`).test('/assets/fonts/anton-400-latin.woff2'));
});

test('every executable inline script on index, media, privacy and terms has its hash in the policy', () => {
    // Editing an inline script changes its hash: recompute it (the message below gives the new value) and update vercel.json.
    const crypto = require('node:crypto');
    const config = JSON.parse(read('vercel.json'));
    const all = Object.fromEntries(config.headers[0].headers.map(item => [item.key, item.value]));
    const csp = all['Content-Security-Policy'] || all['Content-Security-Policy-Report-Only'];
    assert.ok(csp, 'a CSP header should be configured');
    let scripts = 0;
    for (const file of ['index.html', 'media.html', 'privacy.html', 'terms.html']) {
        for (const match of read(file).matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
            scripts++;
            const hash = `'sha256-${crypto.createHash('sha256').update(match[1]).digest('base64')}'`;
            assert.ok(csp.includes(hash), `${file}: inline script starting "${match[1].trim().slice(0, 40)}" needs ${hash} in the CSP`);
        }
        assert.doesNotMatch(read(file), /\son[a-z]+="/, `${file} should have no inline event handlers (the policy does not allow them)`);
    }
    assert.ok(scripts >= 4, 'the homepage and media inline scripts should be found');
    for (const directive of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", 'report-uri /api/csp-report']) assert.ok(csp.includes(directive), directive);
    assert.doesNotMatch(csp, /'unsafe-eval'|script-src[^;]*'unsafe-inline'/);
    assert.equal(all['X-Frame-Options'], 'DENY');
    assert.equal(all['Cross-Origin-Opener-Policy'], 'same-origin');
    assert.equal(all['Permissions-Policy'], 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    assert.equal(all['Strict-Transport-Security'], undefined, 'HSTS stays at the Vercel default');
});

test('CSP reports are accepted with 204 and logged without query strings or form data', async () => {
    const handler = require('../api/csp-report.js');
    const recorder = () => ({ statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; }, setHeader(name, value) { this.headers[name] = value; }, end() { this.ended = true; } });
    const warn = console.warn, logged = [];
    console.warn = (...args) => logged.push(args.join(' '));
    try {
        const response = recorder();
        await handler({ method: 'POST', body: { 'csp-report': { 'document-uri': 'https://www.thelioncompany.org/?email=a@b.co#connect', 'effective-directive': 'script-src-elem', 'blocked-uri': 'https://evil.example/x.js?token=1' } } }, response);
        assert.equal(response.statusCode, 204);
        assert.equal(response.headers['Cache-Control'], 'no-store');
        assert.deepEqual(logged, ['CSP report-only: script-src-elem blocked https://evil.example on https://www.thelioncompany.org/']);
        const get = recorder();
        await handler({ method: 'GET' }, get);
        assert.equal(get.statusCode, 405);
        assert.equal(get.headers.Allow, 'POST');
    } finally {
        console.warn = warn;
    }
});

test('every public page loads Google Analytics and the main actions are counted', () => {
    for (const page of ['index.html', 'media.html', 'privacy.html', 'terms.html']) {
        const html = fs.readFileSync(path.join(root, page), 'utf8');
        assert.match(html, /googletagmanager\.com\/gtag\/js\?id=G-MNK2G065ES/, `${page} loads gtag.js`);
        assert.match(html, /gtag\('config', 'G-MNK2G065ES'\)/, `${page} configures the GA4 property`);
    }
    const common = fs.readFileSync(path.join(root, 'assets/common.js'), 'utf8');
    for (const name of ['form_submission_success', 'give_click', 'store_click', 'podcast_platform_click', 'video_play']) {
        assert.match(common, new RegExp(`lionTrack\\('${name}'`), `common.js sends ${name}`);
    }
    const policy = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).headers[0].headers
        .find((h) => /Content-Security-Policy/.test(h.key)).value;
    assert.match(policy, /script-src[^;]*https:\/\/www\.googletagmanager\.com/);
    assert.match(policy, /connect-src[^;]*https:\/\/\*\.google-analytics\.com[^;]*https:\/\/\*\.analytics\.google\.com/);
});
