#!/bin/bash
# WebSocket Test using curl
# Tests the WebSocket upgrade handshake with Basic Auth

PORT=${PORT:-3001}
HOST=${HOST:-localhost}
USERNAME=${DASHBOARD_USERNAME:-admin}
PASSWORD=${DASHBOARD_PASSWORD:-admin}

echo "========================================"
echo "WebSocket Handshake Test (curl)"
echo "========================================"
echo "Host: $HOST:$PORT"
echo "Username: $USERNAME"
echo ""

# Create Base64 encoded credentials
CREDENTIALS=$(echo -n "$USERNAME:$PASSWORD" | base64)

# Test the WebSocket upgrade endpoint
echo "Testing WebSocket upgrade with authentication..."
echo ""

# Using curl to test the upgrade request
# Note: curl 7.86.0+ supports --ws
if curl --version 2>/dev/null | head -1 | grep -q "curl 7\\.[89][0-9]\\|curl [8-9]"; then
    echo "Using native WebSocket support..."
    curl -s -o /dev/null -w "HTTP Code: %{http_code}\n" \
        -H "Authorization: Basic $CREDENTIALS" \
        -H "Connection: Upgrade" \
        -H "Upgrade: websocket" \
        -H "Sec-WebSocket-Version: 13" \
        -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
        "https://$HOST:$PORT/ws" -k 2>/dev/null || \
    echo "Connection failed"
else
    echo "Testing with standard curl..."
    # Just test if the endpoint exists (will return 400 or 401 without proper headers)
    RESPONSE=$(curl -s -w "\nHTTP\n%{http_code}" \
        -H "Authorization: Basic $CREDENTIALS" \
        "https://$HOST:$PORT/ws" -k 2>/dev/null || echo "ERR")
    
    if echo "$RESPONSE" | grep -q "HTTP"; then
        HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP" | cut -d' ' -f2)
        echo "HTTP Status: $HTTP_CODE"
        if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "426" ]; then
            echo "[✓] Endpoint is accessible (got $HTTP_CODE - expected for WebSocket)"
        elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
            echo "[✗] Authentication failed - check credentials"
        elif [ "$HTTP_CODE" = "404" ]; then
            echo "[✗] Endpoint not found - check server is running with WebSocket enabled"
        fi
    else
        echo "[✗] Could not connect - is the server running?"
    fi
fi

echo ""
echo "========================================"
echo "Node.js WebSocket Test (requires 'ws' package)"
echo "========================================"
echo "Run: node test-websocket.js"
echo ""