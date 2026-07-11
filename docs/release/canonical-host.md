# Canonical host control

The production canonical origin is `https://www.thelioncompany.org`.

In the existing Vercel project Domains settings:

1. Keep `www.thelioncompany.org` as the primary production domain.
2. Configure `thelioncompany.org` to redirect permanently to `https://www.thelioncompany.org`.
3. Keep Wix nameservers and all unrelated DNS records unchanged.
4. Do not create a repository redirect that points apex traffic through a second host.

Release verification runs:

```bash
curl -sSIL --max-redirs 0 http://thelioncompany.org/
curl -sSIL --max-redirs 0 https://thelioncompany.org/
curl -sSIL --max-redirs 0 http://www.thelioncompany.org/
curl -sSIL --max-redirs 0 https://www.thelioncompany.org/
```

The first three responses must be a single 308 whose `Location` is `https://www.thelioncompany.org/`; the fourth must be 200. Attach the dated headers to the release record before promotion.
