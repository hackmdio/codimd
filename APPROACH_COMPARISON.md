# URL Path Configuration: Approach Comparison

This document compares two approaches for handling `CMD_URL_PATH` configuration in CodiMD.

## Approach 1: Application Handles URL Path (Main PR #1943)

**Branch:** `bugfix/1936-404-errors-when-using-cmd_url_path-in-new-260`

### How It Works

1. App mounts routes and static assets at URL path prefix (e.g., `/codimd`)
2. Express handles all path routing internally
3. Works standalone or behind reverse proxy

### Configuration

**App (app.js):**
```javascript
const urlPathPrefix = config.urlPath ? `/${config.urlPath}` : ''
app.use(urlPathPrefix + '/', express.static(...))
app.use(urlPathPrefix, require('./lib/routes').router)
```

**Reverse Proxy (Caddy):**
```caddyfile
:8080 {
    # Just pass everything through - app handles the path
    handle /codimd* {
        reverse_proxy localhost:3000
    }
    redir / /codimd/ 301
}
```

### Pros ✅

- ✅ **Works standalone** - No reverse proxy required
- ✅ **Simpler proxy config** - Just pass through requests
- ✅ **Flexible deployment** - Docker, Kubernetes, bare metal, etc.
- ✅ **Backward compatible** - No breaking changes
- ✅ **Single source of truth** - App controls its URL structure

### Cons ❌

- ❌ **More app code** - Logic in application layer
- ❌ **Code duplication** - Some if/else blocks (though minimized)

---

## Approach 2: Reverse Proxy Handles URL Path (Experiment)

**Branch:** `experiment/reverse-proxy-path-rewriting`

### How It Works

1. App runs at root path (no URL path mounting)
2. Reverse proxy strips path prefix before forwarding
3. App still generates URLs with prefix (via serverURL config)

### Configuration

**App (app.js):**
```javascript
// No URL path mounting - runs at root
app.use('/', express.static(...))
app.use(require('./lib/routes').router)

// But serverURL still includes path for URL generation
config.serverURL = 'http://localhost:3000/codimd'
```

**Reverse Proxy (Caddy):**
```caddyfile
:8080 {
    # Redirect root
    route {
        @root path_regexp ^/$
        redir @root /codimd/ 301
    }
    
    # Strip path and forward
    route /codimd/* {
        uri strip_prefix /codimd
        reverse_proxy localhost:3000 {
            header_up X-Forwarded-Prefix /codimd
        }
    }
}
```

### Pros ✅

- ✅ **Cleaner app code** - No URL path mounting logic
- ✅ **Separation of concerns** - Path handling in proxy layer
- ✅ **Proxy controls routing** - Easier to change paths without app changes

### Cons ❌

- ❌ **REQUIRES reverse proxy** - Won't work standalone
- ❌ **Complex proxy config** - Must handle path stripping correctly
- ❌ **Harder to debug** - Path transformation happens outside app
- ❌ **Socket.IO complexity** - WebSocket path rewriting needed
- ❌ **OAuth callback issues** - May need special handling
- ❌ **Cookie path issues** - Session cookies may not work correctly

---

## Test Results

### Approach 1 (Main PR) - FULLY TESTED ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Static assets | ✅ Pass | All assets load correctly |
| Build bundles | ✅ Pass | Webpack assets working |
| Routes | ✅ Pass | All routes accessible |
| Redirects | ✅ Pass | No redirect loops |
| Socket.IO | ✅ Pass | WebSocket connections work |
| Standalone | ✅ Pass | Works without proxy |
| With proxy | ✅ Pass | Works with Caddy/Nginx |

### Approach 2 (Experiment) - PARTIALLY TESTED ⚠️

| Feature | Status | Notes |
|---------|--------|-------|
| Static assets | ✅ Pass | Assets load via path stripping |
| Build bundles | ✅ Pass | Webpack assets working |
| Routes | ✅ Pass | Main routes accessible |
| Redirects | ✅ Pass | Root and path redirects work |
| Socket.IO | ⚠️ Unknown | Config present, not tested live |
| Standalone | ❌ Fail | REQUIRES reverse proxy |
| OAuth | ⚠️ Unknown | Not tested |
| Cookies | ⚠️ Unknown | Session paths not verified |

---

## Recommendation

### For Production: Use Approach 1 (Main PR) ✅

**Why:**
1. **Flexibility** - Works in any deployment scenario
2. **Tested** - All features verified working
3. **Simple** - Proxy config is straightforward
4. **Reliable** - App has full control over routing

### For Experiment: Approach 2 is Viable ⚠️

**When to use:**
- You always run behind a reverse proxy (Kubernetes ingress, etc.)
- You want path routing completely separated from app
- You're willing to handle edge cases (OAuth, WebSockets, cookies)

**When NOT to use:**
- Need standalone deployment
- Running locally for development
- Can't guarantee reverse proxy presence

---

## Working Configurations

### Approach 1: Caddy with App Handling Path

```caddyfile
{
    auto_https off
}

:8080 {
    # App handles everything - just pass through
    handle /codimd* {
        reverse_proxy localhost:3000
    }
    
    redir / /codimd/ 301
    
    log {
        output stdout
        level INFO
    }
}
```

### Approach 2: Caddy with Path Stripping

```caddyfile
{
    auto_https off
}

:8080 {
    log {
        output stdout
        level INFO
    }
    
    # Redirect root
    route {
        @root path_regexp ^/$
        redir @root /codimd/ 301
    }
    
    # Redirect /codimd to /codimd/
    route {
        @codimd_exact path_regexp ^/codimd$
        redir @codimd_exact /codimd/ 301
    }
    
    # Handle Socket.IO
    route /codimd/socket.io/* {
        uri strip_prefix /codimd
        reverse_proxy localhost:3000 {
            header_up X-Forwarded-Prefix /codimd
        }
    }
    
    # Handle all other /codimd/* requests
    route /codimd/* {
        uri strip_prefix /codimd
        reverse_proxy localhost:3000 {
            header_up X-Forwarded-Prefix /codimd
        }
    }
}
```

---

## Nginx Equivalent Configs

### Approach 1: Nginx with App Handling Path

```nginx
server {
    listen 8080;
    server_name localhost;
    
    # App handles everything - just pass through
    location /codimd {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Redirect root
    location = / {
        return 301 /codimd/;
    }
}
```

### Approach 2: Nginx with Path Stripping ✅

**Status: WORKING!** Use the provided `start-nginx-experiment.sh` script.

```nginx
server {
    listen 8081;
    server_name localhost;
    
    # Redirect root
    location = / {
        return 301 /codimd/;
    }
    
    # Redirect /codimd to /codimd/
    location = /codimd {
        return 301 /codimd/;
    }
    
    # Strip /codimd and forward
    location /codimd/ {
        rewrite ^/codimd/(.*)$ /$1 break;
        proxy_pass http://host.docker.internal:3000;  # For Docker
        # proxy_pass http://localhost:3000;  # For bare metal
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /codimd;
    }
}
```

**Start with:** `./start-nginx-experiment.sh` (uses `docker run`, works on macOS)

---

## Conclusion

**✅ Recommend Approach 1 (Main PR #1943)** for production use:
- Proven to work in all scenarios
- Simpler to deploy and maintain
- No reverse proxy dependency

**⚠️ Approach 2 (Experiment)** is interesting but has limitations:
- Successfully demonstrates path stripping
- Requires reverse proxy (not standalone)
- Needs more testing for edge cases

Both approaches are technically valid, but Approach 1 offers better flexibility and has been thoroughly tested.
