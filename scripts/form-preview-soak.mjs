import { performance } from "node:perf_hooks";

const target = process.env.FORM_SOAK_TARGET_URL;
const token = process.env.FORM_SOAK_TURNSTILE_TOKEN;
const newsletterAddress = process.env.FORM_SOAK_NEWSLETTER_EMAIL;
if (!target || !token || !newsletterAddress) {
  throw new Error("FORM_SOAK_TARGET_URL, FORM_SOAK_TURNSTILE_TOKEN, and FORM_SOAK_NEWSLETTER_EMAIL are required");
}
if (!target.includes("vercel.app")) throw new Error("soak target must be a Vercel preview");

const latencies = [];
const origin = new URL(target).origin;

function payload(endpoint, index, submissionId = crypto.randomUUID()) {
  const shared = { submissionId, turnstileToken: token, website: "" };
  if (endpoint === "newsletter") {
    const [local, domain] = newsletterAddress.split("@");
    return { ...shared, email: `${local}+soak-${index}@${domain}`, consent: true, placement: "connect" };
  }
  if (endpoint === "prayer") {
    return { ...shared, displayName: "Synthetic Test", email: "", request: `Synthetic non-sensitive prayer delivery test number ${index}.`, followUpRequested: false };
  }
  return { ...shared, name: "Synthetic Test", email: newsletterAddress, reason: "general", message: `Synthetic non-sensitive contact delivery test number ${index}.` };
}

async function send(endpoint, body, expected = [202]) {
  const started = performance.now();
  const response = await fetch(`${origin}/api/forms/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
  latencies.push(performance.now() - started);
  if (!expected.includes(response.status)) throw new Error(`${endpoint} returned ${response.status}`);
  return response;
}

async function sendRaw(endpoint, init, expectedStatus) {
  const response = await fetch(`${origin}/api/forms/${endpoint}`, init);
  if (response.status !== expectedStatus) {
    throw new Error(`${endpoint} raw case returned ${response.status}`);
  }
}

for (const endpoint of ["newsletter", "prayer", "contact"]) {
  for (let index = 1; index <= 25; index += 1) await send(endpoint, payload(endpoint, index));
  await Promise.all(Array.from({ length: 10 }, (_, index) => send(endpoint, payload(endpoint, 100 + index))));
  const repeatedId = crypto.randomUUID();
  await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      send(endpoint, payload(endpoint, 200 + index, repeatedId), [202, 409]),
    ),
  );
  await send(endpoint, payload(endpoint, 300, repeatedId), [202]);
}

await send("contact", { ...payload("contact", 400), website: "bot-filled" }, [400]);
await send("contact", { ...payload("contact", 401), message: "short" }, [422]);
await send("contact", { ...payload("contact", 402), turnstileToken: "invalid-token" }, [400]);
await send("contact", {
  ...payload("contact", 403),
  message: "Synthetic <script>alert('test')</script> & CRLF\r\nBcc: test@example.org content.",
}, [202]);
await sendRaw("contact", {
  method: "POST",
  headers: { "content-type": "text/plain", origin },
  body: "not json",
}, 415);
await sendRaw("contact", {
  method: "POST",
  headers: { "content-type": "application/json", origin },
  body: JSON.stringify({ ...payload("contact", 404), message: "x".repeat(16_385) }),
}, 413);
await sendRaw("contact", {
  method: "POST",
  headers: { "content-type": "application/json", origin: "https://cross-origin.example.org" },
  body: JSON.stringify(payload("contact", 405)),
}, 403);

latencies.sort((a, b) => a - b);
const p95 = latencies[Math.ceil(latencies.length * 0.95) - 1];
if (p95 >= 2_500) throw new Error(`p95 ${Math.round(p95)}ms exceeds 2500ms`);
console.log(JSON.stringify({ acceptedScenarioCount: latencies.length, p95Ms: Math.round(p95) }));
