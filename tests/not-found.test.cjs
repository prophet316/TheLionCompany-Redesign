const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', '404.html'), 'utf8');

test('404 page is branded, not indexed, and routes visitors back in', () => {
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(html, /rel="canonical"/);
  for (const href of ['/', '/#pray', '/#podcast', '/media', '/#shop', '/#give', '/#book']) {
    assert.ok(html.includes(`href="${href}"`), `missing link ${href}`);
  }
  // Asset paths must be absolute so the page works at any missing URL depth.
  assert.doesNotMatch(html, /(src|href)="assets\//);
});
