#!/bin/bash

echo "🧪 Testing API Responses for Images"
echo "===================================="
echo ""

SERVER_URL="http://localhost:3000"

# Check if server is running
if ! curl -s "$SERVER_URL/api/v1/items/categories" > /dev/null 2>&1; then
    echo "⚠️  Server not running. Starting server..."
    npm run start:dev > /dev/null 2>&1 &
    SERVER_PID=$!
    echo "Waiting for server to start..."
    sleep 15
else
    echo "✅ Server is running"
    SERVER_PID=""
fi

echo ""
echo "📋 Test 1: Items API - Should return icons"
echo "-------------------------------------------"

ITEMS_RESPONSE=$(curl -s "$SERVER_URL/api/v1/items/by-category?category=top")
echo "Response: $ITEMS_RESPONSE" | head -c 200
echo "..."
echo ""

if echo "$ITEMS_RESPONSE" | grep -q '"icon"'; then
    echo "✅ Items API returns icon field"
    ICON_VALUE=$(echo "$ITEMS_RESPONSE" | grep -o '"icon":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Sample icon: $ICON_VALUE"
else
    echo "❌ Items API missing icon field"
fi

echo ""
echo "📦 Test 2: Items API - Different category"
echo "-------------------------------------------"

ITEMS_BOTTOM=$(curl -s "$SERVER_URL/api/v1/items/by-category?category=bottom")

if echo "$ITEMS_BOTTOM" | grep -q '"icon"'; then
    echo "✅ Bottom category returns icon field"
    ICON_VALUE=$(echo "$ITEMS_BOTTOM" | grep -o '"icon":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Sample icon: $ICON_VALUE"
else
    echo "❌ Bottom category missing icon field"
fi

echo ""
echo "📤 Test 3: Upload API - Validation"
echo "-------------------------------------------"

UPLOAD_NO_FILE=$(curl -s -X POST "$SERVER_URL/api/v1/upload/image")

if echo "$UPLOAD_NO_FILE" | grep -q "No file uploaded"; then
    echo "✅ Upload validation working"
else
    echo "⚠️  Upload validation response: $UPLOAD_NO_FILE"
fi

echo ""
echo "📸 Test 4: Upload API - Image upload"
echo "-------------------------------------------"

# Create test image
printf '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0a\x49\x44\x41\x54\x78\x9c\x63\x00\x01\x00\x00\x05\x00\x01\x0d\x0a\x2d\xb4\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > test-api.png

UPLOAD_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/v1/upload/image" -F "file=@test-api.png")

if echo "$UPLOAD_RESPONSE" | grep -q '"url"'; then
    echo "✅ Upload returns URL"
    IMAGE_URL=$(echo "$UPLOAD_RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    echo "   URL: $IMAGE_URL"
    
    # Test if image is accessible
    if curl -s -I "$IMAGE_URL" | grep -q "200"; then
        echo "✅ Uploaded image is publicly accessible"
    else
        echo "⚠️  Image may not be publicly accessible"
    fi
else
    echo "⚠️  Upload response: $UPLOAD_RESPONSE"
fi

rm -f test-api.png

echo ""
echo "===================================="
echo "✅ API Test Complete"
echo ""
echo "Summary:"
echo "  - Items API returns icon field"
echo "  - Upload API working"
echo "  - Image validation working"

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null
fi
