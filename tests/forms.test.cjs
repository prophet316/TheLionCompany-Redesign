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
    const origin = 'origin' in overrides ? overrides.origin : 'https://www.thelioncompany.org';
    await handler({
        method: overrides.method || 'POST',
        headers: origin === null ? {} : { origin },
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

function failJson(status, result = {}) {
    return { ok: false, status, json: async () => result };
}

// Records every Resend call. GET requests have no body.
function recordRequests(reply = () => okJson()) {
    const requests = [];
    global.fetch = async (url, options) => {
        const request = { url, method: options.method, options, body: options.body ? JSON.parse(options.body) : undefined };
        requests.push(request);
        return reply(request, requests);
    };
    return requests;
}

// A brand-new subscriber: Resend has no contact for the address yet.
function newContact(request) {
    return request.method === 'GET' && request.url.includes('/contacts/') ? failJson(404, { name: 'not_found' }) : okJson();
}

function confirmationLink(email) {
    const encodedUrl = email.html.match(/href="(https:\/\/www\.thelioncompany\.org\/api\/forms\?[^"]+)"/)[1];
    return encodedUrl.replaceAll('&amp;', '&');
}

test.beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_secret';
    process.env.LION_NEWSLETTER_SEGMENT_ID = '11111111-1111-4111-8111-111111111111';
    process.env.LION_NEWSLETTER_TOPIC_ID = '22222222-2222-4222-8222-222222222222';
    delete process.env.LION_TEAM_INBOX;
    delete process.env.LION_CONTACT_INBOX;
    delete process.env.LION_CONFIRM_SECRET;
    delete process.env.VERCEL_ENV;
});

test.afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.LION_NEWSLETTER_SEGMENT_ID;
    delete process.env.LION_NEWSLETTER_TOPIC_ID;
    delete process.env.LION_TEAM_INBOX;
    delete process.env.LION_CONTACT_INBOX;
    delete process.env.LION_CONFIRM_SECRET;
    delete process.env.VERCEL_ENV;
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

    const confirmations = keys.filter((key) => key?.startsWith('lion-newsletter-confirmation-'));
    assert.equal(confirmations.length, 2);
    assert.notEqual(confirmations[0], confirmations[1]);
});

test('team notification is sent before the acknowledgment (prayer), each as its own send', async () => {
    const requests = recordRequests();

    const response = await runPost({
        type: 'prayer',
        firstName: 'Grace',
        lastName: 'Example',
        email: 'Grace@Example.com',
        phone: '555-0100',
        message: 'Please pray for wisdom in a family decision.'
    });

    assert.equal(response.statusCode, 200);
    assert.equal(requests.length, 2);
    assert.ok(requests.every((request) => request.url === 'https://api.resend.com/emails'));
    assert.match(requests[0].options.headers['Idempotency-Key'], /^lion-prayer-team-/);
    assert.match(requests[1].options.headers['Idempotency-Key'], /^lion-prayer-ack-/);

    const [teamNotification, acknowledgment] = requests.map((request) => request.body);
    assert.equal(acknowledgment.from, 'The Lion Company <prayer@updates.thelioncompany.org>');
    assert.deepEqual(acknowledgment.to, ['grace@example.com']);
    assert.equal(acknowledgment.subject, "We're praying with you");
    assert.match(acknowledgment.html, /We are praying<br><span[^>]*>with you\./);
    assert.match(acknowledgment.html, /Hi Grace,/);
    assert.match(acknowledgment.html, /\/assets\/email\/prayer-masthead\.jpg/);
    assert.match(acknowledgment.html, /James 5:16/);
    assert.match(acknowledgment.html, /The Lion Company &middot; Austin, TX/);
    assert.match(acknowledgment.text, /James 5:16 \(NIV\)/);
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
    const requests = recordRequests();

    await runPost({
        type: 'prayer',
        firstName: 'Grace',
        email: 'grace@example.com',
        message: 'Please pray.'
    });

    const teamNotification = requests[0].body;
    assert.doesNotMatch(teamNotification.html, />Phone</);
    assert.doesNotMatch(teamNotification.html, /Not provided/);
    assert.doesNotMatch(teamNotification.text, /Phone:/);
});

