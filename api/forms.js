const crypto = require('node:crypto');

const SITE_URL = 'https://www.thelioncompany.org';
const LION_IMAGE_URL = `${SITE_URL}/lion_bg.jpg`;
const DEFAULT_TEAM_INBOX = 'jonathan@thelioncompany.org';
const CONFIRMATION_TTL_MS = 48 * 60 * 60 * 1000;

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

function sendHtml(response, status, body) {
    response.status(status).setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(body);
}

function clean(value, maxLength) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function emailShell({ preheader, eyebrow, title, bodyHtml, cta }) {
    const ctaHtml = cta ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px;">
            <tr>
                <td bgcolor="#D4AF37" style="border-radius:2px;">
                    <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:14px 24px;color:#050505;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.6px;text-decoration:none;text-transform:uppercase;">${escapeHtml(cta.label)}</a>
                </td>
            </tr>
        </table>` : '';

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#050505;color:#F7F3E8;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#050505">
        <tr>
            <td align="center" style="padding:28px 12px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#0A0A0A;border:1px solid #2B2517;">
                    <tr>
                        <td style="padding:22px 30px;border-bottom:1px solid #2B2517;text-align:center;">
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;letter-spacing:4px;color:#F7F3E8;">THE LION COMPANY</div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <img src="${LION_IMAGE_URL}" width="620" height="220" alt="The Lion Company" style="display:block;width:100%;height:220px;object-fit:cover;object-position:center 43%;border:0;outline:none;text-decoration:none;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:38px 38px 34px;">
                            <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2.4px;color:#D4AF37;text-transform:uppercase;">${escapeHtml(eyebrow)}</div>
                            <h1 style="margin:13px 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.16;font-weight:400;color:#FFFFFF;">${escapeHtml(title)}</h1>
                            <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.75;color:#D5D0C5;">${bodyHtml}</div>
                            ${ctaHtml}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:22px 30px;border-top:1px solid #2B2517;text-align:center;">
                            <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2.6px;color:#D4AF37;text-transform:uppercase;">Unity Through Christ</div>
                            <div style="margin-top:10px;font-family:Arial,sans-serif;font-size:12px;color:#7F7A70;">
                                <a href="${SITE_URL}" style="color:#B8B1A3;text-decoration:none;">thelioncompany.org</a>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function prayerAcknowledgment(firstName) {
    const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hello,';
    return emailShell({
        preheader: 'Your prayer request has been received by The Lion Company.',
        eyebrow: 'Prayer received',
        title: 'We are standing with you.',
        bodyHtml: `
            <p style="margin:0 0 18px;">${greeting}</p>
            <p style="margin:0 0 18px;">Thank you for trusting The Lion Company with your prayer request. It will be submitted to our prayer team, and we will be standing with you in faith.</p>
            <p style="margin:0;">Please keep us updated as your testimony and miracle unfold. We would be honored to celebrate what Jesus does with you.</p>`
    });
}

function prayerTeamNotification(fields) {
    const name = [fields.firstName, fields.lastName].filter(Boolean).join(' ') || 'Not provided';
    const phone = fields.phone || 'Not provided';
    return emailShell({
        preheader: `New prayer request from ${name}.`,
        eyebrow: 'Prayer team',
        title: 'A new request is ready for prayer.',
        bodyHtml: `
            <p style="margin:0 0 10px;"><strong style="color:#FFFFFF;">Name:</strong> ${escapeHtml(name)}</p>
            <p style="margin:0 0 10px;"><strong style="color:#FFFFFF;">Email:</strong> ${escapeHtml(fields.email)}</p>
            <p style="margin:0 0 22px;"><strong style="color:#FFFFFF;">Phone:</strong> ${escapeHtml(phone)}</p>
            <div style="padding:18px;border-left:2px solid #D4AF37;background:#11100E;color:#F1EBDD;white-space:pre-wrap;">${escapeHtml(fields.message)}</div>
            <p style="margin:22px 0 0;font-size:12px;color:#8F897F;">Private ministry information. Share only with the prayer team members who need it.</p>`
    });
}

function newsletterConfirmation(confirmationUrl) {
    return emailShell({
        preheader: 'Confirm your subscription to The Lion Company.',
        eyebrow: 'Stay connected',
        title: 'Confirm your place.',
        bodyHtml: `
            <p style="margin:0 0 18px;">Thank you for joining The Lion Company.</p>
            <p style="margin:0;">Confirm your email to receive ministry updates, teachings, gatherings, and stories of what Jesus is doing through this community.</p>
            <p style="margin:18px 0 0;font-size:12px;color:#8F897F;">If you did not request this, you can safely ignore this email.</p>`,
        cta: {
            href: confirmationUrl,
            label: 'Confirm subscription'
        }
    });
}

function newsletterConfirmedPage() {
    return emailShell({
        preheader: 'Your subscription is confirmed.',
        eyebrow: 'Welcome',
        title: 'You are on the list.',
        bodyHtml: `
            <p style="margin:0 0 18px;">Your email is confirmed. You will now receive updates from The Lion Company.</p>
            <p style="margin:0;">Thank you for standing with a ministry committed to unity through Christ.</p>`,
        cta: {
            href: SITE_URL,
            label: 'Return to The Lion Company'
        }
    });
}

function confirmationErrorPage(message) {
    return emailShell({
        preheader: 'We could not confirm this subscription.',
        eyebrow: 'Subscription confirmation',
        title: 'This link could not be confirmed.',
        bodyHtml: `<p style="margin:0;">${escapeHtml(message)}</p>`,
        cta: {
            href: `${SITE_URL}/#newsletter`,
            label: 'Request a new link'
        }
    });
}

