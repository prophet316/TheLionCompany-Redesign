module.exports = async function seedProtectedLighthouseCookie(browser, context) {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) return;
  const expected = new URL(process.env.LIGHTHOUSE_BASE_URL ?? context.url);
  const current = new URL(context.url);
  if (expected.origin !== current.origin || current.protocol !== "https:" || !current.hostname.endsWith(".vercel.app") || current.username || current.password) {
    throw new Error("Lighthouse protection target is not the exact bound HTTPS Vercel deployment origin");
  }
  const seedURL = new URL("/", current);
  const response = await fetch(seedURL, {
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "x-vercel-protection-bypass": secret,
      "x-vercel-set-bypass-cookie": "true",
    },
  });
  if (response.status !== 200 || response.headers.has("location")) throw new Error(`deployment-protection seed returned ${response.status}`);
  const setCookies = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean);
  const cookieHeader = setCookies.find((value) => /^_vercel_jwt=/i.test(value));
  if (!cookieHeader || !/(?:^|;)\s*Secure(?:;|$)/i.test(cookieHeader) || /(?:^|;)\s*Domain=/i.test(cookieHeader)) {
    throw new Error("Vercel bypass cookie must be Secure and host-only");
  }
  const pair = cookieHeader.match(/^_vercel_jwt=([^;]+)/i)?.[1];
  if (!pair) throw new Error("origin-scoped Vercel bypass cookie was not returned");
  await browser.defaultBrowserContext().setCookie({
    name: "_vercel_jwt",
    value: pair,
    url: current.origin,
    secure: true,
    httpOnly: true,
  });
};