test('uses an explicitly configured Lion team inbox', async () => {
    process.env.LION_TEAM_INBOX = 'prayer-team@thelioncompany.org';
    const requests = recordRequests();
    await runPost({
        type: 'prayer',
        firstName: 'Grace',
        email: 'grace@example.com',
        message: 'Please pray.'
    });
    const [teamNotification, acknowledgment] = requests.map((request) => request.body);
    assert.deepEqual(teamNotification.to, ['prayer-team@thelioncompany.org']);
    assert.equal(acknowledgment.reply_to, 'prayer-team@thelioncompany.org');
});

test('sends a branded contact acknowledgment and routes the private message separately', async () => {
    process.env.LION_CONTACT_INBOX = 'contact-team@thelioncompany.org';
    const requests = recordRequests();

    const response = await runPost({
        type: 'contact',
        firstName: 'Grace',
        lastName: 'Example',
        email: 'Grace@Example.com',
        phone: '555-0100',
        message: 'I would like to ask about the next gathering.'
    });

    assert.equal(response.statusCode, 200);
    assert.equal(requests.length, 2);
    assert.match(requests[0].options.headers['Idempotency-Key'], /^lion-contact-team-/);
    assert.match(requests[1].options.headers['Idempotency-Key'], /^lion-contact-ack-/);
    // [acknowledgment, team notification]; the team notification is sent first
    const batch = [requests[1].body, requests[0].body];
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

test('starts newsletter double opt-in and sends a branded confirmation email (GET 404, then POST, then confirmation)', async () => {
    const requests = recordRequests(newContact);

    const response = await runPost({ type: 'newsletter', email: 'Reader@Example.com' });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.confirmationRequired, true);
    assert.equal(requests[0].url, 'https://api.resend.com/contacts/reader%40example.com');
    assert.equal(requests[0].method, 'GET');
    assert.equal(requests[1].url, 'https://api.resend.com/contacts');
    assert.equal(requests[1].method, 'POST');
    assert.deepEqual(requests[1].body, {
        email: 'reader@example.com',
        unsubscribed: true
    });
    assert.equal(requests[2].url, 'https://api.resend.com/emails');
    assert.match(requests[2].options.headers['Idempotency-Key'], /^lion-newsletter-confirmation-/);
    assert.equal(requests[2].body.from, 'The Lion Company <welcome@updates.thelioncompany.org>');
    assert.match(requests[2].body.html, /Confirm your place/);
    assert.match(requests[2].body.html, /Confirm subscription/);
    assert.match(requests[2].body.html, /lion_bg\.jpg/);
});

test('a ticked "monthly letter" box on the prayer form also starts double opt-in', async () => {
    const requests = recordRequests(newContact);

    const response = await runPost({
        type: 'prayer',
        firstName: 'Grace',
        email: 'Grace@Example.com',
        message: 'Please pray for my family.',
        joinNewsletter: true
    });

    assert.equal(response.statusCode, 200);
    assert.match(requests[0].options.headers['Idempotency-Key'], /^lion-prayer-team-/);
    assert.match(requests[1].options.headers['Idempotency-Key'], /^lion-prayer-ack-/);
    assert.deepEqual(requests[3].body, { email: 'grace@example.com', unsubscribed: true });
    assert.match(requests[4].options.headers['Idempotency-Key'], /^lion-newsletter-confirmation-/);
    assert.deepEqual(requests[4].body.to, ['grace@example.com']);
    const alert = requests[5].body;
    assert.match(alert.subject, /Newsletter signup — grace@example\.com$/);
    assert.match(alert.text, /\(from the prayer form\)/);
});

test('the contact form box works the same way, and an unticked box adds nobody', async () => {
    let requests = recordRequests(newContact);
    await runPost({ type: 'contact', firstName: 'Ana', email: 'ana@example.com', message: 'Hello', joinNewsletter: true });
    assert.ok(requests.some((r) => r.options.headers?.['Idempotency-Key']?.startsWith('lion-newsletter-confirmation-')));

    for (const joinNewsletter of [undefined, false, 'true']) {
        requests = recordRequests(newContact);
        await runPost({ type: 'contact', firstName: 'Ana', email: 'ana@example.com', message: 'Hello', joinNewsletter });
        assert.equal(requests.length, 2);
    }
});

test('a failed opt-in never fails the prayer request it rode in on', async () => {
    recordRequests((request) => request.url.includes('/contacts') ? failJson(500) : okJson());

    const response = await runPost({
        type: 'prayer', firstName: 'Grace', email: 'grace@example.com', message: 'Pray for us.', joinNewsletter: true
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ok, true);
});

test('emails Jonathan about every newsletter signup', async () => {
    const requests = recordRequests();

    const response = await runPost({ type: 'newsletter', email: 'Reader@Example.com' });

    assert.equal(response.statusCode, 200);
    const alert = requests[requests.length - 1];
    assert.equal(alert.url, 'https://api.resend.com/emails');
    assert.deepEqual(alert.body.to, ['jonathan@thelioncompany.org']);
    assert.equal(alert.body.reply_to, 'reader@example.com');
    assert.match(alert.body.subject, /^\[Lion Website Form\] Newsletter signup — reader@example\.com$/);
    assert.match(alert.options.headers['Idempotency-Key'], /^lion-newsletter-alert-/);
});

test('a failed signup alert does not fail the signup', async () => {
    let emails = 0;
    global.fetch = async (url) => {
        // the confirmation goes through; the alert fails, and fails again on its retry
        if (url.endsWith('/emails') && ++emails >= 2) return { ok: false, status: 500, json: async () => ({}) };
        return okJson();
    };

    const response = await runPost({ type: 'newsletter', email: 'reader@example.com' });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.confirmationRequired, true);
});

test('existing contact (GET 200): no POST /contacts and no PATCH with unsubscribed:true on a repeat signup', async () => {
    const requests = recordRequests((request) => (request.method === 'GET'
        ? okJson(200, { email: 'reader@example.com', unsubscribed: false })
        : okJson()));

    const response = await runPost({ type: 'newsletter', email: 'reader@example.com' });

    assert.equal(response.statusCode, 200);
    assert.equal(requests[0].url, 'https://api.resend.com/contacts/reader%40example.com');
    assert.equal(requests[0].method, 'GET');
    assert.equal(requests.some((request) => request.url === 'https://api.resend.com/contacts' && request.method === 'POST'), false);
    assert.equal(requests.some((request) => request.body?.unsubscribed === true), false);
    assert.match(requests[1].options.headers['Idempotency-Key'], /^lion-newsletter-confirmation-/);
});

test('a contact lookup that fails (not a 404) never creates or changes the contact', async () => {
    const requests = recordRequests((request) => (request.method === 'GET' ? failJson(401, { name: 'restricted_api_key' }) : okJson()));

    const response = await runPost({ type: 'newsletter', email: 'reader@example.com' });

    assert.equal(response.statusCode, 502);
    assert.ok(requests.every((request) => request.method === 'GET'));
});

test('repeat newsletter signup within the window sends an identical body and Idempotency-Key', async () => {
    const confirmations = [];
    recordRequests((request) => {
        if (request.options.headers['Idempotency-Key']?.startsWith('lion-newsletter-confirmation-')) {
            confirmations.push({ key: request.options.headers['Idempotency-Key'], body: request.options.body });
        }
        return okJson();
    });

    const first = await runPost({ type: 'newsletter', email: 'reader@example.com' });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const second = await runPost({ type: 'newsletter', email: 'reader@example.com' });

    assert.equal(first.statusCode, 200);
    assert.equal(second.statusCode, 200);
    assert.equal(confirmations.length, 2);
    assert.equal(confirmations[0].key, confirmations[1].key);
    // Resend answers 409 invalid_idempotent_request when one key carries two different bodies.
    assert.equal(confirmations[0].body, confirmations[1].body);
});

test('confirmation links last about 7 days', async () => {
    const requests = recordRequests();
    const before = Date.now();
    await runPost({ type: 'newsletter', email: 'reader@example.com' });
    const link = new URL(confirmationLink(requests.find((request) => request.url.endsWith('/emails')).body));
    const expires = Number(link.searchParams.get('expires'));
    const week = 7 * 24 * 60 * 60 * 1000;
    assert.ok(expires >= before + week, 'at least 7 days');
    assert.ok(expires <= before + week + 10 * 60 * 1000, 'at most 7 days and 10 minutes');
    assert.doesNotMatch(JSON.stringify(requests.map((request) => request.body)), /48 hours/);
});

test('confirms a signed newsletter subscription link', async () => {
    let confirmationEmail;
    global.fetch = async (url, options) => {
        const body = options.body ? JSON.parse(options.body) : undefined;
        if (url.endsWith('/emails') && !confirmationEmail) confirmationEmail = body;
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

test('the confirmed page never passes the subscriber\'s address on as a referrer', async () => {
    const sent = recordRequests();
    await runPost({ type: 'newsletter', email: 'reader@example.com' });
    const confirmationEmail = sent.find((request) => request.url.endsWith('/emails')).body;
    assert.match(confirmationEmail.html, /<meta name="referrer" content="no-referrer">/);
    assert.match(confirmationEmail.html, /<a href="https:\/\/www\.thelioncompany\.org\/api\/forms\?[^"]+" rel="noreferrer"/);

    recordRequests();
    const response = await runGet(confirmationLink(confirmationEmail));
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['Referrer-Policy'], 'no-referrer');
    assert.match(response.body, /<meta name="referrer" content="no-referrer">/);
    assert.match(response.body, /rel="noreferrer"/);
});

test('a link signed with RESEND_API_KEY still confirms once LION_CONFIRM_SECRET is set', async () => {
    const sent = recordRequests();
    await runPost({ type: 'newsletter', email: 'reader@example.com' });
    const oldLink = confirmationLink(sent.find((request) => request.url.endsWith('/emails')).body);

    process.env.LION_CONFIRM_SECRET = 'a-separate-signing-secret-for-confirmation-links';
    const newSent = recordRequests();
    await runPost({ type: 'newsletter', email: 'other@example.com' });
    const newLink = confirmationLink(newSent.find((request) => request.url.endsWith('/emails')).body);
    assert.notEqual(new URL(newLink).searchParams.get('signature'), new URL(oldLink).searchParams.get('signature'));

    recordRequests();
    assert.equal((await runGet(oldLink)).statusCode, 200);
    assert.equal((await runGet(newLink)).statusCode, 200);

    // the new secret is really used: a link for the same email and expiry signed with the API key differs
    const crypto = require('node:crypto');
    const url = new URL(newLink);
    const withApiKey = crypto.createHmac('sha256', 're_test_secret')
        .update(`lion-newsletter-confirmation-v1\nother@example.com\n${url.searchParams.get('expires')}`).digest('hex');
    assert.notEqual(url.searchParams.get('signature'), withApiKey);
});

test('keeps a contact globally unsubscribed when targeting is not configured', async () => {
    let confirmationEmail;
    global.fetch = async (url, options) => {
        const body = options.body ? JSON.parse(options.body) : undefined;
        if (url.endsWith('/emails') && !confirmationEmail) confirmationEmail = body;
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
    // the page's button leads to the newsletter form (index.html has no #newsletter)
    assert.match(response.body, /href="https:\/\/www\.thelioncompany\.org\/#connect"/);
    assert.doesNotMatch(response.body, /#newsletter/);
    assert.equal(response.headers['Referrer-Policy'], 'no-referrer');
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

test('quietly accepts a filled honeypot (lion_hp_x) without calling Resend', async () => {
    const requests = recordRequests();
    const response = await runPost({
        type: 'prayer',
        firstName: 'Bot',
        email: 'bot@example.com',
        message: 'spam',
        lion_hp_x: 'spam'
    });
    assert.equal(response.statusCode, 200);
    assert.equal(requests.length, 0);
});

test('a "website" value (browser autofill) no longer drops a real prayer request', async () => {
    const requests = recordRequests();
    const response = await runPost({
        type: 'prayer',
        firstName: 'Grace',
        email: 'grace@example.com',
        message: 'Please pray.',
        website: 'https://grace.example.com'
    });
    assert.equal(response.statusCode, 200);
    assert.equal(requests.length, 2);
});

test('elapsed 300 returns 200 with zero Resend calls; a real fill time is sent', async () => {
    let requests = recordRequests();
    const fast = await runPost({ type: 'contact', firstName: 'Grace', email: 'grace@example.com', message: 'Hi', elapsed: 300 });
    assert.equal(fast.statusCode, 200);
    assert.deepEqual(fast.body, { ok: true });
    assert.equal(requests.length, 0);

    const junk = await runPost({ type: 'contact', firstName: 'Grace', email: 'grace@example.com', message: 'Hi', elapsed: 'soon' });
    assert.equal(junk.statusCode, 200);
    assert.equal(requests.length, 0);

    requests = recordRequests();
    const human = await runPost({ type: 'contact', firstName: 'Grace', email: 'grace@example.com', message: 'Hi', elapsed: 9000 });
    assert.equal(human.statusCode, 200);
    assert.equal(requests.length, 2);
});

test('POST without Origin returns 403 and makes no Resend call', async () => {
    const requests = recordRequests();
    const response = await runPost({ type: 'contact', firstName: 'Grace', email: 'grace@example.com', message: 'Hi' }, { origin: null });
    assert.equal(response.statusCode, 403);
    assert.equal(requests.length, 0);
});

test('Origin http://localhost:3000 is rejected when VERCEL_ENV=production and allowed elsewhere', async () => {
    const requests = recordRequests();
    const submission = { type: 'newsletter', email: 'reader@example.com' };

    process.env.VERCEL_ENV = 'production';
    const production = await runPost(submission, { origin: 'http://localhost:3000' });
    assert.equal(production.statusCode, 403);
    assert.equal(requests.length, 0);
    assert.equal((await runPost(submission, { origin: 'http://127.0.0.1:8080' })).statusCode, 403);
    assert.equal(requests.length, 0);

    process.env.VERCEL_ENV = 'preview';
    assert.equal((await runPost(submission, { origin: 'http://localhost:3000' })).statusCode, 200);
    delete process.env.VERCEL_ENV;
    assert.equal((await runPost(submission, { origin: 'http://localhost:3000' })).statusCode, 200);
});

test('first name "Claim $500 at bit.ly/x" gives an acknowledgment that starts "Hello," while the team subject keeps the full name', async () => {
    for (const type of ['prayer', 'contact']) {
        const requests = recordRequests();
        const response = await runPost({ type, firstName: 'Claim $500 at bit.ly/x', email: 'victim@example.com', message: 'x' });
        assert.equal(response.statusCode, 200);
        const [teamNotification, acknowledgment] = requests.map((request) => request.body);
        assert.match(acknowledgment.text, /^Hello,\n/);
        assert.doesNotMatch(acknowledgment.text, /bit\.ly|Claim/);
        assert.doesNotMatch(acknowledgment.html, /bit\.ly|\$500/);
        assert.match(acknowledgment.html, /Hello,/);
        assert.match(teamNotification.subject, /Claim \$500 at bit\.ly\/x$/);
    }

    // ordinary names are still greeted by name
    const requests = recordRequests();
    await runPost({ type: 'prayer', firstName: 'Mary-Jo', lastName: "O'Neil Jr.", email: 'mary@example.com', message: 'x' });
    assert.match(requests[1].body.text, /^Hi Mary-Jo,/);
    assert.match(requests[1].body.html, /Hi Mary-Jo,/);
    const accented = recordRequests();
    await runPost({ type: 'contact', firstName: 'José', email: 'jose@example.com', message: 'x' });
    assert.match(accented[1].body.text, /^Hi José,/);
});

test('CR/LF in names never reaches the subject line', async () => {
    const requests = recordRequests();
    await runPost({ type: 'contact', firstName: 'Grace\r\nBcc: someone@example.com', lastName: 'Ex\nample', email: 'grace@example.com', message: 'Hello\nthere' });
    const [teamNotification] = requests.map((request) => request.body);
    assert.doesNotMatch(teamNotification.subject, /[\r\n]/);
    assert.match(teamNotification.subject, /Grace Bcc: someone@example\.com Ex ample$/);
    // the message itself keeps its line breaks
    assert.match(teamNotification.text, /Hello\nthere/);
});

test('a failed acknowledgment does not lose the prayer request', async () => {
    const requests = recordRequests((request) => (request.body.to[0] === 'grace@example.com'
        ? failJson(422, { name: 'validation_error' })
        : okJson()));
    const response = await runPost({ type: 'prayer', firstName: 'Grace', email: 'grace@example.com', message: 'Please pray.' });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(requests[0].body.to, ['jonathan@thelioncompany.org']);
    assert.match(requests[0].body.subject, /^\[Lion Website Form\] Prayer/);
    assert.equal(requests.length, 2, 'a 422 is not retried');
});

test('retries once on 429 with the same Idempotency-Key', async () => {
    const requests = recordRequests((_request, all) => (all.length === 1
        ? failJson(429, { name: 'rate_limit_exceeded' })
        : okJson()));
    const response = await runPost({ type: 'prayer', firstName: 'Grace', email: 'grace@example.com', message: 'Please pray.' });
    assert.equal(response.statusCode, 200);
    assert.equal(requests.length, 3);
    assert.match(requests[0].options.headers['Idempotency-Key'], /^lion-prayer-team-/);
    assert.equal(requests[1].options.headers['Idempotency-Key'], requests[0].options.headers['Idempotency-Key']);
    assert.equal(requests[1].options.body, requests[0].options.body);
    assert.match(requests[2].options.headers['Idempotency-Key'], /^lion-prayer-ack-/);
});

test('a Resend call that keeps failing is tried twice, then reported', async () => {
    let calls = 0;
    global.fetch = async () => { calls++; throw new TypeError('fetch failed'); };
    const response = await runPost({ type: 'contact', firstName: 'Grace', email: 'grace@example.com', message: 'Hi' });
    assert.equal(response.statusCode, 502);
    assert.equal(calls, 2);
});

test('every Resend call carries a timeout signal', async () => {
    const requests = recordRequests();
    await runPost({ type: 'contact', firstName: 'Grace', email: 'grace@example.com', message: 'Hi' });
    assert.ok(requests.every((request) => request.options.signal instanceof AbortSignal));
});

test('preserves the method guard for unrelated GET requests', async () => {
    const response = await runGet('https://www.thelioncompany.org/api/forms');
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.Allow, 'GET, POST');
});

test('other methods get 405 with Allow: GET, POST', async () => {
    const response = await runPost({}, { method: 'PUT' });
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.Allow, 'GET, POST');
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
