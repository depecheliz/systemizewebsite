# Systemize Method — Website

Marketing website for Systemize, a digital-systems and AI business-systems
company founded by Liz Beaty. Static site: plain HTML, Tailwind CSS (via
CDN), and vanilla JavaScript — no build tooling, no framework, no npm
dependencies to install.

## Local preview

No build step is required. Serve the folder with any static file server, for example:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

or, with Node installed:

```bash
npx serve .
```

## Project structure

```
index.html              Homepage
privacy.html             Privacy Policy
terms.html               Terms of Service
404.html                 Custom not-found page (served automatically by Netlify)
styles.css               Design tokens, custom styles, animation
script.js                Nav, mobile menu, scroll-reveal, hero interaction, form handling
vapor-text-effect.js     Hero "Strategy / Systems / Build." text-cycling effect
robots.txt, sitemap.xml  Search-engine directives
favicon.svg, favicon-*.png, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest
og-systemize.jpg         Open Graph / Twitter share image (1200×630)
images/                  Founder photo + representative-system photography
netlify.toml             Build settings, redirects, security headers
```

## Deployment (Netlify)

- **Build command:** `echo 'Static site — no build step required'` (there is nothing to compile)
- **Publish directory:** `.` (repository root)
- **Production branch:** `main`

Connect this repository in Netlify (New site → Import an existing project →
GitHub → select this repo), confirm the build settings above are picked up
from `netlify.toml`, and deploy. Netlify will auto-detect the contact form
(`<form data-netlify="true">` in `index.html`) at deploy time — no server
code or environment variables are required for the form to work.

## Environment variables

**None are currently required.** Analytics (GA4 / Microsoft Clarity) are
scaffolded but intentionally commented out in `index.html` until real
measurement IDs exist — do not uncomment with placeholder IDs. If analytics
are added later, prefer setting the ID as a Netlify environment variable
and injecting it at build time rather than hardcoding it, if a build step
is introduced.

## Domain

Production domain: **systemizemethod.com** (apex is canonical; `www` 301s to
the apex — see `netlify.toml`). DNS is managed in GoDaddy. In Netlify:

1. Add both `systemizemethod.com` and `www.systemizemethod.com` as custom domains on this site.
2. Set `systemizemethod.com` as the primary domain.
3. In GoDaddy DNS, add only the records Netlify's domain-setup screen displays at the time of setup (values can change; don't reuse memorized ones). This is typically an apex A/ALIAS record plus a `CNAME` for `www` pointing at the Netlify-provided hostname.
4. Do **not** remove existing MX, SPF, DKIM, DMARC, or Google Workspace / Microsoft 365 records — email delivery depends on them.
5. Wait for DNS propagation, then confirm Netlify has provisioned the managed SSL certificate and that both `https://systemizemethod.com` and `https://www.systemizemethod.com` load over HTTPS with no redirect loop.

## Rollback

Netlify keeps every deploy; if a production deploy needs to be rolled back,
use **Deploys → [previous deploy] → Publish deploy** in the Netlify UI to
re-publish the last known-good build without a new commit. On the Git side,
the last stable commit is tagged/noted in the deploy's commit message.
