// Newest podcast episode, read from the Podbean feed so the homepage never
// falls behind. Cached at the edge for 30 minutes; if Podbean is down the edge
// keeps serving the last good answer for up to a week.
const FEED_URL = 'https://feed.podbean.com/thelioncompany/feed.xml';
const FEED_TIMEOUT_MS = 5000;

function decode(value) {
    const text = String(value || '').trim();
    const cdata = text.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
    if (cdata) return cdata[1].trim();
    return text
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .trim();
}

function tag(xml, name) {
    const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
    return match ? decode(match[1]) : '';
}

function parseLatest(xml) {
    const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
    // Trailers and bonus clips are not "the newest episode".
    const item = items.find((entry) => !/^(trailer|bonus)$/i.test(tag(entry, 'itunes:episodeType'))) || items[0];
    if (!item) return null;
    const rawTitle = tag(item, 'title');
    const fromTitle = rawTitle.match(/\(?\s*(?:Episode|Ep\.?)\s*(\d+)\s*\)?/i);
    const number = tag(item, 'itunes:episode') || (fromTitle ? fromTitle[1] : '');
    const title = rawTitle.replace(/\s*\(\s*(?:Episode|Ep\.?)\s*\d+\s*\)\s*$/i, '').trim();
    const link = tag(item, 'link');
    return {
        number: number ? Number(number) : null,
        title,
        url: /^https:\/\//.test(link) ? link : '',
        published: tag(item, 'pubDate')
    };
}

module.exports = async function handler(request, response) {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.setHeader('Allow', 'GET, HEAD');
        response.setHeader('Cache-Control', 'no-store');
        return response.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
    }
    try {
        const feed = await fetch(FEED_URL, {
            headers: { 'User-Agent': 'thelioncompany.org' },
            signal: AbortSignal.timeout(FEED_TIMEOUT_MS)
        });
        if (!feed.ok) throw new Error(`Feed returned ${feed.status}`);
        const latest = parseLatest(await feed.text());
        if (!latest || !latest.title) throw new Error('No episode in feed');
        response.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400, stale-if-error=604800');
        response.status(200).end(JSON.stringify(latest));
    } catch (error) {
        console.error('Latest episode lookup failed:', error.message);
        response.setHeader('Cache-Control', 'no-store');
        response.status(502).end(JSON.stringify({ error: 'Feed unavailable' }));
    }
};

module.exports.parseLatest = parseLatest;
