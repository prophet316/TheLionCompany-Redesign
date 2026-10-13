const crypto = require('node:crypto');

const SITE_URL = 'https://www.thelioncompany.org';
const LION_IMAGE_URL = `${SITE_URL}/lion_bg.jpg`;
const PRAYER_MASTHEAD_URL = `${SITE_URL}/assets/email/prayer-masthead.jpg`;
const DEFAULT_TEAM_INBOX = 'jonathan@thelioncompany.org';
const DEFAULT_CONTACT_INBOX = 'jonathan@thelioncompany.org';
const CONFIRMATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// A repeat signup inside this window replays the first confirmation email (same Idempotency-Key, same bytes).
const CONFIRMATION_RESEND_WINDOW_MS = 10 * 60 * 1000;
const RESEND_TIMEOUT_MS = 6000;
const RESEND_RETRY_DELAY_MS = 800;
// People take more than a couple of seconds to fill a form; scripts do not.
const MIN_FILL_MS = 2500;

const ALLOWED_ORIGINS = new Set([
    'https://thelioncompany.org',
    'https://www.thelioncompany.org',
    'https://the-lion-company-redesign.vercel.app'
]);

function isAllowedOrigin(origin) {
    return ALLOWED_ORIGINS.has(origin)
        || /^https:\/\/the-lion-company-redesign-[a-z0-9-]+-prophet316s-projects\.vercel\.app$/.test(origin)
        || (process.env.VERCEL_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
}

function sendJson(response, status, body) {
    response.status(status).setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(body));
}

// The confirmation pages carry the subscriber's email in their URL: never pass it on as a referrer.
function sendHtml(response, status, body) {
    response.status(status).setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.end(body);
}

function clean(value, maxLength) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

// Single-line fields end up in email subjects and headers: no control characters.
function cleanLine(value, maxLength) {
    return clean(typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]+/g, ' ') : value, maxLength);
}

