const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLatest } = require('../api/latest-episode.js');

test('reads the newest episode number and title from the Podbean feed', () => {
    const xml = `<rss><channel><title>The Lion Company Podcast</title>
      <item><title>Stop Trying to Win Her Back (Episode 9)</title>
      <link>https://thelioncompany.podbean.com/e/stop-trying-to-win-her-back-episode-9/</link>
      <pubDate>Fri, 02 Oct 2026 06:00:00 -0500</pubDate><itunes:episode>9</itunes:episode></item>
      <item><title>What Silence Costs</title><itunes:episode>8</itunes:episode></item></channel></rss>`;
    assert.deepEqual(parseLatest(xml), {
        number: 9,
        title: 'Stop Trying to Win Her Back',
        url: 'https://thelioncompany.podbean.com/e/stop-trying-to-win-her-back-episode-9/',
        published: 'Fri, 02 Oct 2026 06:00:00 -0500'
    });
});

test('returns null for a feed with no episodes', () => {
    assert.equal(parseLatest('<rss><channel></channel></rss>'), null);
});

const handler = require('../api/latest-episode.js');

function responseRecorder() {
    return {
        statusCode: 200,
        headers: {},
        status(code) { this.statusCode = code; return this; },
        setHeader(name, value) { this.headers[name] = value; },
        end(value) { this.body = value === undefined ? undefined : JSON.parse(value); }
    };
}

test.afterEach(() => { global.fetch = undefined; });

test('decodes a CDATA title wrapped in whitespace', () => {
    const latest = parseLatest(`<rss><channel><item><title>
        <![CDATA[Faith & Fire (Episode 10)]]>
      </title><link>https://thelioncompany.podbean.com/e/ten/</link><itunes:episode>10</itunes:episode></item></channel></rss>`);
    assert.equal(latest.number, 10);
    assert.equal(latest.title, 'Faith & Fire');
    assert.equal(latest.url, 'https://thelioncompany.podbean.com/e/ten/');
});

test('decodes numeric and named entities, &amp; last', () => {
    assert.equal(parseLatest('<item><title>God&#8217;s Will &amp; You</title></item>').title, 'God’s Will & You');
    assert.equal(parseLatest('<item><title>&#x201C;Bold&#x201D; &quot;as&quot; a lion&apos;s</title></item>').title, '“Bold” "as" a lion\'s');
    assert.equal(parseLatest('<item><title>Ask &amp;lt;anything&amp;gt;</title></item>').title, 'Ask &lt;anything&gt;');
});

test('reads <item> and tags that carry attributes', () => {
    const latest = parseLatest(`<rss><channel><item rdf:about="x"><title type="text">Stop Trying to Win Her Back</title>
      <link rel="alternate">https://thelioncompany.podbean.com/e/nine/</link><itunes:episode>9</itunes:episode></item></channel></rss>`);
    assert.equal(latest.number, 9);
    assert.equal(latest.title, 'Stop Trying to Win Her Back');
    assert.equal(latest.url, 'https://thelioncompany.podbean.com/e/nine/');
});

test('skips trailers and bonus clips', () => {
    const latest = parseLatest(`<rss><channel>
      <item><title>Season 3 trailer</title><itunes:episodeType>trailer</itunes:episodeType></item>
      <item><title>A bonus clip</title><itunes:episodeType>bonus</itunes:episodeType></item>
      <item><title>Stop Trying to Win Her Back (Episode 9)</title><itunes:episodeType>full</itunes:episodeType></item>
    </channel></rss>`);
    assert.equal(latest.number, 9);
    assert.equal(latest.title, 'Stop Trying to Win Her Back');
});

test('never returns a non-https episode link', () => {
    for (const link of ['javascript:alert(1)', 'http://thelioncompany.podbean.com/e/nine/', '//evil.example/x']) {
        assert.equal(parseLatest(`<rss><channel><item><title>Ep</title><link>${link}</link></item></channel></rss>`).url, '');
    }
});

test('POST gives 405 with Allow: GET, HEAD and never reads the feed', async () => {
    global.fetch = async () => { throw new Error('fetch should not be called'); };
    const response = responseRecorder();
    await handler({ method: 'POST', headers: {} }, response);
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.Allow, 'GET, HEAD');
    assert.equal(response.headers['Cache-Control'], 'no-store');
});

test('a good feed is served as UTF-8 JSON and kept at the edge if Podbean later fails', async () => {
    global.fetch = async () => ({ ok: true, status: 200, text: async () => '<rss><channel><item><title>Stop Trying to Win Her Back (Episode 9)</title></item></channel></rss>' });
    const response = responseRecorder();
    await handler({ method: 'GET', headers: {} }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['Content-Type'], 'application/json; charset=utf-8');
    assert.match(response.headers['Cache-Control'], /s-maxage=1800/);
    assert.match(response.headers['Cache-Control'], /stale-if-error=604800/);
    assert.equal(response.body.number, 9);
});

test('a feed that hangs gives 502 after about 5 seconds', async () => {
    global.fetch = (_url, options) => new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(options.signal.reason));
    });
    const errors = console.error;
    console.error = () => {};
    // AbortSignal.timeout does not hold the event loop open; a real request's socket would
    const keepAlive = setInterval(() => {}, 1000);
    const started = Date.now();
    const response = responseRecorder();
    try {
        await handler({ method: 'GET', headers: {} }, response);
    } finally {
        clearInterval(keepAlive);
        console.error = errors;
    }
    const took = Date.now() - started;
    assert.equal(response.statusCode, 502);
    assert.deepEqual(response.body, { error: 'Feed unavailable' });
    assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.ok(took >= 4900 && took < 7000, `took ${took} ms`);
});
