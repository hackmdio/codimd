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

## Expected Issues to Solve

1. ❓ Socket.IO path - needs special Caddy handling
2. ❓ OAuth redirects - may need adjustment
3. ❓ Asset URLs - should work if templates use serverURL correctly
4. ❓ API calls - client-side code needs to use serverURL
