const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
    return fs.readFileSync(path.join(root, file), 'utf8');
}

test('privacy and terms are publication-ready and indexable', () => {
    for (const file of ['privacy.html', 'terms.html']) {
        const page = read(file);
        assert.doesNotMatch(page, /REVIEW DRAFT|NOT FOR PRODUCTION/);
        assert.doesNotMatch(page, /noindex|nofollow/);
        assert.match(page, /Effective August 8, 2026/);
        assert.match(page, /href="\/privacy"/);
        assert.match(page, /href="\/terms"/);
    }
});

test('privacy policy describes forms, providers, and the approved retention process', () => {
    const privacy = read('privacy.html');
    for (const required of [
        'Prayer requests',
        'Contact messages',
        'Mailing-list signups',
        'Resend',
        'Vercel',
        'Google Analytics',
        'retains website prayer requests and contact messages for six months',
        'documented\\s+monthly retention review',
        'Privacy request'
    ]) {
        assert.match(privacy, new RegExp(required));
    }
});

test('legal pages identify Company of Lions and Texas', () => {
    const privacy = read('privacy.html');
    const terms = read('terms.html');
    assert.match(privacy, /Company of Lions operates this website/);
    assert.match(privacy, /operates this website from Texas, United States/);
    assert.match(terms, /Company of Lions operates The Lion Company/);
    assert.match(terms, /governed by the laws of the State of Texas/);
    assert.match(terms, /court of competent jurisdiction in Texas/);
});

test('terms preserve ministry boundaries and separate-publication consent', () => {
    const terms = read('terms.html');
    assert.match(terms, /does not\s+create a counseling, medical, legal, financial, pastoral-care/);
    assert.match(terms, /website is not an emergency service/);
    assert.match(terms, /does not give The\s+Lion Company permission to publish it/);
});

test('clean public routes rewrite to the static pages', () => {
    const config = JSON.parse(read('vercel.json'));
    assert.deepEqual(config.rewrites, [
        { source: '/media', destination: '/media.html' },
        { source: '/privacy', destination: '/privacy.html' },
        { source: '/terms', destination: '/terms.html' }
    ]);
});

test('all three forms and the homepage footer link to both legal pages', () => {
    const index = read('index.html');
    for (const id of ['prayer-privacy-note', 'contact-privacy-note', 'newsletter-privacy-note']) {
        const note = index.match(new RegExp(`<p id="${id}"[\\s\\S]*?<\\/p>`));
        assert.ok(note, `${id} should exist`);
        assert.match(note[0], /href="\/privacy"/);
        assert.match(note[0], /href="\/terms"/);
    }
    assert.match(index, /<footer[\s\S]*href="\/privacy"[\s\S]*href="\/terms"/);
});
