# Outline v1.12.0 URL-subpath deployment (experimental)

This feature branch adds experimental support for hosting Outline at a path such as
`https://example.com/outline/`, without requiring a dedicated subdomain.

**Status:** The port is under development. Do not deploy to production until the
GitHub Actions TypeScript, lint, app, shared, and server tests pass and the smoke
tests below have been performed.

## Environment

Set the application's **public** URL including the prefix:

```dotenv
URL=https://example.com/outline
PORT=3000
# Leave CDN_URL unset unless using an external CDN.
CDN_URL=
PROXY_HEADERS_TRUSTED=true
```

Do not separately configure `BASE_PATH`: the server derives it from the `URL`
path and exposes it to the browser. The `COLLABORATION_URL` setting can remain
unset if collaboration shares the same public URL. When separated onto a different
service, set it to the fully qualified public URL including any path prefix.

## Nginx example

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    # Configure ssl_certificate and ssl_certificate_key here.
    client_max_body_size 100m;

    location = /outline {
        return 308 /outline/;
    }

    location ^~ /outline/ {
        # IMPORTANT: no trailing slash on proxy_pass. Preserve the /outline prefix.
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }

    # RFC 8414/9728 OAuth discovery is intentionally hosted at the origin root,
    # even when the application itself lives under /outline.
    location ~ ^/\.well-known/oauth-(authorization-server|protected-resource)/outline(/|$) {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

For a multi-segment prefix (e.g. `/apps/knowledge`), change **both** the
`URL` setting and the matching Nginx `location` patterns. Do not rewrite
`/outline` away before proxying to Outline.

## Smoke tests

1. Open `/outline/` and navigate directly to a deeply nested document; reload.
2. Verify scripts, CSS, images, PDF/video attachments, and uploaded files load.
3. Test OAuth/OIDC sign-in, sign-out, passkeys (where enabled), and cookie paths.
4. Open two browsers on the same document and verify real-time collaboration.
5. Verify `/outline/api/`, `/outline/mcp`, and OAuth discovery metadata.
6. Test public shares, sitemap, Markdown export, navigation, and desktop links.
7. Repeat a basic smoke test with `URL=https://example.com` (root mode).

No database migration should be necessary for URL-path changes; retain a current
backup and review exported document URLs when migrating an existing deployment.
