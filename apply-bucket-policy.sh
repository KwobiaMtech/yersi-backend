#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if credentials exist
if [ -z "$WASABI_ACCESS_KEY_ID" ] || [ -z "$WASABI_SECRET_ACCESS_KEY" ]; then
    echo "❌ Error: Wasabi credentials not found in .env"
    exit 1
fi

echo "🔧 Applying public read policy to bucket: $WASABI_BUCKET"
echo "Region: $WASABI_REGION"
echo ""

# Apply bucket policy
AWS_ACCESS_KEY_ID=$WASABI_ACCESS_KEY_ID \
AWS_SECRET_ACCESS_KEY=$WASABI_SECRET_ACCESS_KEY \
aws s3api put-bucket-policy \
  --bucket $WASABI_BUCKET \
  --endpoint-url $WASABI_ENDPOINT \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Sid\": \"PublicReadGetObject\",
        \"Effect\": \"Allow\",
        \"Principal\": \"*\",
        \"Action\": \"s3:GetObject\",
        \"Resource\": \"arn:aws:s3:::$WASABI_BUCKET/*\"
      }
    ]
  }"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Policy applied successfully!"
    echo "Images in the bucket are now publicly accessible"
else
    echo ""
    echo "❌ Failed to apply policy"
    echo "Please apply the policy manually via Wasabi Console"
fi
