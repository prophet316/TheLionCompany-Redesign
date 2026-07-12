const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/forms.js');

function responseRecorder() {
    return {
        statusCode: 200,
        headers: {},
        status(code) { this.statusCode = code; return this; },
        setHeader(name, value) { this.headers[name] = value; },
        end(value) { this.body = JSON.parse(value); }
    };
}

async function run(body, overrides = {}) {
    const response = responseRecorder();
    await handler({
        method: overrides.method || 'POST',
        headers: { origin: overrides.origin || 'https://www.thelioncompany.org' },
        body
    }, response);
    return response;
}

test.beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test';
});

test.afterEach(() => {
    delete process.env.RESEND_API_KEY;
    global.fetch = undefined;
});

test('rejects requests from an unrelated origin', async () => {
    const response = await run({ type: 'newsletter', email: 'person@example.com' }, { origin: 'https://attacker.example' });
    assert.equal(response.statusCode, 403);
});

test('validates newsletter email addresses', async () => {
    const response = await run({ type: 'newsletter', email: 'not-an-email' });
    assert.equal(response.statusCode, 400);
});

test('saves a newsletter contact and emails Jonathan', async () => {
    const requests = [];
    global.fetch = async (url, options) => {
        requests.push({ url, body: JSON.parse(options.body) });
        return { ok: true, status: 200, json: async () => ({ id: 'test-id' }) };
    };

    const response = await run({ type: 'newsletter', email: 'Reader@Example.com' });
    assert.equal(response.statusCode, 200);
    assert.equal(requests[0].url, 'https://api.resend.com/contacts');
    assert.equal(requests[0].body.email, 'reader@example.com');
    assert.match(requests[1].url, /^https:\/\/formsubmit\.co\/ajax\//);
    assert.equal(requests[1].body.email, 'reader@example.com');
    assert.match(requests[1].body._subject, /Newsletter Signup/);
});

test('emails a complete prayer request without adding a contact', async () => {
    const requests = [];
    global.fetch = async (url, options) => {
        requests.push({ url, body: JSON.parse(options.body) });
        return { ok: true, status: 200, json: async () => ({ id: 'test-id' }) };
    };

    const response = await run({
        type: 'prayer',
        firstName: 'Grace',
        lastName: 'Example',
        email: 'grace@example.com',
        phone: '555-0100',
        message: 'Please pray for my family.'
    });

    assert.equal(response.statusCode, 200);
    assert.equal(requests.length, 1);
    assert.match(requests[0].url, /^https:\/\/formsubmit\.co\/ajax\//);
    assert.equal(requests[0].body.prayer_request, 'Please pray for my family.');
    assert.equal(requests[0].body.email, 'grace@example.com');
});

test('quietly accepts a filled honeypot without calling Resend', async () => {
    global.fetch = async () => { throw new Error('fetch should not be called'); };
    const response = await run({ type: 'newsletter', email: 'bot@example.com', website: 'spam' });
    assert.equal(response.statusCode, 200);
});
