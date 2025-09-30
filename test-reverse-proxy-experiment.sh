#!/bin/bash

# Test script for reverse proxy path rewriting experiment
echo "🧪 Testing Reverse Proxy Path Rewriting Experiment"
echo "=================================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if app is running
echo "1. Checking if CodiMD is running on port 3000..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q "200\|302\|301"; then
    echo -e "   ${GREEN}✅ CodiMD is running on port 3000${NC}"
else
    echo -e "   ${RED}❌ CodiMD is NOT running on port 3000${NC}"
    echo -e "   ${YELLOW}Start it with: npm start${NC}"
    exit 1
fi
echo

# Check if Caddy is running
echo "2. Checking if Caddy is running on port 8080..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ 2>/dev/null | grep -q "301\|200"; then
    echo -e "   ${GREEN}✅ Caddy is running on port 8080${NC}"
else
    echo -e "   ${RED}❌ Caddy is NOT running on port 8080${NC}"
    echo -e "   ${YELLOW}Start it with: caddy run --config Caddyfile.experiment${NC}"
    exit 1
fi
echo

# Test root redirect
echo "3. Testing root redirect (/ → /codimd/)..."
response=$(curl -s -I http://localhost:8080/ 2>/dev/null)
if echo "$response" | grep -q "301 Moved Permanently" && echo "$response" | grep -q "Location:.*codimd"; then
    echo -e "   ${GREEN}✅ Root redirect working${NC}"
else
    echo -e "   ${RED}❌ Root redirect failed${NC}"
    echo "$response"
fi
echo

# Test /codimd redirect to /codimd/
echo "4. Testing /codimd redirect (→ /codimd/)..."
response=$(curl -s -I http://localhost:8080/codimd 2>/dev/null)
if echo "$response" | grep -q "301" && echo "$response" | grep -q "Location:.*codimd/"; then
    echo -e "   ${GREEN}✅ /codimd redirect working${NC}"
else
    echo -e "   ${RED}❌ /codimd redirect failed${NC}"
    echo "$response"
fi
echo

# Test main app access
echo "5. Testing main app access (/codimd/)..."
response=$(curl -s -I http://localhost:8080/codimd/ 2>/dev/null)
if echo "$response" | grep -q "200 OK"; then
    echo -e "   ${GREEN}✅ Main app accessible${NC}"
else
    echo -e "   ${RED}❌ Main app access failed${NC}"
    echo "$response"
fi
echo

# Test static assets
echo "6. Testing static assets (/codimd/favicon.png)..."
response=$(curl -s -I http://localhost:8080/codimd/favicon.png 2>/dev/null)
if echo "$response" | grep -q "200 OK"; then
    echo -e "   ${GREEN}✅ Static assets working${NC}"
else
    echo -e "   ${RED}❌ Static assets failed${NC}"
    echo "$response"
fi
echo

# Test build assets
echo "7. Testing webpack bundles (/codimd/build/...)..."
# Find a build file
buildFile=$(ls public/build/*.eot 2>/dev/null | head -1 | xargs basename 2>/dev/null)
if [ -n "$buildFile" ]; then
    response=$(curl -s -I "http://localhost:8080/codimd/build/$buildFile" 2>/dev/null)
    if echo "$response" | grep -q "200 OK"; then
        echo -e "   ${GREEN}✅ Build assets working${NC}"
    else
        echo -e "   ${RED}❌ Build assets failed${NC}"
        echo "$response"
    fi
else
    echo -e "   ${YELLOW}⚠️  No build files found to test${NC}"
fi
echo

# Test what the app receives (check headers)
echo "8. Checking what app receives from Caddy..."
echo "   Testing if X-Forwarded-Prefix header is passed..."
# This would need app logging to verify
echo -e "   ${YELLOW}ℹ️  Check app logs to verify X-Forwarded-Prefix: /codimd${NC}"
echo

# Test direct app access (should work at root)
echo "9. Testing direct app access (without proxy)..."
response=$(curl -s -I http://localhost:3000/ 2>/dev/null)
if echo "$response" | grep -q "200\|302\|301"; then
    echo -e "   ${GREEN}✅ App works at root (no URL path mounting)${NC}"
    echo -e "   ${YELLOW}ℹ️  This means path rewriting experiment is active${NC}"
else
    echo -e "   ${YELLOW}⚠️  App response: $(echo "$response" | head -1)${NC}"
fi
echo

echo "=================================================="
echo "🎯 Experiment Status Summary"
echo "=================================================="
echo
echo "The reverse proxy path rewriting approach requires:"
echo "1. ✅ Caddy to strip /codimd prefix before forwarding"
echo "2. ✅ App to run at root (no URL path mounting)"
echo "3. ⚠️  App to generate URLs with /codimd (via serverURL config)"
echo "4. ⚠️  Socket.IO path rewriting in Caddy"
echo
echo "Access the app at: http://localhost:8080/codimd/"
echo
