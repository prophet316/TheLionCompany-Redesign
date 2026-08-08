const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/forms.js');

function responseRecorder() {
    return {
        statusCode: 200,
        headers: {},
        status(code) { this.statusCode = code; return this; },
        setHeader(name, value) { this.headers[name] = value; },
        end(value) {
            this.rawBody = value;
            this.body = this.headers['Content-Type']?.startsWith('application/json')
                ? JSON.parse(value)
                : value;
        }
    };
}

async function runPost(body, overrides = {}) {
    const response = responseRecorder();
    await handler({
        method: overrides.method || 'POST',
        headers: { origin: overrides.origin || 'https://www.thelioncompany.org' },
        body
    }, response);
    return response;
}

async function runGet(url) {
    const response = responseRecorder();
    await handler({
        method: 'GET',
        headers: {},
        url
    }, response);
    return response;
}

function okJson(status = 200, result = { id: 'test-id' }) {
    return { ok: true, status, json: async () => result };
}

test.beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_secret';
    process.env.LION_NEWSLETTER_SEGMENT_ID = '11111111-1111-4111-8111-111111111111';
    process.env.LION_NEWSLETTER_TOPIC_ID = '22222222-2222-4222-8222-222222222222';
    delete process.env.LION_TEAM_INBOX;
    delete process.env.LION_CONTACT_INBOX;
});

test.afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.LION_NEWSLETTER_SEGMENT_ID;
    delete process.env.LION_NEWSLETTER_TOPIC_ID;
    delete process.env.LION_TEAM_INBOX;
    delete process.env.LION_CONTACT_INBOX;
    global.fetch = undefined;
});

test('rejects requests from an unrelated origin', async () => {
    const response = await runPost(
        { type: 'newsletter', email: 'person@example.com' },
        { origin: 'https://attacker.example' }
    );
    assert.equal(response.statusCode, 403);
});

test('allows prayer submissions from Lion Vercel preview origins', async () => {
    global.fetch = async () => okJson();
    const response = await runPost({
        type: 'prayer',
        firstName: 'Grace',
        email: 'grace@example.com',
        message: 'Please pray for my family.'
    }, {
        origin: 'https://the-lion-company-redesign-abc123-prophet316s-projects.vercel.app'
    });
    assert.equal(response.statusCode, 200);
});

test('keeps preview and production idempotency keys separate', async () => {
    const keys = [];
    global.fetch = async (_url, options) => {
        keys.push(options.headers['Idempotency-Key']);
        return okJson();
    };

    const submission = {
        type: 'newsletter',
        email: 'reader@example.com'
    };
    await runPost(submission);
    await runPost(submission, {
        origin: 'https://the-lion-company-redesign-abc123-prophet316s-projects.vercel.app'
    });

    assert.notEqual(keys[1], keys[3]);
});

test('sends a branded prayer acknowledgment and a private team notification in one batch', async () => {
    const requests = [];
    global.fetch = async (url, options) => {
        requests.push({ url, options, body: JSON.parse(options.body) });
        return okJson();
    };

    const response = await runPost({
        type: 'prayer',
        firstName: 'Grace',
        lastName: 'Example',
        email: 'Grace@Example.com',
        phone: '555-0100',
        message: 'Please pray for wisdom in a family decision.'
    });

    assert.equal(response.statusCode, 200);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://api.resend.com/emails/batch');
    assert.match(requests[0].options.headers['Idempotency-Key'], /^lion-prayer-/);
    assert.equal(requests[0].body.length, 2);

    const [acknowledgment, teamNotification] = requests[0].body;
    assert.equal(acknowledgment.from, 'The Lion Company <prayer@updates.thelioncompany.org>');
    assert.deepEqual(acknowledgment.to, ['grace@example.com']);
    assert.match(acknowledgment.html, /THE LION COMPANY/);
    assert.match(acknowledgment.html, /We are standing with you/);
    assert.match(acknowledgment.html, /testimony and miracle unfold/);
    assert.doesNotMatch(acknowledgment.html, /family decision/);

    assert.equal(teamNotification.from, 'The Lion Company Prayer Team <prayer@updates.thelioncompany.org>');
    assert.deepEqual(teamNotification.to, ['jonathan@thelioncompany.org']);
    assert.equal(teamNotification.reply_to, 'grace@example.com');
    assert.match(teamNotification.subject, /^\[Lion Website Form\] Prayer/);
    assert.deepEqual(teamNotification.tags, [{ name: 'lion_form_type', value: 'prayer' }]);
    assert.match(teamNotification.html, /THE LION COMPANY/);
    assert.match(teamNotification.html, /Prayer Ministry/);
    assert.match(teamNotification.html, /Private prayer request/);
    assert.match(teamNotification.html, /A prayer request has arrived/);
    assert.match(teamNotification.html, /Reply directly to this email/);
    assert.match(teamNotification.html, /family decision/);
    assert.match(teamNotification.html, /Confidential ministry information/);
    assert.match(teamNotification.text, /THE LION COMPANY \| PRAYER MINISTRY/);
});

