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
    for (const file of ['privacy.html', 'terms.html']) {
        const page = read(file);
        assert.match(page, /class="skip-link"/);
        assert.match(page, /aria-expanded="false"/);
        assert.match(page, /aria-controls="mobile-menu"/);
    }
    const media = read('media.html');
    assert.match(media, /class="skip-link" href="#main"/);
    assert.match(media, /<main id="main"/);
    assert.match(media, /aria-controls="menusheet"/);
    assert.match(media, /assets\/media\.js/);
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
