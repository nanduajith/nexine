# Self-hosting Nexine

Nexine is a static, client-side application — there is no backend, database, or app server to
operate. Hosting it means serving a folder of static files. Two supported paths:

## Option 1 — Docker (recommended)

The provided image builds the app and serves it with nginx, including the security headers.

```bash
# From the repo root
docker build -f deploy/Dockerfile -t nexine .
docker run --rm -p 8080:80 nexine
# open http://localhost:8080
```

The nginx config ([`deploy/nginx.conf`](../deploy/nginx.conf)) sends the strict no-egress
Content-Security-Policy as a real HTTP header, plus `X-Content-Type-Options`, `Referrer-Policy`,
and a restrictive `Permissions-Policy`.

## Option 2 — Any static host

```bash
pnpm install
pnpm build          # outputs packages/host/dist
```

Serve `packages/host/dist` from any static host (nginx, Caddy, S3 + CloudFront, GitHub Pages, an
internal file server, …). The strict CSP is embedded in `index.html` as a `<meta>` tag, so the app
enforces no-egress even on hosts where you can't set headers. Where you _can_ set headers, mirror
the policy from `deploy/nginx.conf` for defense in depth.

## Air-gapped / offline

Nothing about the app requires internet access at runtime — fonts and all assets are bundled. The
Docker image and the `dist/` folder can be transferred into a disconnected network and served
as-is.

## Verifying no-egress after deployment

1. Open the deployed app, open DevTools → Network, and use the tools. You should see requests only
   to your own origin — never to any third party.
2. Confirm the CSP is present: view source and look for
   `Content-Security-Policy … connect-src 'none'`, or check the response headers.

## Restricting access (SSO)

Because there is no app server, gate _access_ at the edge rather than in the app: put an
OIDC/SAML-aware reverse proxy (e.g. `oauth2-proxy`) in front of the container. This is the
Phase-2/enterprise direction described in [`product-plan.md`](../product-plan.md); the free core is
intentionally open and unauthenticated.
