#!/bin/bash

# Start Nginx reverse proxy experiment (using docker run instead of docker-compose)
# docker-compose has networking issues on macOS, but docker run works perfectly

echo "🐳 Starting Nginx Reverse Proxy Experiment"
echo "==========================================="
echo

# Stop any existing container
if docker ps -a | grep -q nginx-codimd-experiment; then
    echo "Stopping existing Nginx container..."
    docker stop nginx-codimd-experiment 2>/dev/null
    docker rm nginx-codimd-experiment 2>/dev/null
fi

# Start Nginx with docker run (works on macOS)
echo "Starting Nginx container..."
docker run -d \
    --name nginx-codimd-experiment \
    -p 8081:8081 \
    -v "$(pwd)/nginx.experiment.conf:/etc/nginx/conf.d/default.conf:ro" \
    --add-host=host.docker.internal:host-gateway \
    nginx:alpine

if [ $? -eq 0 ]; then
    echo "✅ Nginx container started successfully!"
    echo
    echo "Waiting for Nginx to be ready..."
    sleep 2
    
    # Test the setup
    echo
    echo "Testing Nginx setup:"
    echo "-------------------"
    
    echo -n "1. Root redirect: "
    if curl -s -I http://localhost:8081/ --max-time 2 | grep -q "301"; then
        echo "✅ Working"
    else
        echo "❌ Failed"
    fi
    
    echo -n "2. Main app (/codimd/): "
    if curl -s -I http://localhost:8081/codimd/ --max-time 2 | grep -q "200"; then
        echo "✅ Working"
    else
        echo "❌ Failed"
    fi
    
    echo -n "3. Static assets: "
    if curl -s -I http://localhost:8081/codimd/favicon.png --max-time 2 | grep -q "200"; then
        echo "✅ Working"
    else
        echo "❌ Failed"
    fi
    
    echo
    echo "=========================================="
    echo "✨ Nginx reverse proxy is running!"
    echo
    echo "Access the app at: http://localhost:8081/codimd/"
    echo
    echo "Useful commands:"
    echo "  - View logs: docker logs -f nginx-codimd-experiment"
    echo "  - Stop: docker stop nginx-codimd-experiment"
    echo "  - Remove: docker rm nginx-codimd-experiment"
    echo
else
    echo "❌ Failed to start Nginx container"
    exit 1
fi
