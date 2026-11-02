MAHATOOLS ADMIN BACKEND STARTER
================================

This project preserves the uploaded MahaTools static website and adds a Cloudflare Worker API, D1 binding configuration, visitor heartbeat tracking, and /admin UI.

IMPORTANT LIMITATIONS
- This is a deployment starter, not yet deployed to your live site.
- Do not paste src_worker.js into the current static-assets-only editor and deploy. Use a project deployment that supports a Worker entry point plus the public/ assets folder (for example Wrangler CLI or a Git-connected Cloudflare Workers deployment).
- The existing D1 tables were created in your account. Do not run destructive SQL. migrations/0001_init.sql uses IF NOT EXISTS.
- Set Worker secrets before deployment:
  ADMIN_EMAIL = ajinathmaharnor6@gmail.com (plain text variable)
  ADMIN_PASSWORD = choose a strong unique password (Secret)
  SESSION_SECRET = a long random secret (Secret; 32+ random characters)
- Never share ADMIN_PASSWORD, SESSION_SECRET, or Cloudflare API tokens in chat or screenshots.
- Admin login is at /admin. Session cookie is HttpOnly, Secure, SameSite=Strict and expires after 8 hours.
- Live users are estimated from anonymous browser heartbeats; a user is considered online if last_seen is within 120 seconds. Counts may be approximate.
- Earnings are manual records for now. AdSense API is not connected; paid checkout/payment gateway is not implemented. No real payment is collected.
- Tools management writes records to D1, but this starter does not yet dynamically rebuild the static homepage/tool cards or implement paid gating. Existing 48 static tool pages remain as they are.
- Visitor tracking stores a random browser ID, session ID, page path and timestamps; disclose this in your privacy policy/cookie notice as appropriate.
- Before production, test login, session expiry, APIs, and backup/restore.

FILES
- public/: original 48-tool website + /admin/index.html
- src_worker.js: API and static asset router
- wrangler.jsonc: Worker, assets, and D1 binding configuration
- migrations/0001_init.sql: non-destructive schema reference
- migrations/0002_seed_tools.sql: seeds the 48 existing catalog entries into D1

Deployment requires Node.js + Wrangler or a Git-connected build pipeline. A mobile-only Cloudflare dashboard static-assets editor cannot deploy this complete project by editing worker.js alone.
