# Image Upload Flow

## Overview
The application supports image uploads to Wasabi storage with automatic fallback to default images.

## Upload Endpoint

### POST `/api/v1/upload/image`

Upload an image to Wasabi storage.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`
- Allowed formats: JPEG, JPG, PNG, WebP
- Max size: 5MB

**Response:**
```json
{
  "url": "https://s3.us-east-1.wasabisys.com/yersi-uploads/items/uuid.jpg",
  "message": "Image uploaded successfully"
}
```

## Environment Variables

Add these to your `.env` file:

```env
WASABI_REGION=us-east-1
WASABI_BUCKET=yersi-uploads
WASABI_ENDPOINT=https://s3.us-east-1.wasabisys.com
WASABI_ACCESS_KEY_ID=your_access_key
WASABI_SECRET_ACCESS_KEY=your_secret_key
```

## Order Flow with Images

### 1. Upload Image (Optional)
```bash
curl -X POST http://localhost:3000/api/v1/upload/image \
  -F "file=@/path/to/image.jpg"
```

### 2. Create Order with Image URL
```json
{
  "serviceId": "507f1f77bcf86cd799439020",
  "items": [
    {
      "itemId": "item1",
      "name": "Shirt",
      "category": "Tops",
      "categoryId": "cat1",
      "quantity": 2,
      "weight": 0.5,
      "icon": "https://s3.us-east-1.wasabisys.com/yersi-uploads/items/uuid.jpg"
    }
  ]
}
```

### 3. Order Response with Default Image Fallback

If no `icon` is provided, the response automatically includes a default placeholder:

```json
{
  "id": "order123",
  "items": [
    {
      "itemId": "item1",
      "name": "Shirt",
      "icon": "https://s3.us-east-1.wasabisys.com/yersi-uploads/defaults/item-placeholder.png",
      "quantity": 2
    }
  ]
}
```

## Default Image

**URL:** `https://s3.us-east-1.wasabisys.com/yersi-uploads/defaults/item-placeholder.png`

All order responses automatically include this default image if no icon is provided for an item.

## Wasabi Configuration

Wasabi is S3-compatible storage. The application uses the AWS SDK with Wasabi endpoints:
- Endpoint format: `https://s3.{region}.wasabisys.com`
- Supports all standard S3 operations
- No ACL parameter needed (bucket-level permissions)

## Schema Changes

### OrderItemDto
- Added optional `icon` field

### Order Schema
- Items array now includes optional `icon` field
- Stored as part of order history (snapshot pattern)

## Benefits

1. **Historical Accuracy** - Orders preserve the image shown at order time
2. **Performance** - No additional queries needed to fetch item images
3. **Reliability** - Orders remain complete even if items are deleted
4. **User Experience** - Always shows an image (default fallback)
5. **Cost Effective** - Wasabi offers lower storage costs than AWS S3