async function resendRequest(path, apiKey, method, body, idempotencyKey) {
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'the-lion-company-website/2.0'
    };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    const response = await fetch(`https://api.resend.com${path}`, {
        method,
        headers,
        body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, result };
}

async function setNewsletterContact(email, apiKey, unsubscribed) {
    const created = await resendRequest('/contacts', apiKey, 'POST', {
        email,
        unsubscribed
    });

    if (created.ok) return;

    if (created.status === 409) {
        const updated = await resendRequest(`/contacts/${encodeURIComponent(email)}`, apiKey, 'PATCH', {
            unsubscribed
        });
        if (updated.ok) return;
    }

    throw new Error(`Unable to update newsletter contact (${created.status})`);
}

async function confirmNewsletterContact(email, apiKey) {
    const updated = await resendRequest(`/contacts/${encodeURIComponent(email)}`, apiKey, 'PATCH', {
        unsubscribed: false
    });
    if (!updated.ok) throw new Error(`Unable to confirm newsletter contact (${updated.status})`);
}

async function sendEmail(email, apiKey, idempotencyKey) {
    const sent = await resendRequest('/emails', apiKey, 'POST', email, idempotencyKey);
    if (!sent.ok) throw new Error(`Unable to send email (${sent.status})`);
}

async function sendEmailBatch(emails, apiKey, idempotencyKey) {
    const sent = await resendRequest('/emails/batch', apiKey, 'POST', emails, idempotencyKey);
    if (!sent.ok) throw new Error(`Unable to send email batch (${sent.status})`);
}

function idempotencyKey(prefix, values, windowMs) {
    const bucket = Math.floor(Date.now() / windowMs);
    const digest = crypto
        .createHash('sha256')
        .update([...values, String(bucket)].join('\n'))
        .digest('hex')
        .slice(0, 40);
    return `${prefix}-${digest}`;
}

function signConfirmation(email, expires, apiKey) {
    return crypto
        .createHmac('sha256', apiKey)
        .update(`lion-newsletter-confirmation-v1\n${email}\n${expires}`)
        .digest('hex');
}

function validSignature(email, expires, signature, apiKey) {
    const expected = signConfirmation(email, expires, apiKey);
    if (!/^[a-f0-9]{64}$/.test(signature)) return false;
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}

function buildConfirmationUrl(email, apiKey) {
    const expires = Date.now() + CONFIRMATION_TTL_MS;
    const url = new URL('/api/forms', SITE_URL);
    url.searchParams.set('action', 'confirm');
    url.searchParams.set('email', email);
    url.searchParams.set('expires', String(expires));
    url.searchParams.set('signature', signConfirmation(email, expires, apiKey));
    return url.toString();
}

function requestQuery(request) {
    if (request.query && typeof request.query === 'object') return request.query;
    const url = new URL(request.url || '/api/forms', SITE_URL);
    return Object.fromEntries(url.searchParams.entries());
}