// Only a plain name is echoed back to the address someone typed in, so the form cannot carry spam to strangers.
function plainFirstName(value) {
    return /^[\p{L}\p{M}][\p{L}\p{M}' .-]{0,39}$/u.test(value) ? value : '';
}

function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function validResourceId(value) {
    return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
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
                    <a href="${escapeHtml(cta.href)}" rel="noreferrer" style="display:inline-block;padding:14px 24px;color:#050505;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.6px;text-decoration:none;text-transform:uppercase;">${escapeHtml(cta.label)}</a>
                </td>
            </tr>
        </table>` : '';

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="referrer" content="no-referrer">
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

// Matches the redesigned site and the monthly letter: masthead, Anton headline, one orange accent.
// Never echoes anything from the request itself.
function prayerAcknowledgment(firstName) {
    const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hello,';
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>We are praying with you</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Anonymous+Pro:wght@700&family=Manrope:wght@400&display=swap">
</head>
<body style="margin:0;padding:0;background:#050608;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your prayer request reached us. It stays private, and we are praying with you.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#050608">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#050608;">
  <tr><td style="padding:0 0 14px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="font-family:'Anonymous Pro','Courier New',monospace;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8f97a5;">The Lion Company</td>
      <td align="right" style="font-family:'Anonymous Pro','Courier New',monospace;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;"><a href="${SITE_URL}/" style="color:#e48d1d;text-decoration:none;">thelioncompany.org &#8599;</a></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:0;"><img src="${PRAYER_MASTHEAD_URL}" width="600" alt="LION COMPANY" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>
  <tr><td style="padding:36px 32px 8px;">
    <div style="font-family:'Anonymous Pro','Courier New',monospace;font-weight:700;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#e48d1d;">Prayer received</div>
    <div style="font-family:Anton,Impact,'Arial Narrow Bold',sans-serif;font-size:50px;line-height:54px;text-transform:uppercase;color:#eef1f6;margin-top:12px;">We are praying<br><span style="color:#e48d1d;">with you.</span></div>
  </td></tr>
  <tr><td style="padding:18px 32px 0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:16px;line-height:27px;color:#c9ced8;">
    <p style="margin:0 0 18px;">${greeting}</p>
    <p style="margin:0 0 18px;">Thank you for trusting us with what's on your heart. Your request reached us, it stays private, and we are bringing it before Jesus with you.</p>
    <p style="margin:0 0 18px;">You are not carrying this alone. When God moves, write back and tell us. We would love to celebrate it with you.</p>
  </td></tr>
  <tr><td style="padding:10px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0f13;border-left:4px solid #e48d1d;"><tr><td style="padding:20px 22px;">
      <div style="font-family:Manrope,Helvetica,Arial,sans-serif;font-size:18px;line-height:28px;color:#eef1f6;font-style:italic;">&ldquo;The prayer of a righteous person is powerful and effective.&rdquo;</div>
      <div style="font-family:'Anonymous Pro','Courier New',monospace;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8f97a5;margin-top:10px;">James 5:16 &middot; NIV</div>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:28px 32px 0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:16px;line-height:27px;color:#c9ced8;">
    <p style="margin:0;">Standing with you,<br><span style="color:#eef1f6;">Jonathan &amp; Gina</span><br><span style="font-family:'Anonymous Pro','Courier New',monospace;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8f97a5;">The Lion Company</span></p>
  </td></tr>
  <tr><td style="padding:30px 32px 0;">
    <a href="${SITE_URL}/#podcast" style="display:inline-block;background:#e48d1d;color:#050608;text-decoration:none;font-family:'Anonymous Pro','Courier New',monospace;font-weight:700;font-size:12px;letter-spacing:3px;text-transform:uppercase;padding:14px 24px;">Listen to the podcast &#8599;</a>
  </td></tr>
  <tr><td style="padding:40px 32px 8px;border-bottom:1px solid #1c2028;"></td></tr>
  <tr><td align="center" style="padding:20px 32px 0;font-family:'Anonymous Pro','Courier New',monospace;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8f97a5;">The Lion Company &middot; Austin, TX</td></tr>
  <tr><td align="center" style="padding:8px 32px 0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#6b7280;">You're receiving this one email because you sent a prayer request at thelioncompany.org. Reply to this email to reach us directly.<br>Scripture taken from the Holy Bible, NEW INTERNATIONAL VERSION&reg;, NIV&reg;. Copyright &copy; 1973, 1978, 1984, 2011 by Biblica, Inc.&reg; Used by permission. All rights reserved worldwide.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function prayerTeamNotification(fields) {
    const name = [fields.firstName, fields.lastName].filter(Boolean).join(' ') || 'Not provided';
    const phoneRow = fields.phone ? `
        <tr>
            <td style="padding:0 0 13px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#A99454;text-transform:uppercase;vertical-align:top;">Phone</td>
            <td style="padding:0 0 13px 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#F3EFE5;vertical-align:top;">${escapeHtml(fields.phone)}</td>
        </tr>` : '';

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>New prayer request</title>
</head>
<body style="margin:0;padding:0;background:#050505;color:#F7F3E8;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Private prayer request from ${escapeHtml(name)}. Reply directly to respond.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#050505">
        <tr>
            <td align="center" style="padding:28px 12px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#0B0B0B;border:1px solid #2E281A;border-top:4px solid #D4AF37;">
                    <tr>
                        <td style="padding:23px 30px 21px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="font-family:Georgia,'Times New Roman',serif;font-size:16px;letter-spacing:4px;color:#FFFFFF;">THE LION COMPANY</td>
                                    <td align="right" style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;color:#D4AF37;text-transform:uppercase;">Prayer Ministry</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <img src="${LION_IMAGE_URL}" width="640" height="150" alt="" style="display:block;width:100%;height:150px;object-fit:cover;object-position:center 43%;border:0;outline:none;text-decoration:none;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:34px 34px 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px;">
                                <tr>
                                    <td style="padding:6px 10px;border:1px solid #66572B;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:1.8px;color:#D4AF37;text-transform:uppercase;">Private prayer request</td>
                                </tr>
                            </table>
                            <h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.18;font-weight:400;color:#FFFFFF;">A prayer request has arrived.</h1>
                            <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:14px;line-height:1.65;color:#9E988C;">Pray with care. Reply directly to this email if a personal follow-up is appropriate.</p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;padding:20px 20px 7px;background:#11100E;border:1px solid #29251A;">
                                <tr>
                                    <td style="padding:0 0 13px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#A99454;text-transform:uppercase;vertical-align:top;">Name</td>
                                    <td style="padding:0 0 13px 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#F3EFE5;vertical-align:top;">${escapeHtml(name)}</td>
                                </tr>
                                <tr>
                                    <td style="padding:0 0 13px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#A99454;text-transform:uppercase;vertical-align:top;">Email</td>
                                    <td style="padding:0 0 13px 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#F3EFE5;vertical-align:top;">${escapeHtml(fields.email)}</td>
                                </tr>
                                ${phoneRow}
                            </table>

                            <div style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;color:#D4AF37;text-transform:uppercase;">Prayer request</div>
                            <div style="padding:24px 24px 25px;background:#141310;border:1px solid #413718;border-left:3px solid #D4AF37;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.72;color:#F1EBDD;white-space:pre-wrap;">${escapeHtml(fields.message)}</div>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:25px;">
                                <tr>
                                    <td style="padding-top:18px;border-top:1px solid #29251A;font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:#777167;">Confidential ministry information. Keep this request within the prayer team.</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:20px 30px;border-top:1px solid #2B2517;background:#080808;">
                            <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2.6px;color:#D4AF37;text-transform:uppercase;">Unity Through Christ</div>
                            <div style="margin-top:9px;font-family:Arial,sans-serif;font-size:12px;color:#7F7A70;">
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

function contactAcknowledgment(firstName) {
    const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hello,';
    return emailShell({
        preheader: 'Your message has been received by The Lion Company.',
        eyebrow: 'Message received',
        title: 'Thank you for reaching out.',
        bodyHtml: `
            <p style="margin:0 0 18px;">${greeting}</p>
            <p style="margin:0 0 18px;">Your message has been delivered to The Lion Company.</p>
            <p style="margin:0;">If a response is appropriate, someone from the ministry will follow up with you directly.</p>`
    });
}

function contactTeamNotification(fields) {
    const name = [fields.firstName, fields.lastName].filter(Boolean).join(' ') || 'Not provided';
    const phoneLine = fields.phone ? `<p style="margin:0 0 8px;"><strong style="color:#A99454;">Phone:</strong> ${escapeHtml(fields.phone)}</p>` : '';

    return emailShell({
        preheader: `Website contact message from ${name}.`,
        eyebrow: 'Website contact',
        title: 'A new message has arrived.',
        bodyHtml: `
            <div style="padding:20px;background:#11100E;border:1px solid #29251A;">
                <p style="margin:0 0 8px;"><strong style="color:#A99454;">Name:</strong> ${escapeHtml(name)}</p>
                <p style="margin:0 0 8px;"><strong style="color:#A99454;">Email:</strong> ${escapeHtml(fields.email)}</p>
                ${phoneLine}
            </div>
            <div style="margin:24px 0 8px;font-size:11px;font-weight:700;letter-spacing:1.8px;color:#D4AF37;text-transform:uppercase;">Message</div>
            <div style="padding:22px;background:#141310;border:1px solid #413718;border-left:3px solid #D4AF37;white-space:pre-wrap;">${escapeHtml(fields.message)}</div>
            <p style="margin:20px 0 0;font-size:12px;color:#8F897F;">Reply directly to this email to respond to the sender.</p>`
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
            href: `${SITE_URL}/#connect`,
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

    // One retry, with the same Idempotency-Key, for rate limits, Resend 5xx, network errors and timeouts.
    // Every call here is safe to repeat: sends carry the key and contact writes are idempotent.
    for (let attempt = 1; ; attempt++) {
        let status = 0;
        let result = {};
        try {
            const response = await fetch(`https://api.resend.com${path}`, {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: AbortSignal.timeout(RESEND_TIMEOUT_MS)
            });
            status = response.status;
            result = await response.json().catch(() => ({}));
            if (response.ok || attempt === 2 || (status !== 429 && status < 500)) {
                return { ok: response.ok, status, result };
            }
        } catch (error) {
            if (attempt === 2) return { ok: false, status, result: { name: error.name } };
        }
        await new Promise((resolve) => setTimeout(resolve, RESEND_RETRY_DELAY_MS));
    }
}

// Resend's error name (e.g. invalid_idempotent_request, rate_limit_exceeded) without any personal data.
function resendError(label, reply) {
    return new Error(`${label} (${reply.status} ${reply.result?.name || 'unknown'})`);
}

async function ensurePendingNewsletterContact(email, apiKey) {
    // Look the contact up first: an existing contact, confirmed or not, is left exactly as it is,
    // so a repeat signup can never globally unsubscribe a confirmed subscriber. (Resend answers
    // POST /contacts for an existing email with 201, so the create call cannot be the check.)
    const existing = await resendRequest(`/contacts/${encodeURIComponent(email)}`, apiKey, 'GET');
    if (existing.ok) return;
    if (existing.status !== 404) throw resendError('Unable to look up newsletter contact', existing);

    const created = await resendRequest('/contacts', apiKey, 'POST', {
        email,
        unsubscribed: true
    });
    if (!created.ok && created.status !== 409) throw resendError('Unable to create newsletter contact', created);
}

async function confirmNewsletterContact(email, apiKey, segmentId, topicId) {
    const topicUpdated = await resendRequest(
        `/contacts/${encodeURIComponent(email)}/topics`,
        apiKey,
        'PATCH',
        { topics: [{ id: topicId, subscription: 'opt_in' }] }
    );
    if (!topicUpdated.ok) throw resendError('Unable to opt in newsletter topic', topicUpdated);

    const segmentAdded = await resendRequest(
        `/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(segmentId)}`,
        apiKey,
        'POST'
    );
    if (!segmentAdded.ok && segmentAdded.status !== 409) {
        throw resendError('Unable to add newsletter segment', segmentAdded);
    }

    // Global subscription is enabled last. If targeting setup fails, the
    // contact remains safely excluded from every Broadcast.
    const updated = await resendRequest(`/contacts/${encodeURIComponent(email)}`, apiKey, 'PATCH', {
        unsubscribed: false
    });
    if (!updated.ok) throw resendError('Unable to confirm newsletter contact', updated);
}

async function sendEmail(email, apiKey, idempotencyKey) {
    const sent = await resendRequest('/emails', apiKey, 'POST', email, idempotencyKey);
    if (!sent.ok) throw resendError('Unable to send email', sent);
}

// The private team notification is the part that must arrive. It goes first and on its own,
// so a problem with the visitor's own address can never lose a prayer request or a message.
async function sendTeamThenAcknowledgment(kind, teamEmail, acknowledgment, apiKey, keyValues) {
    await sendEmail(teamEmail, apiKey, idempotencyKey(`lion-${kind}-team`, keyValues, 10 * 60 * 1000));
    try {
        await sendEmail(acknowledgment, apiKey, idempotencyKey(`lion-${kind}-ack`, keyValues, 10 * 60 * 1000));
    } catch (error) {
        console.error(`${kind} acknowledgment failed:`, error.message);
    }
}

function idempotencyKey(prefix, values, windowMs, now = Date.now()) {
    const bucket = Math.floor(now / windowMs);
    const digest = crypto
        .createHash('sha256')
        .update([...values, String(bucket)].join('\n'))
        .digest('hex')
        .slice(0, 40);
    return `${prefix}-${digest}`;
}

// Links are signed with LION_CONFIRM_SECRET when it is set, otherwise with the Resend API key.
// Both keys are accepted, so links already sent (signed with the API key) keep working.
function signingKey(apiKey) {
    return process.env.LION_CONFIRM_SECRET || apiKey;
}

function signConfirmation(email, expires, key) {
    return crypto
        .createHmac('sha256', key)
        .update(`lion-newsletter-confirmation-v1\n${email}\n${expires}`)
        .digest('hex');
}

function validSignature(email, expires, signature, apiKey) {
    if (!/^[a-f0-9]{64}$/.test(signature)) return false;
    const given = Buffer.from(signature, 'hex');
    return [...new Set([signingKey(apiKey), apiKey])].some((key) =>
        crypto.timingSafeEqual(given, Buffer.from(signConfirmation(email, expires, key), 'hex')));
}

function buildConfirmationUrl(email, apiKey, now = Date.now()) {
    // Expiry is pinned to the resend window, so a repeat signup inside the window builds a
    // byte-identical email and Resend replays the first send instead of answering 409.
    const bucket = Math.floor(now / CONFIRMATION_RESEND_WINDOW_MS);
    const expires = (bucket + 1) * CONFIRMATION_RESEND_WINDOW_MS + CONFIRMATION_TTL_MS;
    const url = new URL('/api/forms', SITE_URL);
    url.searchParams.set('action', 'confirm');
    url.searchParams.set('email', email);
    url.searchParams.set('expires', String(expires));
    url.searchParams.set('signature', signConfirmation(email, expires, signingKey(apiKey)));
    return url.toString();
}

function requestQuery(request) {
    if (request.query && typeof request.query === 'object') return request.query;
    const url = new URL(request.url || '/api/forms', SITE_URL);
    return Object.fromEntries(url.searchParams.entries());
}

async function handleConfirmation(request, response, apiKey, segmentId, topicId) {
    const query = requestQuery(request);
    if (query.action !== 'confirm') {
        response.setHeader('Allow', 'GET, POST');
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
    if (!validResourceId(segmentId) || !validResourceId(topicId)) {
        console.error('Newsletter Segment or Topic is not configured');
        return sendHtml(response, 503, confirmationErrorPage('Newsletter preferences are not configured yet. Please try again later.'));
    }

    try {
        await confirmNewsletterContact(email, apiKey, segmentId, topicId);
        return sendHtml(response, 200, newsletterConfirmedPage());
    } catch (error) {
        console.error('Newsletter confirmation failed:', error.message);
        return sendHtml(response, 502, confirmationErrorPage('We could not confirm your email just now. Please request a new link.'));
    }
}

// Starts double opt-in for one email: a pending Resend contact, the confirmation email, and a note to Jonathan.
// `source` says which form it came from ('newsletter', or 'prayer' / 'contact' when their box was ticked).
async function startNewsletterSignup(fields, origin, teamInbox, apiKey, source = 'newsletter') {
    await ensurePendingNewsletterContact(fields.email, apiKey);
    const now = Date.now();
    const confirmationUrl = buildConfirmationUrl(fields.email, apiKey, now);
    await sendEmail({
        from: 'The Lion Company <welcome@updates.thelioncompany.org>',
        to: [fields.email],
        reply_to: teamInbox,
        subject: 'Confirm your place with The Lion Company',
        html: newsletterConfirmation(confirmationUrl),
        text: `Thank you for joining The Lion Company.\n\nConfirm your email to receive ministry updates, teachings, gatherings, and stories of what Jesus is doing through this community:\n${confirmationUrl}\n\nIf you did not request this, you can safely ignore this email.`
    }, apiKey, idempotencyKey(
        'lion-newsletter-confirmation',
        [origin, fields.email],
        CONFIRMATION_RESEND_WINDOW_MS,
        now
    ));
    // Jonathan hears about every signup. A failed alert must never block the signup itself.
    try {
        await sendEmail({
            from: 'The Lion Company Website <welcome@updates.thelioncompany.org>',
            to: [teamInbox],
            reply_to: fields.email,
            subject: `[Lion Website Form] Newsletter signup — ${fields.email}`,
            tags: [{ name: 'lion_form_type', value: 'newsletter' }],
            html: emailShell({
                preheader: `${fields.email} joined the mailing list.`,
                eyebrow: 'Mailing list',
                title: 'New newsletter signup',
                bodyHtml: `<p style="margin:0 0 14px;"><strong>${escapeHtml(fields.email)}</strong> signed up on thelioncompany.org${source === 'newsletter' ? '' : ` (from the ${source} form)`}.</p><p style="margin:0;">They have been sent the confirmation email. Once they click it, they join the "Lion Monthly Newsletter" segment in Resend.</p>`
            }),
            text: `New newsletter signup on thelioncompany.org${source === 'newsletter' ? '' : ` (from the ${source} form)`}\n\nEmail: ${fields.email}\n\nThey have been sent the confirmation email. Once they click it, they join the "Lion Monthly Newsletter" segment in Resend.`
        }, apiKey, idempotencyKey(
            'lion-newsletter-alert',
            [origin, fields.email],
            60 * 60 * 1000
        ));
    } catch (alertError) {
        console.error('Newsletter signup alert failed:', alertError.message);
    }
}

// The prayer and contact forms carry an "Also send me the monthly letter" box. The message itself has
// already gone through by now, so a failed signup is logged and never turns the form into an error.
async function optInFromForm(body, fields, origin, teamInbox, apiKey, source) {
    if (body.joinNewsletter !== true) return;
    try {
        await startNewsletterSignup(fields, origin, teamInbox, apiKey, source);
    } catch (error) {
        console.error(`Newsletter opt-in from the ${source} form failed:`, error.message);
    }
}

module.exports = async function handler(request, response) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY is not configured');
        return sendJson(response, 503, { error: 'Email service is not configured' });
    }

    if (request.method === 'GET') {
        return handleConfirmation(
            request,
            response,
            apiKey,
            clean(process.env.LION_NEWSLETTER_SEGMENT_ID, 100),
            clean(process.env.LION_NEWSLETTER_TOPIC_ID, 100)
        );
    }
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'GET, POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    // Browsers always send Origin on a fetch POST, so only scripts arrive without one.
    const origin = request.headers.origin;
    if (!origin || !isAllowedOrigin(origin)) {
        return sendJson(response, 403, { error: 'Invalid origin' });
    }

    const body = request.body && typeof request.body === 'object' ? request.body : {};
    // Spam trap: a hidden field people never see or fill (named so browser autofill leaves it alone).
    if (clean(body.lion_hp_x, 200)) return sendJson(response, 200, { ok: true });
    // Time trap: a form sent faster than a person could fill it is quietly accepted and dropped.
    // Pages that do not send `elapsed` are still accepted.
    if (body.elapsed !== undefined) {
        const elapsed = Number(body.elapsed);
        if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return sendJson(response, 200, { ok: true });
    }

    const type = cleanLine(body.type, 20);
    const fields = {
        firstName: cleanLine(body.firstName, 100),
        lastName: cleanLine(body.lastName, 100),
        email: cleanLine(body.email, 254).toLowerCase(),
        phone: cleanLine(body.phone, 50),
        message: clean(body.message, 10000)
    };
    // The full name goes to the team only; the acknowledgment greets a plain first name, or says "Hello," as its HTML part already does.
    const safeFirst = plainFirstName(fields.firstName);
    const keyValues = [origin, fields.email, fields.firstName, fields.lastName, fields.phone, fields.message];

    if (!validEmail(fields.email)) {
        return sendJson(response, 400, { error: 'Please enter a valid email address' });
    }

    const configuredTeamInbox = clean(process.env.LION_TEAM_INBOX, 254).toLowerCase();
    const teamInbox = validEmail(configuredTeamInbox) ? configuredTeamInbox : DEFAULT_TEAM_INBOX;
    const configuredContactInbox = clean(process.env.LION_CONTACT_INBOX, 254).toLowerCase();
    const contactInbox = validEmail(configuredContactInbox) ? configuredContactInbox : DEFAULT_CONTACT_INBOX;

    try {
        if (type === 'prayer') {
            if (!fields.firstName || !fields.message) {
                return sendJson(response, 400, { error: 'Please complete the required prayer fields' });
            }

            const name = [fields.firstName, fields.lastName].filter(Boolean).join(' ');
            await sendTeamThenAcknowledgment('prayer',
                {
                    from: 'The Lion Company Prayer Team <prayer@updates.thelioncompany.org>',
                    to: [teamInbox],
                    reply_to: fields.email,
                    subject: `[Lion Website Form] Prayer — ${name}`,
                    tags: [{ name: 'lion_form_type', value: 'prayer' }],
                    html: prayerTeamNotification(fields),
                    text: `THE LION COMPANY | PRAYER MINISTRY\n\nPRIVATE PRAYER REQUEST\n\nName: ${name}\nEmail: ${fields.email}${fields.phone ? `\nPhone: ${fields.phone}` : ''}\n\nPRAYER REQUEST\n${fields.message}\n\nReply directly to this email if a personal follow-up is appropriate.\n\nConfidential ministry information. Keep this request within the prayer team.`
                },
                {
                    from: 'The Lion Company <prayer@updates.thelioncompany.org>',
                    to: [fields.email],
                    reply_to: teamInbox,
                    subject: "We're praying with you",
                    html: prayerAcknowledgment(safeFirst),
                    text: `${safeFirst ? `Hi ${safeFirst},` : 'Hello,'}\n\nThank you for trusting us with what's on your heart. Your request reached us, it stays private, and we are bringing it before Jesus with you.\n\nYou are not carrying this alone. When God moves, write back and tell us. We would love to celebrate it with you.\n\n"The prayer of a righteous person is powerful and effective." James 5:16 (NIV)\n\nStanding with you,\nJonathan & Gina\nThe Lion Company\n\nThe Lion Company · Austin, TX\nYou're receiving this one email because you sent a prayer request at thelioncompany.org. Reply to this email to reach us directly.`
                },
                apiKey,
                keyValues
            );
            await optInFromForm(body, fields, origin, teamInbox, apiKey, 'prayer');
            return sendJson(response, 200, { ok: true });
        }

        if (type === 'contact') {
            if (!fields.firstName || !fields.message) {
                return sendJson(response, 400, { error: 'Please complete the required contact fields' });
            }

            const name = [fields.firstName, fields.lastName].filter(Boolean).join(' ');
            await sendTeamThenAcknowledgment('contact',
                {
                    from: 'The Lion Company Contact <contact@updates.thelioncompany.org>',
                    to: [contactInbox],
                    reply_to: fields.email,
                    subject: `[Lion Website Form] Contact — ${name}`,
                    tags: [{ name: 'lion_form_type', value: 'contact' }],
                    html: contactTeamNotification(fields),
                    text: `THE LION COMPANY | WEBSITE CONTACT\n\nName: ${name}\nEmail: ${fields.email}${fields.phone ? `\nPhone: ${fields.phone}` : ''}\n\nMESSAGE\n${fields.message}\n\nReply directly to this email to respond to the sender.`
                },
                {
                    from: 'The Lion Company <contact@updates.thelioncompany.org>',
                    to: [fields.email],
                    reply_to: contactInbox,
                    subject: 'We received your message',
                    html: contactAcknowledgment(safeFirst),
                    text: `${safeFirst ? `Hi ${safeFirst},` : 'Hello,'}\n\nYour message has been delivered to The Lion Company. If a response is appropriate, someone from the ministry will follow up with you directly.\n\nUnity Through Christ\nThe Lion Company`
                },
                apiKey,
                keyValues
            );
            await optInFromForm(body, fields, origin, teamInbox, apiKey, 'contact');
            return sendJson(response, 200, { ok: true });
        }

        if (type === 'newsletter') {
            await startNewsletterSignup(fields, origin, teamInbox, apiKey);
            return sendJson(response, 200, { ok: true, confirmationRequired: true });
        }

        return sendJson(response, 400, { error: 'Invalid form type' });
    } catch (error) {
        console.error(`Form processing failed (${type || 'unknown'}):`, error.message);
        return sendJson(response, 502, { error: 'Unable to process this submission' });
    }
};
