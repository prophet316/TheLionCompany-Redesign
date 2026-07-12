const RECIPIENT = 'Jonathan@TheLionCompany.org';
const ALLOWED_ORIGINS = new Set([
    'https://thelioncompany.org',
    'https://www.thelioncompany.org',
    'https://the-lion-company-redesign.vercel.app'
]);

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

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);
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

function buildNotification(type, fields) {
    const fullName = [fields.firstName, fields.lastName].filter(Boolean).join(' ') || 'Not provided';
    const labels = type === 'prayer'
        ? { subject: `New Prayer Request — ${fullName}`, heading: 'New prayer request', message: 'Prayer request' }
        : type === 'contact'
            ? { subject: `New Website Message — ${fullName}`, heading: 'New website message', message: 'Message' }
            : { subject: 'New Newsletter Signup — The Lion Company Website', heading: 'New newsletter signup', message: null };

    const lines = [
        `Name: ${fullName}`,
        `Email: ${fields.email}`,
        fields.phone ? `Phone: ${fields.phone}` : null,
        labels.message ? `\n${labels.message}:\n${fields.message}` : null
    ].filter(Boolean);

    const htmlRows = [
        ['Name', fullName],
        ['Email', fields.email],
        fields.phone ? ['Phone', fields.phone] : null,
        labels.message ? [labels.message, fields.message] : null
    ].filter(Boolean).map(([label, value]) =>
        `<tr><th align="left" style="padding:8px 12px;vertical-align:top">${escapeHtml(label)}</th><td style="padding:8px 12px;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`
    ).join('');

    return {
        subject: labels.subject,
        text: `${labels.heading}\n\n${lines.join('\n')}`,
        html: `<h2>${escapeHtml(labels.heading)}</h2><table style="border-collapse:collapse">${htmlRows}</table>`
    };
}

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    const origin = request.headers.origin;
    if (origin && !ALLOWED_ORIGINS.has(origin) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
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

    if (!['prayer', 'contact', 'newsletter'].includes(type)) {
        return sendJson(response, 400, { error: 'Invalid form type' });
    }
    if (!validEmail(fields.email)) {
        return sendJson(response, 400, { error: 'Please enter a valid email address' });
    }
    if (type !== 'newsletter' && (!fields.firstName || !fields.message)) {
        return sendJson(response, 400, { error: 'Please complete all required fields' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY is not configured');
        return sendJson(response, 503, { error: 'Email service is not configured' });
    }

    try {
        if (type === 'newsletter') await addNewsletterContact(fields.email, apiKey);

        const notification = buildNotification(type, fields);
        const sent = await resendRequest('/emails', apiKey, 'POST', {
            from: process.env.RESEND_FROM_EMAIL || 'The Lion Company Website <onboarding@resend.dev>',
            to: [RECIPIENT],
            reply_to: fields.email,
            ...notification
        });
        if (!sent.ok) throw new Error(`Unable to send notification (${sent.status})`);

        return sendJson(response, 200, { ok: true });
    } catch (error) {
        console.error('Form processing failed:', error);
        return sendJson(response, 502, { error: 'Unable to process this submission' });
    }
};
