const ALLOWED_ORIGINS = new Set([
    'https://thelioncompany.org',
    'https://www.thelioncompany.org',
    'https://the-lion-company-redesign.vercel.app'
]);

function isAllowedOrigin(origin) {
    return ALLOWED_ORIGINS.has(origin)
        || /^https:\/\/the-lion-company-redesign-[a-z0-9-]+-prophet316s-projects\.vercel\.app$/.test(origin)
        || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function sendJson(response, status, body) {
    response.status(status).setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(body));
}

function clean(value, maxLength) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

async function resendRequest(path, apiKey, method, body) {
    const response = await fetch(`https://api.resend.com${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'the-lion-company-website/1.0'
        },
        body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, result };
}

async function addNewsletterContact(email, apiKey) {
    const created = await resendRequest('/contacts', apiKey, 'POST', {
        email,
        unsubscribed: false
    });

    if (created.ok) return;

    // A repeat signup should safely re-subscribe the existing contact.
    if (created.status === 409) {
        const updated = await resendRequest(`/contacts/${encodeURIComponent(email)}`, apiKey, 'PATCH', {
            unsubscribed: false
        });
        if (updated.ok) return;
    }

    throw new Error(`Unable to save newsletter contact (${created.status})`);
}

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    const origin = request.headers.origin;
    if (origin && !isAllowedOrigin(origin)) {
        return sendJson(response, 403, { error: 'Invalid origin' });
    }

    const body = request.body && typeof request.body === 'object' ? request.body : {};
    if (clean(body.website, 200)) return sendJson(response, 200, { ok: true });

    const type = clean(body.type, 20);
    const fields = {
        firstName: clean(body.firstName, 100),
        lastName: clean(body.lastName, 100),
        email: clean(body.email, 254).toLowerCase(),
        phone: clean(body.phone, 50),
        message: clean(body.message, 10000)
    };

    if (type !== 'newsletter') {
        return sendJson(response, 400, { error: 'Invalid form type' });
    }
    if (!validEmail(fields.email)) {
        return sendJson(response, 400, { error: 'Please enter a valid email address' });
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY is not configured');
        return sendJson(response, 503, { error: 'Newsletter service is not configured' });
    }

    try {
        await addNewsletterContact(fields.email, apiKey);

        return sendJson(response, 200, { ok: true });
    } catch (error) {
        console.error('Form processing failed:', error);
        return sendJson(response, 502, { error: 'Unable to process this submission' });
    }
};
