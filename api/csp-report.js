// Receives Content-Security-Policy violation reports while the policy runs in
// Report-Only mode. Logs only the directive and the blocked origin: never the
// page's query string, form data or the visitor's IP. Delete once the policy is enforced.
const MAX_BYTES = 8 * 1024;

function originOf(value) {
    if (!value || typeof value !== 'string') return '';
    if (!/^https?:/i.test(value)) return value.slice(0, 40); // "inline", "eval", "data", ...
    try { return new URL(value).origin; } catch { return 'unparseable'; }
}

module.exports = async function handler(request, response) {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return response.status(405).end();
    }
    let raw = '';
    try {
        if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
            raw = JSON.stringify(request.body);
        } else if (typeof request.body === 'string' || Buffer.isBuffer(request.body)) {
            raw = String(request.body);
        } else {
            for await (const chunk of request) {
                raw += chunk;
                if (raw.length > MAX_BYTES) break;
            }
        }
        const parsed = JSON.parse(raw.slice(0, MAX_BYTES));
        const reports = Array.isArray(parsed) ? parsed.map((entry) => entry.body || entry) : [parsed['csp-report'] || parsed];
        for (const report of reports.slice(0, 5)) {
            const directive = report['effective-directive'] || report.effectiveDirective || report['violated-directive'] || '';
            const blocked = originOf(report['blocked-uri'] || report.blockedURL);
            const page = originOf(report['document-uri'] || report.documentURL);
            const path = (() => { try { return new URL(report['document-uri'] || report.documentURL).pathname; } catch { return ''; } })();
            console.warn(`CSP report-only: ${directive} blocked ${blocked} on ${page}${path}`);
        }
    } catch {
        // Malformed reports are ignored.
    }
    return response.status(204).end();
};