test('omits empty phone data from the prayer team notification', async () => {
    let batch;
    global.fetch = async (_url, options) => {
        batch = JSON.parse(options.body);
        return okJson();
    };

    await runPost({
        type: 'prayer',
        firstName: 'Grace',
        email: 'grace@example.com',
        message: 'Please pray.'
    });

    assert.doesNotMatch(batch[1].html, />Phone</);
    assert.doesNotMatch(batch[1].html, /Not provided/);
    assert.doesNotMatch(batch[1].text, /Phone:/);
});

test('uses an explicitly configured Lion team inbox', async () => {
    process.env.LION_TEAM_INBOX = 'prayer-team@thelioncompany.org';
    let batch;
    global.fetch = async (_url, options) => {
        batch = JSON.parse(options.body);
        return okJson();
    };
    await runPost({
        type: 'prayer',
        firstName: 'Grace',
        email: 'grace@example.com',
        message: 'Please pray.'
    });
    assert.deepEqual(batch[1].to, ['prayer-team@thelioncompany.org']);
    assert.equal(batch[0].reply_to, 'prayer-team@thelioncompany.org');
});

test('sends a branded contact acknowledgment and routes the private message separately', async () => {
    process.env.LION_CONTACT_INBOX = 'contact-team@thelioncompany.org';
    let batch;
    global.fetch = async (_url, options) => {
        batch = JSON.parse(options.body);
        return okJson();
    };

    const response = await runPost({
        type: 'contact',
        firstName: 'Grace',
        lastName: 'Example',
        email: 'Grace@Example.com',
        phone: '555-0100',
        message: 'I would like to ask about the next gathering.'
    });

    assert.equal(response.statusCode, 200);
    assert.equal(batch.length, 2);
    assert.equal(batch[0].from, 'The Lion Company <contact@updates.thelioncompany.org>');
    assert.deepEqual(batch[0].to, ['grace@example.com']);
    assert.equal(batch[0].reply_to, 'contact-team@thelioncompany.org');
    assert.match(batch[0].html, /Thank you for reaching out/);
    assert.doesNotMatch(batch[0].html, /next gathering/);

    assert.equal(batch[1].from, 'The Lion Company Contact <contact@updates.thelioncompany.org>');
    assert.deepEqual(batch[1].to, ['contact-team@thelioncompany.org']);
    assert.equal(batch[1].reply_to, 'grace@example.com');
    assert.match(batch[1].subject, /^\[Lion Website Form\] Contact/);
    assert.deepEqual(batch[1].tags, [{ name: 'lion_form_type', value: 'contact' }]);
    assert.match(batch[1].html, /next gathering/);
});

test('starts newsletter double opt-in and sends a branded confirmation email', async () => {
    const requests = [];
    global.fetch = async (url, options) => {
        requests.push({ url, options, body: JSON.parse(options.body) });
        return okJson();
    };

    const response = await runPost({ type: 'newsletter', email: 'Reader@Example.com' });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.confirmationRequired, true);
    assert.equal(requests[0].url, 'https://api.resend.com/contacts');
    assert.deepEqual(requests[0].body, {
        email: 'reader@example.com',
        unsubscribed: true
    });
    assert.equal(requests[1].url, 'https://api.resend.com/emails');
    assert.match(requests[1].options.headers['Idempotency-Key'], /^lion-newsletter-confirmation-/);
    assert.equal(requests[1].body.from, 'The Lion Company <welcome@updates.thelioncompany.org>');
    assert.match(requests[1].body.html, /Confirm your place/);
    assert.match(requests[1].body.html, /Confirm subscription/);
    assert.match(requests[1].body.html, /lion_bg\.jpg/);
});

test('does not globally unsubscribe an existing contact during repeat signup', async () => {
    const requests = [];
    global.fetch = async (url, options) => {
        requests.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
        if (requests.length === 1) {
            return { ok: false, status: 409, json: async () => ({ message: 'exists' }) };
        }
        if (requests.length === 2) {
            return okJson(200, { email: 'reader@example.com', unsubscribed: false });
        }
        return okJson();
    };

    const response = await runPost({ type: 'newsletter', email: 'reader@example.com' });

    assert.equal(response.statusCode, 200);
    assert.equal(requests[1].url, 'https://api.resend.com/contacts/reader%40example.com');
    assert.equal(requests[1].method, 'GET');
    assert.equal(requests.some((request) => request.method === 'PATCH' && request.body?.unsubscribed === true), false);
});

