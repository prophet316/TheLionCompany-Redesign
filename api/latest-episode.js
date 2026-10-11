// Newest podcast episode, read from the Podbean feed so the homepage never
// falls behind. Cached at the edge for 30 minutes.
const FEED_URL = 'https://feed.podbean.com/thelioncompany/feed.xml';

function decode(value) {
    return String(value || '')
        .replace(/^<!\[CDATA\[|\]\]>$/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
        .trim();
}

function tag(xml, name) {
    const match = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
    return match ? decode(match[1]) : '';
}

function parseLatest(xml) {
    const item = (xml.match(/<item>([\s\S]*?)<\/item>/) || [])[1];
    if (!item) return null;
    const rawTitle = tag(item, 'title');
    const fromTitle = rawTitle.match(/\(?\s*(?:Episode|Ep\.?)\s*(\d+)\s*\)?/i);
    const number = tag(item, 'itunes:episode') || (fromTitle ? fromTitle[1] : '');
    const title = rawTitle.replace(/\s*\(\s*(?:Episode|Ep\.?)\s*\d+\s*\)\s*$/i, '').trim();
    return { number: number ? Number(number) : null, title, url: tag(item, 'link'), published: tag(item, 'pubDate') };
}

module.exports = async function handler(request, response) {
    response.setHeader('Content-Type', 'application/json');
    try {
        const feed = await fetch(FEED_URL, { headers: { 'User-Agent': 'thelioncompany.org' } });
        if (!feed.ok) throw new Error(`Feed returned ${feed.status}`);
        const latest = parseLatest(await feed.text());
        if (!latest || !latest.title) throw new Error('No episode in feed');
        response.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
        response.status(200).end(JSON.stringify(latest));
    } catch (error) {
        console.error('Latest episode lookup failed:', error);
        response.setHeader('Cache-Control', 'no-store');
        response.status(502).end(JSON.stringify({ error: 'Feed unavailable' }));
    }
};

module.exports.parseLatest = parseLatest;
