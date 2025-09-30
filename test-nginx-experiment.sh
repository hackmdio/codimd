#!/bin/bash

# Test script for CodiMD with Nginx reverse proxy (Docker)
echo "🐳 Testing CodiMD with Nginx Reverse Proxy (Docker)"
echo "===================================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "0. Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "   ${RED}❌ Docker is not running${NC}"
    echo -e "   ${YELLOW}Please start Docker Desktop${NC}"
    exit 1
fi
echo -e "   ${GREEN}✅ Docker is running${NC}"
echo

# Check if app is running
echo "1. Checking if CodiMD is running on port 3000..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q "200\|302\|301"; then
    echo -e "   ${GREEN}✅ CodiMD is running on port 3000${NC}"
else
    echo -e "   ${RED}❌ CodiMD is NOT running on port 3000${NC}"
    echo -e "   ${YELLOW}Start it with: NODE_ENV=development npm start${NC}"
    exit 1
fi
echo

# Check if Nginx container is running
echo "2. Checking if Nginx container is running..."
if docker ps | grep -q codimd-nginx-experiment; then
    echo -e "   ${GREEN}✅ Nginx container is running${NC}"
else
    echo -e "   ${RED}❌ Nginx container is NOT running${NC}"
    echo -e "   ${YELLOW}Start it with: docker-compose -f docker-compose.nginx-experiment.yml up -d${NC}"
    exit 1
fi
echo

# Test root redirect
echo "3. Testing root redirect (/ → /codimd/)..."
response=$(curl -s -I http://localhost:8081/ 2>/dev/null)
if echo "$response" | grep -q "301 Moved Permanently" && echo "$response" | grep -q "Location:.*codimd"; then
    echo -e "   ${GREEN}✅ Root redirect working${NC}"
else
    echo -e "   ${RED}❌ Root redirect failed${NC}"
    echo "$response" | head -5
fi
echo

# Test /codimd redirect to /codimd/
echo "4. Testing /codimd redirect (→ /codimd/)..."
response=$(curl -s -I http://localhost:8081/codimd 2>/dev/null)
if echo "$response" | grep -q "301" && echo "$response" | grep -q "Location:.*codimd/"; then
    echo -e "   ${GREEN}✅ /codimd redirect working${NC}"
else
    echo -e "   ${RED}❌ /codimd redirect failed${NC}"
    echo "$response" | head -5
fi
echo

# Test main app access
echo "5. Testing main app access (/codimd/)..."
response=$(curl -s -I http://localhost:8081/codimd/ 2>/dev/null)
if echo "$response" | grep -q "200 OK"; then
    echo -e "   ${GREEN}✅ Main app accessible${NC}"
else
    echo -e "   ${RED}❌ Main app access failed${NC}"
    echo "$response" | head -5
fi
echo

# Test static assets
echo "6. Testing static assets (/codimd/favicon.png)..."
response=$(curl -s -I http://localhost:8081/codimd/favicon.png 2>/dev/null)
if echo "$response" | grep -q "200 OK"; then
    echo -e "   ${GREEN}✅ Static assets working${NC}"
else
    echo -e "   ${RED}❌ Static assets failed${NC}"
    echo "$response" | head -5
fi
echo

# Test build assets
echo "7. Testing webpack bundles (/codimd/build/...)..."
buildFile=$(ls public/build/*.eot 2>/dev/null | head -1 | xargs basename 2>/dev/null)
if [ -n "$buildFile" ]; then
    response=$(curl -s -I "http://localhost:8081/codimd/build/$buildFile" 2>/dev/null)
    if echo "$response" | grep -q "200 OK"; then
        echo -e "   ${GREEN}✅ Build assets working${NC}"
    else
        echo -e "   ${RED}❌ Build assets failed${NC}"
        echo "$response" | head -5
    fi
else
    echo -e "   ${YELLOW}⚠️  No build files found to test${NC}"
fi
echo

# Test CSS assets
echo "8. Testing CSS assets (/codimd/css/...)..."
response=$(curl -s -I http://localhost:8081/codimd/css/font.css 2>/dev/null)
if echo "$response" | grep -q "200 OK"; then
    echo -e "   ${GREEN}✅ CSS assets working${NC}"
else
    echo -e "   ${RED}❌ CSS assets failed${NC}"
    echo "$response" | head -5
fi
echo

# Check Nginx logs
echo "9. Checking Nginx configuration..."
echo -e "   ${BLUE}ℹ️  Nginx config test:${NC}"
docker exec codimd-nginx-experiment nginx -t 2>&1 | sed 's/^/   /'
echo

# Show recent Nginx access logs
echo "10. Recent Nginx access logs (last 5 requests):"
docker exec codimd-nginx-experiment tail -5 /var/log/nginx/codimd-access.log 2>/dev/null | sed 's/^/   /' || echo -e "   ${YELLOW}⚠️  No logs available yet${NC}"
echo

echo "===================================================="
echo "🎯 Nginx Experiment Status Summary"
echo "===================================================="
echo
echo "The Nginx reverse proxy approach:"
echo "1. ✅ Nginx strips /codimd prefix before forwarding"
echo "2. ✅ App runs at root (no URL path mounting)"
echo "3. ⚠️  App generates URLs with /codimd (via serverURL config)"
echo "4. ⚠️  WebSocket/Socket.IO path rewriting configured"
echo
echo -e "${GREEN}Access the app at: http://localhost:8081/codimd/${NC}"
echo
echo "Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.nginx-experiment.yml logs -f"
echo "  - Stop Nginx: docker-compose -f docker-compose.nginx-experiment.yml down"
echo "  - Restart: docker-compose -f docker-compose.nginx-experiment.yml restart"
echo
