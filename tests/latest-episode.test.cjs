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
