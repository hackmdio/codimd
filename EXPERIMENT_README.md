# Reverse Proxy Path Rewriting Experiment

This branch tests a **reverse proxy-only approach** where:
- **App runs at root** (no URL path mounting in Express)
- **App is aware of the URL path** (for generating correct URLs in templates)
- **Caddy handles all path rewriting** (strips `/codimd` before forwarding)

## Configuration

### App Configuration (config.json)
```json
{
  "urlPath": "codimd",  // App knows it's at /codimd for URL generation
  "domain": "localhost",
  "urlAddPort": true
}
```

### Caddy Configuration (Caddyfile.experiment)
Caddy will:
1. Strip `/codimd` prefix before forwarding to app
2. App receives requests as if running at root
3. App generates URLs with `/codimd` prefix (via serverURL)

## Key Differences from Main PR

| Aspect | Main PR Approach | This Experiment |
|--------|------------------|-----------------|
| Express mounting | Mounts at `/codimd` | Mounts at `/` |
| Path handling | App handles path | Caddy strips path |
| URL generation | Uses serverURL with path | Uses serverURL with path |
| Standalone mode | ✅ Works | ❌ Requires proxy |
| Socket.IO | App configures path | Caddy rewrites path |

## Testing

1. Start app (runs at root internally):
   ```bash
   npm start
   ```

2. Start Caddy with path rewriting:
   ```bash
   caddy run --config Caddyfile.experiment
   ```

3. Access at: `http://localhost:8080/codimd/`

## Test Results ✅

All tests passing! The reverse proxy path rewriting approach works:

1. ✅ **Root redirect** - `/` → `/codimd/` (301)
2. ✅ **Path redirect** - `/codimd` → `/codimd/` (301)
3. ✅ **Main app** - Accessible at `/codimd/`
4. ✅ **Static assets** - `/codimd/favicon.png` works
5. ✅ **Build assets** - `/codimd/build/...` works
6. ✅ **Path stripping** - Caddy strips `/codimd` before forwarding
7. ✅ **Headers** - `X-Forwarded-Prefix: /codimd` passed to app

## Key Learnings

### What Works

- **Caddy `route` directive** for proper path matching (order-sensitive)
- **`path_regexp`** for exact path matching (avoid wildcards conflicting)
- **`uri strip_prefix`** successfully strips path before forwarding
- **App runs at root** but generates URLs with `/codimd` prefix (via serverURL config)
- **Static assets** work because templates use `serverURL` correctly

### Potential Issues (To Test)

1. ⚠️ **Socket.IO** - Path rewriting configured, needs live testing
2. ⚠️ **OAuth redirects** - Callback URLs may need adjustment  
3. ⚠️ **Standalone mode** - App REQUIRES reverse proxy (won't work without it)
4. ⚠️ **Cookie paths** - May need to check if session cookies work correctly