async function handleConfirmation(request, response, apiKey) {
    const query = requestQuery(request);
    if (query.action !== 'confirm') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    const email = clean(query.email, 254).toLowerCase();
    const expires = Number(query.expires);
    const signature = clean(query.signature, 128);

    if (!validEmail(email) || !Number.isSafeInteger(expires) || expires < Date.now()) {
        return sendHtml(response, 400, confirmationErrorPage('This confirmation link is invalid or has expired.'));
    }
    if (!validSignature(email, expires, signature, apiKey)) {
        return sendHtml(response, 400, confirmationErrorPage('This confirmation link is invalid or has expired.'));
    }

    try {
        await confirmNewsletterContact(email, apiKey);
        return sendHtml(response, 200, newsletterConfirmedPage());
    } catch (error) {
        console.error('Newsletter confirmation failed:', error);
        return sendHtml(response, 502, confirmationErrorPage('We could not confirm your email just now. Please request a new link.'));
    }
}

module.exports = async function handler(request, response) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY is not configured');
        return sendJson(response, 503, { error: 'Email service is not configured' });
    }

    if (request.method === 'GET') {
        return handleConfirmation(request, response, apiKey);
    }
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

    if (!validEmail(fields.email)) {
        return sendJson(response, 400, { error: 'Please enter a valid email address' });
    }

    const configuredTeamInbox = clean(process.env.LION_TEAM_INBOX, 254).toLowerCase();
    const teamInbox = validEmail(configuredTeamInbox) ? configuredTeamInbox : DEFAULT_TEAM_INBOX;

    try {
        if (type === 'prayer') {
            if (!fields.firstName || !fields.message) {
                return sendJson(response, 400, { error: 'Please complete the required prayer fields' });
            }

            const name = [fields.firstName, fields.lastName].filter(Boolean).join(' ');
            await sendEmailBatch([
                {
                    from: 'The Lion Company <prayer@updates.thelioncompany.org>',
                    to: [fields.email],
                    reply_to: teamInbox,
                    subject: 'We received your prayer request',
                    html: prayerAcknowledgment(fields.firstName),
                    text: `Hi ${fields.firstName},\n\nThank you for trusting The Lion Company with your prayer request. It will be submitted to our prayer team, and we will be standing with you in faith.\n\nPlease keep us updated as your testimony and miracle unfold. We would be honored to celebrate what Jesus does with you.\n\nUnity Through Christ\nThe Lion Company`
                },
                {
                    from: 'The Lion Company Prayer Team <prayer@updates.thelioncompany.org>',
                    to: [teamInbox],
                    reply_to: fields.email,
                    subject: `New prayer request — ${name}`,
                    html: prayerTeamNotification(fields),
                    text: `New prayer request\n\nName: ${name}\nEmail: ${fields.email}\nPhone: ${fields.phone || 'Not provided'}\n\n${fields.message}\n\nPrivate ministry information.`
                }
            ], apiKey, idempotencyKey(
                'lion-prayer',
                [origin || 'direct', fields.email, fields.firstName, fields.lastName, fields.phone, fields.message],
                10 * 60 * 1000
            ));
            return sendJson(response, 200, { ok: true });
        }

        if (type === 'newsletter') {
            await setNewsletterContact(fields.email, apiKey, true);
            const confirmationUrl = buildConfirmationUrl(fields.email, apiKey);
            await sendEmail({
                from: 'The Lion Company <welcome@updates.thelioncompany.org>',
                to: [fields.email],
                reply_to: teamInbox,
                subject: 'Confirm your place with The Lion Company',
                html: newsletterConfirmation(confirmationUrl),
                text: `Thank you for joining The Lion Company.\n\nConfirm your email to receive ministry updates, teachings, gatherings, and stories of what Jesus is doing through this community:\n${confirmationUrl}\n\nIf you did not request this, you can safely ignore this email.`
            }, apiKey, idempotencyKey(
                'lion-newsletter-confirmation',
                [origin || 'direct', fields.email],
                60 * 60 * 1000
            ));
            return sendJson(response, 200, { ok: true, confirmationRequired: true });
        }

        return sendJson(response, 400, { error: 'Invalid form type' });
    } catch (error) {
        console.error('Form processing failed:', error);
        return sendJson(response, 502, { error: 'Unable to process this submission' });
    }
};