test('confirms a signed newsletter subscription link', async () => {
    let confirmationEmail;
    global.fetch = async (url, options) => {
        const body = JSON.parse(options.body);
        if (url.endsWith('/emails')) confirmationEmail = body;
        return okJson();
    };

    await runPost({ type: 'newsletter', email: 'reader@example.com' });
    const encodedUrl = confirmationEmail.html.match(/href="(https:\/\/www\.thelioncompany\.org\/api\/forms\?[^"]+)"/)[1];
    const confirmationUrl = encodedUrl.replaceAll('&amp;', '&');

    const requests = [];
    global.fetch = async (url, options) => {
        requests.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
        return okJson();
    };

    const response = await runGet(confirmationUrl);

    assert.equal(response.statusCode, 200);
    assert.match(response.headers['Content-Type'], /text\/html/);
    assert.match(response.body, /You are on the list/);
    assert.equal(requests[0].url, 'https://api.resend.com/contacts/reader%40example.com/topics');
    assert.deepEqual(requests[0].body, {
        topics: [{ id: '22222222-2222-4222-8222-222222222222', subscription: 'opt_in' }]
    });
    assert.equal(requests[1].url, 'https://api.resend.com/contacts/reader%40example.com/segments/11111111-1111-4111-8111-111111111111');
    assert.equal(requests[1].method, 'POST');
    assert.equal(requests[2].url, 'https://api.resend.com/contacts/reader%40example.com');
    assert.deepEqual(requests[2].body, { unsubscribed: false });
});

test('keeps a contact globally unsubscribed when targeting is not configured', async () => {
    let confirmationEmail;
    global.fetch = async (url, options) => {
        const body = options.body ? JSON.parse(options.body) : undefined;
        if (url.endsWith('/emails')) confirmationEmail = body;
        return okJson();
    };

    await runPost({ type: 'newsletter', email: 'reader@example.com' });
    const encodedUrl = confirmationEmail.html.match(/href="(https:\/\/www\.thelioncompany\.org\/api\/forms\?[^\"]+)"/)[1];
    const confirmationUrl = encodedUrl.replaceAll('&amp;', '&');
    delete process.env.LION_NEWSLETTER_SEGMENT_ID;
    delete process.env.LION_NEWSLETTER_TOPIC_ID;

    global.fetch = async () => { throw new Error('Resend should not be called'); };
    const response = await runGet(confirmationUrl);

    assert.equal(response.statusCode, 503);
    assert.match(response.body, /not configured yet/);
});

test('rejects a tampered newsletter confirmation link', async () => {
    const response = await runGet(
        'https://www.thelioncompany.org/api/forms?action=confirm&email=reader%40example.com&expires=9999999999999&signature=bad'
    );
    assert.equal(response.statusCode, 400);
    assert.match(response.body, /invalid or has expired/);
});

test('validates prayer and newsletter inputs', async () => {
    const badEmail = await runPost({ type: 'newsletter', email: 'not-an-email' });
    assert.equal(badEmail.statusCode, 400);

    const missingPrayer = await runPost({
        type: 'prayer',
        email: 'person@example.com',
        message: ''
    });
    assert.equal(missingPrayer.statusCode, 400);
});

test('validates contact requests at the endpoint', async () => {
    const response = await runPost({
        type: 'contact',
        email: 'grace@example.com',
        message: ''
    });
    assert.equal(response.statusCode, 400);
});

test('quietly accepts a filled honeypot without calling Resend', async () => {
    global.fetch = async () => { throw new Error('fetch should not be called'); };
    const response = await runPost({
        type: 'prayer',
        firstName: 'Bot',
        email: 'bot@example.com',
        message: 'spam',
        website: 'spam'
    });
    assert.equal(response.statusCode, 200);
});

test('preserves the method guard for unrelated GET requests', async () => {
    const response = await runGet('https://www.thelioncompany.org/api/forms');
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.Allow, 'POST');
});

test('fails closed when the Resend API key is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const response = await runPost({ type: 'newsletter', email: 'person@example.com' });
    assert.equal(response.statusCode, 503);
});

test('returns a safe error when Resend rejects delivery', async () => {
    global.fetch = async () => ({
        ok: false,
        status: 422,
        json: async () => ({ message: 'rejected' })
    });
    const response = await runPost({
        type: 'prayer',
        firstName: 'Grace',
        email: 'grace@example.com',
        message: 'Please pray.'
    });
    assert.equal(response.statusCode, 502);
    assert.deepEqual(response.body, { error: 'Unable to process this submission' });
});
