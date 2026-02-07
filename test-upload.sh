#!/bin/bash

# Upload Test Script
# This script tests the image upload endpoint with a real image file

echo "🧪 Testing Image Upload Flow"
echo "================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with Wasabi credentials"
    exit 1
fi

# Check if server is running
SERVER_URL="http://localhost:3000"
if ! curl -s "$SERVER_URL/api/v1/upload/image" > /dev/null 2>&1; then
    echo "❌ Error: Server is not running at $SERVER_URL"
    echo "Please start the server with: npm run start:dev"
    exit 1
fi

echo "✅ Server is running"

# Create a test image (1x1 pixel PNG)
TEST_IMAGE="test-upload.png"
echo "📝 Creating test image: $TEST_IMAGE"

# Create a minimal valid PNG file
printf '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0a\x49\x44\x41\x54\x78\x9c\x63\x00\x01\x00\x00\x05\x00\x01\x0d\x0a\x2d\xb4\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > $TEST_IMAGE

echo "📤 Uploading image to $SERVER_URL/api/v1/upload/image"

# Upload the image
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/v1/upload/image" \
  -F "file=@$TEST_IMAGE")

HTTP_CODE=$?

echo ""
echo "Response: $RESPONSE"
echo ""

# Clean up test file
rm -f $TEST_IMAGE

# Check result
if [ $HTTP_CODE -eq 0 ]; then
    echo "✅ Upload successful!"
    IMAGE_URL=$(echo "$RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$IMAGE_URL" ]; then
        echo "📸 Image URL: $IMAGE_URL"
        echo ""
        echo "🔍 Testing image accessibility..."
        if curl -s -I "$IMAGE_URL" | grep -q "200"; then
            echo "✅ Image is publicly accessible"
        else
            echo "⚠️  Warning: Image may not be publicly accessible"
            echo "   Check your Wasabi bucket policy"
        fi
    fi
else
    echo "❌ Upload failed"
    echo "Response: $RESPONSE"
    echo ""
    echo "Common issues:"
    echo "  - Check WASABI_ACCESS_KEY_ID in .env"
    echo "  - Check WASABI_SECRET_ACCESS_KEY in .env"
    echo "  - Verify bucket exists and region is correct"
    echo "  - Ensure bucket has proper permissions"
fi

echo ""
echo "================================"
echo "Test complete"
